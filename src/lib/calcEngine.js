// ── محرّك الآلة الحاسبة ──
// منطق نقي (بلا Vue): يستقبل النص والسياق ويعيد نتيجة موصوفة، فيمكن اختباره
// بلا تركيب أي مكوّن. الترجمة تُمرَّر كوسيط (t) عند الحاجة فقط، ورسائل الخطأ
// تُعاد كمفاتيح i18n لتترجمها الواجهة.
import { MathEngine } from './core'
import { solveSteps } from './steps'
import { solveInequality, isInequality } from './ineq'
import { evaluateComplex, polarOf, solveEquation, fmt as cxFmt, cz, deg360, degSigned } from './complex'
import { fmt } from './calcFormat'

const ME = MathEngine

/** سياق التقييم: وحدة الزوايا + المتغير x (موجود دائماً وقيمته صفر). */
const ctx = (angle) => ({ angle, vars: { x: 0 } })

/** دوال إحصائية تُعرض كتقرير كامل داخل نافذة الخطوات. */
export const STATS_FNS = new Set([
  'avg', 'med', 'mode', 'std', 'sstd', 'var', 'svar', 'q1', 'q3',
  'iqr', 'mhinge', 'midrange', 'range', 'max', 'min', 'gmean', 'hmean'
])

/** تعبير مركب: وحدة تخيلية ظاهرة (i غير متبوعة بحرف) أو جذر عدد سالب. */
export const isComplexExpr = (s) => /(?:i(?!\w)|(?:sqrt|√)\s*\(?\s*-)/i.test(s)

/** معادلة واضحة: تحتوي المتغير x أو أُسًّا أو علامة يساوي. */
export const looksLikeEquation = (s) => /[xX=^]/.test(s)

/** عرض مختصر بمنزلتين عشريتين (الزوايا). */
export const d2 = (v) => String(Math.round(v * 100) / 100)

/** عرض مختصر بأربع منازل (المقياس). */
export const shortNum = (v) => {
  if (!Number.isFinite(v)) return String(v)
  return String(Math.round(v * 10000) / 10000)
}

/** نص خطأ مترجَم — رمز multi يختلف بين مسار المتراجحات ومسار المعادلات. */
export function errText(code, t, cxMode = 'eval') {
  switch (code) {
    case 'div0': return t('calc.err.div0')
    case 'domain': return t('calc.err.domain')
    case 'multi': return cxMode === 'solve' ? t('calc.cx.multi') : t('calc.ineq.multi')
    case 'nonlin': return t('calc.ineq.nonlin')
    case 'deg': return t('calc.cx.deg')
    case 'mode': return t('calc.stats.nomode')
    default: return t('calc.err.syntax')
  }
}

/** مفتاح خطأ في مسار الخطوات العادي. */
const stepsErrorKey = (code) =>
  code === 'div0' ? 'calc.err.div0'
    : code === 'domain' ? 'calc.err.domain'
      : code === 'mode' ? 'calc.stats.nomode'
        : 'calc.err.syntax'

/** مفتاح خطأ في مسار الأعداد المركبة. */
const complexErrorKey = (code) =>
  code === 'multi' ? 'calc.cx.multi'
    : code === 'deg' ? 'calc.cx.deg'
      : code === 'domain' ? 'calc.err.domain'
        : 'calc.err.syntax'

/** وسيط قائمة مرتّبة. */
export function medOfL(a) {
  const m = a.length >> 1
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}

/** كل المقاييس الإحصائية الوصفية لقائمة أعداد. */
export function statMeasures(list) {
  const s = list.slice().sort((x, y) => x - y)
  const n = s.length
  const sum = s.reduce((x, v) => x + v, 0)
  const mean = sum / n
  const m = n >> 1
  const q1 = medOfL(s.slice(0, n % 2 ? m + 1 : m))
  const q3 = medOfL(s.slice(m))
  const vs = s.reduce((acc, v) => acc + (v - mean) * (v - mean), 0)
  const div = (sample) => (sample ? vs / (n - 1) : vs / n)
  const cnt = new Map()
  for (const v of s) cnt.set(v, (cnt.get(v) || 0) + 1)
  let best = 0
  for (const c of cnt.values()) best = Math.max(best, c)
  const modes = best > 1 ? [...cnt].filter(([, c]) => c === best).map(([k]) => k) : []
  const mn = s[0], mx = s[n - 1]
  const allPos = s.every(v => v > 0)
  return {
    n, sum, mean, median: medOfL(s), q1, q3, iqr: q3 - q1,
    stdev: Math.sqrt(div(false)),
    sstd: n > 1 ? Math.sqrt(div(true)) : null,
    varPop: div(false),
    varSam: n > 1 ? div(true) : null,
    range: mx - mn, midrange: (mn + mx) / 2, midhinge: (q1 + q3) / 2,
    min: mn, max: mx, modes,
    gmean: allPos ? Math.pow(s.reduce((a, b) => a * b, 1), 1 / n) : null,
    hmean: allPos ? n / s.reduce((a, b) => a + 1 / b, 0) : null
  }
}

/** نص حل المتراجحة (مع حالتَي «الكل» و«لا حل»). */
export function ineqSolutionText(r, t) {
  if (r.special === 'all') return t('calc.ineq.all')
  if (r.special === 'none') return t('calc.ineq.none')
  return r.solution
}

/** تقييم تعبير مركب أو حل معادلة حسب الوضع → { ok, data } أو { ok:false, error }. */
export function cxEvaluate(src, mode = 'eval') {
  if (mode === 'solve') {
    const r = solveEquation(src)
    return r.ok
      ? { ok: true, data: { mode: 'solve', degree: r.degree, special: r.special || null, roots: r.roots || [] } }
      : { ok: false, error: r.error }
  }
  try {
    const z = evaluateComplex(src)
    return { ok: true, data: { mode, z, p: polarOf(z) } }
  } catch (e) {
    return { ok: false, error: e && e.code ? e.code : 'syntax' }
  }
}

/** العرض المختصر لنتيجة عدد مركب (تقييم/قطبية/درجة/جذور معادلة). */
export function cxResultText(data, t) {
  if (data.mode === 'eval') return cxFmt(data.z)
  if (data.mode === 'polar') return shortNum(data.p.r) + ' ∠ ' + d2(degSigned(data.p.deg)) + '°'
  if (data.mode === 'degree') return d2(degSigned(data.p.deg)) + '°'
  return data.special === 'all' ? t('calc.ineq.all') : data.special === 'none' ? t('calc.ineq.none') : data.roots.map(cxFmt).join(' ، ')
}

/** تقييم عام لأي إدخال → { value } أو { ineq } أو { cx } أو { error }. */
export function evaluate(str, { angle = 'deg', cxMode = 'eval' } = {}) {
  if (isInequality(str)) {
    const r = solveInequality(str, { angle })
    return r.ok ? { ineq: r } : { error: r.error }
  }
  // الأعداد المركبة: وضع قطبية/درجة، أو تعبير يظهر فيه الحرف i كوحدة تخيلية
  if (cxMode === 'polar' || cxMode === 'degree' || isComplexExpr(str)) {
    let m = cxMode
    if (m === 'solve' && isComplexExpr(str) && !looksLikeEquation(str)) m = 'eval'
    const r = cxEvaluate(str, m)
    if (r.ok) return { cx: r.data }
    if (m !== 'eval' && !isComplexExpr(str)) {
      try { return { value: ME.evaluate(str, ctx(angle)) } } catch { /* نعرض الخطأ المركب */ }
    }
    return { error: r.error }
  }
  // وضع الحل: معادلة واضحة (تتضمن x أو ^ أو =)
  if (cxMode === 'solve' && looksLikeEquation(str)) {
    const r = solveEquation(str)
    return r.ok
      ? { cx: { mode: 'solve', degree: r.degree, special: r.special || null, roots: r.roots || [] } }
      : { error: r.error }
  }
  try { return { value: ME.evaluate(str, ctx(angle)) } }
  catch (e) { return { error: (e && e.code) || 'syntax' } }
}

/** نتيجة مثال عملية — للنص المعروض في لوحة العمليات.
 * وضع التنفيذ يأتي من موضع العملية (m) وحده: العمليات بلا وضع خاص تُقيَّم تقييمًا عاديًا
 * مهما كان وضع الأعداد المركبة المفعّل في الآلة. خيار cxMode لم يعد مُقبَلًا عمدًا حتى
 * لا ترث أمثلة الحسابية/المثلثات وضع حلّ المعادلة أو القطبية وتعرض شرطة أو زاوية خاطئة. */
export function exampleResult(x, m, { angle = 'deg' } = {}) {
  const mode = m || 'eval'
  if (isInequality(x)) {
    const r = solveInequality(x, { angle })
    if (!r.ok) return '—'
    return r.special === 'all' ? 'ℝ' : r.special === 'none' ? '—' : r.solution
  }
  if (mode === 'solve') {
    const r = solveEquation(x)
    if (!r.ok) return '—'
    if (r.special === 'all') return 'ℝ'
    if (r.special === 'none') return '—'
    return r.roots.map(cxFmt).join('،')
  }
  if (mode === 'polar' || mode === 'degree') {
    try {
      const p = polarOf(evaluateComplex(x))
      return mode === 'polar' ? shortNum(p.r) + ' ∠ ' + d2(degSigned(p.deg)) + '°' : d2(degSigned(p.deg)) + '°'
    } catch { return '—' }
  }
  if (isComplexExpr(x)) {
    try { return cxFmt(evaluateComplex(x)) } catch { return '—' }
  }
  try { return fmt(ME.evaluate(x, ctx(angle))) }
  catch { return '—' }
}

/** تقرير إحصائي كامل: { type:'stats', original, fn, final, m }. */
function statsPayload(fn, original, list, angle) {
  let final = null
  try { final = ME.evaluate(original, ctx(angle)) } catch { /* يبقى null */ }
  return { data: { type: 'stats', original, fn, final, m: statMeasures(list) }, error: '' }
}

/** تفاصيل عدد مركب/جذور معادلة: { type:'complex', original, cx }. */
function complexPayload(src, cxMode, angle) {
  let m = cxMode
  if (m === 'solve' && isComplexExpr(src) && !looksLikeEquation(src)) m = 'eval'
  const r = cxEvaluate(src, m)
  if (!r.ok) {
    // وضع قطبية/درجة على تعبير حقيقي: نكمل بمسار الخطوات العادي
    if ((m === 'polar' || m === 'degree') && !isComplexExpr(src)) {
      const nr = solveSteps(src, { angle })
      return nr.ok ? { data: nr, error: '' } : { data: null, error: stepsErrorKey(nr.error) }
    }
    return { data: null, error: complexErrorKey(r.error) }
  }
  const data = r.data
  let p = null
  if (data.mode !== 'solve') {
    p = {
      re: shortNum(data.z.re),
      im: shortNum(data.z.im),
      r: shortNum(data.p.r),
      abs: shortNum(data.p.r),
      deg360: d2(deg360(data.p.deg)),
      degP: d2(degSigned(data.p.deg)),
      rad: d2(data.p.rad),
      conj: cxFmt(cz.conj(data.z))
    }
  }
  return {
    data: {
      type: 'complex',
      original: src,
      cx: {
        mode: data.mode,
        special: data.special || null,
        degree: data.degree,
        roots: data.roots || [],
        zStr: data.z ? cxFmt(data.z) : null,
        p
      }
    },
    error: ''
  }
}

/**
 * يبني حمولة نافذة «الخطوات» لأي إدخال.
 * يعيد { data, error } حيث error = '' | 'empty' | مفتاح i18n، و data = null
 * أو كائن يحمل type: 'ineq' | 'stats' | 'complex' أو نتيجة solveSteps.
 */
export function buildSteps(src, { angle = 'deg', cxMode = 'eval' } = {}) {
  const text = String(src == null ? '' : src).trim()
  if (!text) return { data: null, error: 'empty' }

  if (isInequality(text)) {
    const r = solveInequality(text, { angle })
    return r.ok
      ? { data: { original: text, type: 'ineq', steps: r.steps, special: r.special, solution: r.solution }, error: '' }
      : { data: null, error: r.error === 'multi' ? 'calc.ineq.multi' : r.error === 'nonlin' ? 'calc.ineq.nonlin' : 'calc.err.syntax' }
  }

  // استدعاء إحصائي صريح مثل med(4,8,6) أو std(2,4,6) → تقرير كامل بالمقاييس
  const statsCall = text.match(/^([A-Za-z][A-Za-z0-9]*)\(([^()]*)\)$/)
  if (statsCall && STATS_FNS.has(statsCall[1])) {
    try {
      const nums = statsCall[2].split(',').map(ns => ME.evaluate(ns.trim() || '0', ctx(angle)))
      if (nums.length && nums.every(Number.isFinite)) return statsPayload(statsCall[1], text, nums, angle)
    } catch { /* نكمل للمسار العادي */ }
  }

  if (cxMode === 'polar' || cxMode === 'degree' || isComplexExpr(text) || (cxMode === 'solve' && looksLikeEquation(text))) {
    return complexPayload(text, cxMode, angle)
  }

  const r = solveSteps(text, { angle })
  return r.ok ? { data: r, error: '' } : { data: null, error: stepsErrorKey(r.error) }
}
