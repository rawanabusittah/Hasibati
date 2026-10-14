<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { MathEngine } from '../lib/core'
import { solveSteps } from '../lib/steps'
import { solveInequality, isInequality } from '../lib/ineq'
import { evaluateComplex, polarOf, solveEquation, fmt as cxFmt, cz, deg360, degSigned } from '../lib/complex'
import { useI18n } from '../composables/i18n'
import { saveTool } from '../services/cloud'
import SavedHistory from '../components/SavedHistory.vue'
import { CATS, buildOps, buildCatLabels } from '../lib/calcOps'
import { fmt } from '../lib/calcFormat'
import CalcKeypad from '../components/CalcKeypad.vue'
import CalcOpsPanel from '../components/CalcOpsPanel.vue'
import CalcStepsDialog from '../components/CalcStepsDialog.vue'

const { L, t } = useI18n()
const ME = MathEngine

const LS_HIST = 'hp_calc_history'
const LS_ANG = 'hp_angle'

// تُبنى عبر computed حتى تتحدّث التسميات والوصف فورًا عند تبديل اللغة
const OPS = computed(() => buildOps(L))
const CAT_LABELS = computed(() => buildCatLabels(L))

// ── الحالة ──
const expr = ref('')
const inputEl = ref(null)
const result = ref('0')
const resultError = ref(false)
const ok = ref(false)
const last = ref('')
const angle = ref(readAngle())
const activeCat = ref('arith')
const openPanels = ref(new Set())
// وضع الأعداد المركبة: eval | polar | degree | solve
const cxMode = ref('eval')

const historyList = ref(getHistory())
const modeLabel = computed(() => (angle.value === 'deg' ? 'DEG' : 'RAD'))

function readAngle() {
  try { return localStorage.getItem(LS_ANG) === 'rad' ? 'rad' : 'deg' } catch { return 'deg' }
}
function getHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HIST)) || [] } catch { return [] }
}
function setHistory(arr) {
  try { localStorage.setItem(LS_HIST, JSON.stringify(arr.slice(0, 50))) } catch { /* تجاهل */ }
}

const errKey = (code) => 'calc.err.' + (code === 'div0' ? 'div0' : code === 'domain' ? 'domain' : 'syntax')

// نص خطأ مترجَم — يدعم أخطاء المتراجحات والأعداد المركبة أيضاً
// تعبير مركب: وحدة تخيلية ظاهرة (i غير متبوعة بحرف) أو جذر عدد سالب (sqrt(-ا) / √-)
const isComplexExpr = (s) => /(?:i(?!\w)|(?:sqrt|√)\s*\(?\s*-)/i.test(s)
const looksLikeEquation = (s) => /[xX=^]/.test(s)
const d2 = (v) => String(Math.round(v * 100) / 100)
const shortNum = (v) => {
  if (!Number.isFinite(v)) return String(v)
  return String(Math.round(v * 10000) / 10000)
}

function errText(code) {
  switch (code) {
    case 'div0': return t('calc.err.div0')
    case 'domain': return t('calc.err.domain')
    case 'multi': return cxMode.value === 'solve' ? t('calc.cx.multi') : t('calc.ineq.multi')
    case 'nonlin': return t('calc.ineq.nonlin')
    case 'deg': return t('calc.cx.deg')
    case 'mode': return t('calc.stats.nomode')
    default: return t('calc.err.syntax')
  }
}

// ── إحصاءات وصفية ──
const STATS_FNS = new Set(['avg', 'med', 'mode', 'std', 'sstd', 'var', 'svar', 'q1', 'q3', 'iqr', 'mhinge', 'midrange', 'range', 'max', 'min', 'gmean', 'hmean'])
function medOfL(a) {
  const m = a.length >> 1
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2
}
function statMeasures(list) {
  const s = list.slice().sort((x, y) => x - y)
  const n = s.length
  const sum = s.reduce((x, v) => x + v, 0)
  const mean = sum / n
  const m = n >> 1
  const q1 = medOfL(s.slice(0, n % 2 ? m + 1 : m))
  const q3 = medOfL(s.slice(m))
  const vs = s.reduce((t, v) => t + (v - mean) * (v - mean), 0)
  const div = (sample) => (sample ? vs / (n - 1) : vs / n)
  const cnt = new Map()
  for (const v of s) cnt.set(v, (cnt.get(v) || 0) + 1)
  let best = 0
  for (const c of cnt.values()) best = Math.max(best, c)
  const modes = best > 1 ? [...cnt].filter(([k, c]) => c === best).map(([k]) => k) : []
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


function ineqSolutionText(r) {
  if (r.special === 'all') return t('calc.ineq.all')
  if (r.special === 'none') return t('calc.ineq.none')
  return r.solution
}

function evaluate(str) {
  if (isInequality(str)) {
    const r = solveInequality(str, { angle: angle.value })
    return r.ok ? { ineq: r } : { error: r.error }
  }
  // الأعداد المركبة: وضع قطبية/درجة، أو تعبير يظهر فيه الحرف i كوحدة تخيلية
  if (cxMode.value === 'polar' || cxMode.value === 'degree' || isComplexExpr(str)) {
    let m = cxMode.value
    if (m === 'solve' && isComplexExpr(str) && !looksLikeEquation(str)) m = 'eval'
    const r = cxEvaluate(str, m)
    if (r.ok) return { cx: r.data }
    if (m !== 'eval' && !isComplexExpr(str)) {
      try { return { value: ME.evaluate(str, { angle: angle.value, vars: { x: 0 } }) } }
      catch (e2) { /* نتجاهل ونعرض الخطأ المركب */ }
    }
    return { error: r.error }
  }
  // وضع الحل: معادلة واضحة (تتضمن x أو ^ أو =)
  if (cxMode.value === 'solve' && looksLikeEquation(str)) {
    const r = solveEquation(str)
    return r.ok
      ? { cx: { mode: 'solve', degree: r.degree, special: r.special || null, roots: r.roots || [] } }
      : { error: r.error }
  }
  try { return { value: ME.evaluate(str, { angle: angle.value, vars: { x: 0 } }) } }
  catch (e) { return { error: (e && e.code) || 'syntax' } }
}

// تقييم تعبير مركب أو حل معادلة حسب الوضع — يعيد { ok, data } أو { ok:false, error }
function cxEvaluate(src, mode) {
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

function cxResultText(data) {
  if (data.mode === 'eval') return cxFmt(data.z)
  if (data.mode === 'polar') return shortNum(data.p.r) + ' ∠ ' + d2(degSigned(data.p.deg)) + '°'
  if (data.mode === 'degree') return d2(degSigned(data.p.deg)) + '°'
  return data.special === 'all' ? t('calc.ineq.all') : data.special === 'none' ? t('calc.ineq.none') : data.roots.map(cxFmt).join(' ، ')
}

function showComplexResult(data) {
  if (data.mode === 'solve') {
    if (data.special === 'all') {
      result.value = t('calc.ineq.all')
      last.value = result.value
    } else if (data.special === 'none') {
      result.value = t('calc.ineq.none')
      last.value = result.value
    } else {
      const joined = data.roots.map(cxFmt).join(' ، ')
      last.value = joined
      result.value = joined.length <= 30
        ? joined
        : L('N حلول', 'N solutions').replace('N', String(data.roots.length))
    }
    return
  }
  result.value = cxResultText(data)
  last.value = result.value
}

function preview() {
  const src = expr.value.trim()
  if (!src) {
    result.value = '0'
    resultError.value = false
    ok.value = false
    last.value = ''
    return
  }
  const r = evaluate(src)
  if (r.error) {
    result.value = errText(r.error)
    resultError.value = true
    ok.value = false
    last.value = ''
  } else if (r.ineq) {
    result.value = ineqSolutionText(r.ineq)
    resultError.value = false
    last.value = result.value
    ok.value = true
  } else if (r.cx) {
    showComplexResult(r.cx)
    resultError.value = false
    ok.value = true
  } else {
    result.value = fmt(r.value)
    resultError.value = false
    last.value = fmt(r.value)
    ok.value = true
  }
}

function record() {
  const src = expr.value.trim()
  if (!src) return
  if (!ok.value) return
  const items = getHistory()
  items.push({ e: src, r: last.value })
  setHistory(items)
  historyList.value = items
  saveTool('calculator', src, last.value)
}

function insert(text) {
  const el = inputEl.value
  if (!el) { expr.value += text; return }
  const start = el.selectionStart != null ? el.selectionStart : expr.value.length
  const end = el.selectionEnd != null ? el.selectionEnd : expr.value.length
  expr.value = expr.value.slice(0, start) + text + expr.value.slice(end)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + text.length, start + text.length)
  })
  preview()
}

function back() {
  const el = inputEl.value
  const start = el ? (el.selectionStart != null ? el.selectionStart : expr.value.length) : expr.value.length
  const end = el ? (el.selectionEnd != null ? el.selectionEnd : expr.value.length) : expr.value.length
  if (start !== end) {
    expr.value = expr.value.slice(0, start) + expr.value.slice(end)
    if (el) nextTick(() => el.setSelectionRange(start, start))
  } else if (start > 0) {
    expr.value = expr.value.slice(0, start - 1) + expr.value.slice(start)
    if (el) nextTick(() => el.setSelectionRange(start - 1, start - 1))
  }
  preview()
}

function negate() {
  let v = expr.value
  const m = v.match(/(^|[^0-9.])(\d+(?:\.\d+)?)$/)
  if (m) v = v.slice(0, m.index + 1) + '(-' + m[2] + ')'
  else v += '-'
  expr.value = v
  preview()
  inputEl.value?.focus()
}

function toggleMode() {
  angle.value = angle.value === 'deg' ? 'rad' : 'deg'
  try { localStorage.setItem(LS_ANG, angle.value) } catch { /* تجاهل */ }
  preview()
}

function clearAll() {
  expr.value = ''
  preview()
  inputEl.value?.focus()
}

function onPad(act, val) {
  switch (act) {
    case 'append': insert(val); break
    case 'clear': clearAll(); break
    case 'back': back(); break
    case 'fn': {
      if (val === 'neg') negate()
      else if (val === 'pi') insert('π')
      else if (val === 'e') insert('e')
      break
    }
    case 'mode': toggleMode(); break
    case 'equals': record(); break
    case 'copy': {
      const text = (ok.value && last.value) ? last.value : expr.value.trim()
      if (text) copyText(text)
      break
    }
    case 'clear-history':
      setHistory([])
      historyList.value = []
      break
  }
}

function copyText(text) {
  const done = () => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 1400)
  }
  const legacy = () => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch { /* تجاهل */ }
    ta.remove()
    done()
  }
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(legacy)
  else legacy()
}

const copied = ref(false)
const copyLabel = computed(() => (copied.value ? t('calc.copied') : t('calc.copy')))

// ── خطوات الحل بالترتيب ──
const showSteps = ref(false)
const stepsData = ref(null)
const stepsError = ref('') // '' | 'empty' | مفتاح خطأ


function openSteps() {
  const src = expr.value.trim()
  if (!src) {
    stepsData.value = null
    stepsError.value = 'empty'
    showSteps.value = true
    return
  }
  if (isInequality(src)) {
    const r = solveInequality(src, { angle: angle.value })
    if (r.ok) {
      stepsData.value = {
        original: src,
        type: 'ineq',
        steps: r.steps,
        special: r.special,
        solution: r.solution
      }
      stepsError.value = ''
    } else {
      stepsData.value = null
      stepsError.value = r.error === 'multi' ? 'calc.ineq.multi' : r.error === 'nonlin' ? 'calc.ineq.nonlin' : 'calc.err.syntax'
    }
    showSteps.value = true
    return
  }
  // استدعاء إحصائي صريح مثل med(4,8,6) أو std(2,4,6) → تقرير كامل بالمقاييس
  const statsCall = src.match(/^([A-Za-z][A-Za-z0-9]*)\(([^()]*)\)$/)
  if (statsCall && STATS_FNS.has(statsCall[1])) {
    try {
      const nums = statsCall[2].split(',').map(ns => ME.evaluate(ns.trim() || '0', { angle: angle.value, vars: { x: 0 } }))
      if (nums.length && nums.every(Number.isFinite)) {
        openStatsSteps(statsCall[1], src, nums)
        return
      }
    } catch (e) { /* نكمل للمسار العادي */ }
  }
  const complexLike = isComplexExpr(src)
  if (cxMode.value === 'polar' || cxMode.value === 'degree' || complexLike || (cxMode.value === 'solve' && looksLikeEquation(src))) {
    openComplexSteps(src)
    return
  }
  const r = solveSteps(src, { angle: angle.value })
  stepsData.value = r.ok ? r : null
  stepsError.value = r.ok ? '' : (r.error === 'div0' ? 'calc.err.div0' : r.error === 'domain' ? 'calc.err.domain' : r.error === 'mode' ? 'calc.stats.nomode' : 'calc.err.syntax')
  showSteps.value = true
}

function closeSteps() {
  showSteps.value = false
  inputEl.value?.focus()
}

// ── تقرير إحصائي كامل داخل نافذة الخطوات ──
function openStatsSteps(fn, original, list) {
  let final = null
  try { final = ME.evaluate(original, { angle: angle.value, vars: { x: 0 } }) } catch { /* يبقى null */ }
  stepsData.value = { type: 'stats', original, fn, final, m: statMeasures(list) }
  stepsError.value = ''
  showSteps.value = true
}

// ── خطوات/تفاصيل الأعداد المركبة ──
function openComplexSteps(src) {
  let m = cxMode.value
  if (m === 'solve' && isComplexExpr(src) && !looksLikeEquation(src)) m = 'eval'
  const r = cxEvaluate(src, m)
  if (!r.ok) {
    if ((m === 'polar' || m === 'degree') && !isComplexExpr(src)) {
      const nr = solveSteps(src, { angle: angle.value })
      stepsData.value = nr.ok ? nr : null
      stepsError.value = nr.ok ? '' : (nr.error === 'div0' ? 'calc.err.div0' : nr.error === 'domain' ? 'calc.err.domain' : nr.error === 'mode' ? 'calc.stats.nomode' : 'calc.err.syntax')
      showSteps.value = true
      return
    }
    stepsData.value = null
    stepsError.value = r.error === 'multi' ? 'calc.cx.multi' : r.error === 'deg' ? 'calc.cx.deg' : r.error === 'domain' ? 'calc.err.domain' : 'calc.err.syntax'
    showSteps.value = true
    return
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
  stepsData.value = {
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
  }
  stepsError.value = ''
  showSteps.value = true
}


// ── العمليات القابلة للطي ──
function togglePanel(key) {
  const s = new Set(openPanels.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  openPanels.value = s
}
function isOpen(key) { return openPanels.value.has(key) }
const openKeys = computed(() => [...openPanels.value])

function exampleResult(x, m) {
  const mode = m || cxMode.value
  if (isInequality(x)) {
    const r = solveInequality(x, { angle: angle.value })
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
      const z = evaluateComplex(x)
      const p = polarOf(z)
      return mode === 'polar' ? shortNum(p.r) + ' ∠ ' + d2(degSigned(p.deg)) + '°' : d2(degSigned(p.deg)) + '°'
    } catch { return '—' }
  }
  if (isComplexExpr(x)) {
    try { return cxFmt(evaluateComplex(x)) } catch { return '—' }
  }
  try { return fmt(ME.evaluate(x, { angle: angle.value, vars: { x: 0 } })) }
  catch { return '—' }
}

// ── السجل ──
const reversedHistory = computed(() => [...historyList.value].reverse())

function useHistoryItem(h) {
  expr.value = h.e
  preview()
  inputEl.value?.focus()
}

function clearHistoryPanel() {
  setHistory([])
  historyList.value = []
}

function tryExample(x, m) {
  if (m) cxMode.value = m
  expr.value = x
  preview()
  record()
  inputEl.value?.focus()
}

function insertOp(op) {
  if (op.m) cxMode.value = op.m
  insert(op.v)
  inputEl.value?.focus()
}

// ── لوحة الأرقام ──
const pad = computed(() => [
  { act: 'clear', label: 'AC', cls: 'clear', aria: [L('مسح الكل (AC)', 'Clear all (AC)')] },
  { act: 'back', label: '⌫', cls: 'fn', aria: [L('مسح آخر حرف', 'Backspace')] },
  { act: 'append', val: '(', label: '(', cls: 'fn', aria: [L('قوس فتح', 'Open parenthesis')] },
  { act: 'append', val: ')', label: ')', cls: 'fn', aria: [L('قوس إغلاق', 'Close parenthesis')] },
  { act: 'append', val: '7', label: '7', cls: '' },
  { act: 'append', val: '8', label: '8', cls: '' },
  { act: 'append', val: '9', label: '9', cls: '' },
  { act: 'append', val: '÷', label: '÷', cls: 'op', aria: [L('قسمة', 'Divide')] },
  { act: 'append', val: '4', label: '4', cls: '' },
  { act: 'append', val: '5', label: '5', cls: '' },
  { act: 'append', val: '6', label: '6', cls: '' },
  { act: 'append', val: '×', label: '×', cls: 'op', aria: [L('ضرب', 'Multiply')] },
  { act: 'append', val: '1', label: '1', cls: '' },
  { act: 'append', val: '2', label: '2', cls: '' },
  { act: 'append', val: '3', label: '3', cls: '' },
  { act: 'append', val: '-', label: '−', cls: 'op', aria: [L('طرح', 'Subtract')] },
  { act: 'append', val: '0', label: '0', cls: '' },
  { act: 'append', val: '.', label: '.', cls: '', aria: [L('فاصلة عشرية', 'Decimal point')] },
  { act: 'fn', val: 'neg', label: '±', cls: 'fn', aria: [L('تغيير الإشارة', 'Toggle sign')] },
  { act: 'append', val: '+', label: '+', cls: 'op', aria: [L('جمع', 'Add')] },
  { act: 'append', val: 'x', label: 'x', cls: 'fn', aria: [L('المتغير x للدوال', 'The variable x for functions')] },
  { act: 'fn', val: 'pi', label: 'π', cls: 'fn', aria: [L('باي', 'Pi')] },
  { act: 'fn', val: 'e', label: 'e', cls: 'fn', aria: [L('العدد النيبيري', "Euler's number")] },
  { act: 'append', val: ',', label: ',', cls: 'fn', aria: [L('فاصلة بين الوسائط', 'Argument separator')] },
  { act: 'append', val: '≤', label: '≤', cls: 'op', aria: [L('أصغر من أو يساوي', 'Less than or equal to')] },
  { act: 'append', val: '≥', label: '≥', cls: 'op', aria: [L('أكبر من أو يساوي', 'Greater than or equal to')] },
  { act: 'append', val: '<', label: '<', cls: 'op', aria: [L('أصغر من', 'Less than')] },
  { act: 'append', val: '>', label: '>', cls: 'op', aria: [L('أكبر من', 'Greater than')] },
  { act: 'append', val: 'i', label: 'i', cls: 'op', aria: [L('الوحدة التخيلية', 'Imaginary unit i')] },
  { act: 'equals', label: '=', cls: 'eq', aria: [L('احسب النتيجة', 'Calculate')] }
])

// ── اختصار لوحة المفاتيح ──
const MAXLEN = 200

function onKey(e) {
  if (showSteps.value) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === '=') {
      e.preventDefault()
      closeSteps()
    }
    return
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const target = e.target
  const tag = (target && target.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea') {
    if (inputEl.value && target === inputEl.value && e.key === 'Enter') {
      e.preventDefault()
      record()
    }
    return
  }
  const map = {
    '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
    '.':'.','+':'+','-':'-','*':'×','/':'÷','^':'^','%':'%','!':'!',
    '(':'(',')':')',',':',','x':'x','i':'i'
  }
  if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); record(); return }
  if (e.key === 'Backspace') { e.preventDefault(); back(); return }
  if (e.key === 'Delete' || e.key === 'Escape') { e.preventDefault(); expr.value = ''; preview(); return }
  if (map[e.key]) { e.preventDefault(); insert(map[e.key]) }
}

function onInput() {
  if (expr.value.length > MAXLEN) expr.value = expr.value.slice(0, MAXLEN)
  preview()
}

onMounted(() => {
  preview()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})

const visibleCats = CATS.filter(c => c !== 'history')
</script>

<template>
  <div class="section calc-page" style="max-width: 1180px">
    <!-- ════ العنوان ════ -->
    <header class="page-head">
      <h1 class="section-title">{{ L('الآلة الحاسبة العلمية', 'Scientific Calculator') }}</h1>
      <p class="section-sub">{{ L('اكتب عمليتك في الشريط، أو اختر عملية وجرّب مثالها على لوحة الأرقام.', 'Type an expression below, or pick an operation and try its example on the keypad.') }}</p>
    </header>

    <!-- ════ شريط الإدخال + النتيجة ════ -->
    <div class="calc-bar" role="group" :aria-label="L('إدخال العملية', 'Expression input')">
      <button
        type="button"
        class="bar-btn bar-mode"
        :aria-pressed="String(angle === 'deg')"
        :aria-label="L(modeLabel + ' — وحدة الزوايا (اضغط للتبديل)', modeLabel + ' — angle unit (tap to switch)')"
        @click="toggleMode"
      >{{ modeLabel }}</button>
      <input
        ref="inputEl"
        v-model="expr"
        class="bar-input"
        type="text"
        dir="ltr"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="done"
        :placeholder="L(' 2π × sin(30) + 5!', ' e.g. 2π × sin(30) + 5!')"
        :aria-label="L('العملية الحسابية', 'Expression')"
        @input="onInput"
      />
      <div class="calc-result bar-result" :class="{ 'is-error': resultError }" role="status" aria-live="polite" :aria-label="L('النتيجة', 'Result')">{{ result }}</div>
      <button type="button" class="bar-btn" :class="{ copied }" @click="onPad('copy')">{{ copyLabel }}</button>
      <button type="button" class="bar-btn bar-steps" :aria-label="L('استعرض الخطوات بالترتيب', 'Show steps in order')" @click="openSteps">{{ L('استعرض الخطوات', 'Show steps') }}</button>
    </div>

    <div class="calc-layout calc-layout--ops">
      <CalcOpsPanel
        :cats="CATS"
        :visible-cats="visibleCats"
        :cat-labels="CAT_LABELS"
        :ops="OPS"
        :active-cat="activeCat"
        :open-keys="openKeys"
        :history="reversedHistory"
        :example-result="exampleResult"
        @update:activeCat="activeCat = $event"
        @toggle="togglePanel"
        @insert="insertOp"
        @try="tryExample"
        @use-history="useHistoryItem"
        @clear-history="clearHistoryPanel"
      />

      <!-- ════ لوحة الأرقام ════ -->
      <div class="calc-side">
        <CalcKeypad :pad="pad" @press="onPad" />
      </div>
    </div>

    <section class="cheat-sec" aria-labelledby="cheat-head">
      <header class="cheat-sec-head">
        <h2 id="cheat-head">{{ L('نصائح سريعة', 'Quick tips') }}</h2>
        <p>{{ L('اختصارات وقواعد توفّر عليك الوقت.', 'Shortcuts and rules that save you time.') }}</p>
      </header>
      <div class="cheat-grid">
        <div class="cheat">
          <div class="cheat-icon blue" aria-hidden="true">%</div>
          <h3>{{ L('النسبة المئوية الذكية', 'Smart percent') }}</h3>
          <p><code>200+10%</code> {{ L('تضيف 10% من 200 فتصبح 220. وحدها،', 'adds 10% of 200 → 220. On its own,') }} <code>50%</code> {{ L('تساوي 0.5.', 'is 0.5.') }}</p>
        </div>
        <div class="cheat">
          <div class="cheat-icon purple" aria-hidden="true">πx</div>
          <h3>{{ L('الضرب الضمني', 'Implicit multiplication') }}</h3>
          <p>{{ L('اكتب', 'Write') }} <code>2π</code> {{ L('أو', 'or') }} <code>3(4+1)</code> {{ L('أو', 'or') }} <code>2sin(30)</code> {{ L('دون الحاجة إلى ×.', 'without typing ×.') }}</p>
        </div>
        <div class="cheat">
          <div class="cheat-icon green" aria-hidden="true">∫</div>
          <h3>{{ L('التفاضل والتكامل', 'Calculus') }}</h3>
          <p>{{ L('استخدم', 'Use') }} <b>x</b> {{ L('كمتغير:', 'as the variable:') }} <code>diff(x^2,3)</code> = 6 {{ L('و', 'and') }} <code>int(x^2,0,3)</code> = 9. {{ L('النتائج عددية.', 'Results are numeric.') }}</p>
        </div>
        <div class="cheat">
          <div class="cheat-icon red" aria-hidden="true">⚠</div>
          <h3>{{ L('أخطاء واضحة', 'Clear errors') }}</h3>
          <p>{{ L('القسمة على صفر أو', 'Dividing by zero,') }} <code>tan(90)</code> {{ L('أو', 'or') }} <code>log(0)</code> {{ L('تُظهر رسالة واضحة بدل رقم خاطئ.', 'show a clear message instead of a wrong number.') }}</p>
        </div>
      </div>
    </section>
  </div>

  <CalcStepsDialog :show="showSteps" :payload="stepsData" :error="stepsError" @close="closeSteps" />

  <SavedHistory tool="calculator" />
</template>

<style scoped>
.bar-btn.bar-steps { border-color: var(--accent); color: var(--accent); }
</style>