// ============================================================
// ineq — محلل المتراجحات الخطية في متغير واحد
// يكتشف رموز المتراجحات (≤ ≥ < > أو ASCII <= >= => =<) ثم يحسب
// طرفَي المتراجحة عددياً عبر MathEngine عند x = 0 و x = 1
// لاستخراج معامل x والثابت، ويتحقق من الخطية عند x = 2، ثم
// يحل ax + b ≤ cx + d ويعرض الحل بمجموعة خطوات مرتبة (مع قلب
// الاتجاه عند القسمة على عدد سالب).
// ============================================================
import { MathEngine } from './core'

const ME = MathEngine

const gcd2 = (p, q) => { p = Math.abs(p); q = Math.abs(q); while (q) { [p, q] = [q, p % q]; } return p; }
const fmt = n => ME.format(n)
const snap = v => (Math.abs(v) < 1e-9 ? 0 : v)

// رقم → كسر مبسط p/q إن كان المقام معقولاً (يُظهر 1/2 بدل 0.5)، وإلا null
function toFrac(n) {
  if (!Number.isFinite(n)) return null
  if (n === 0) return '0'
  const sign = n < 0 ? -1 : 1
  const abs = Math.abs(n)
  let best = null, bestErr = Infinity
  for (let d = 1; d <= 1000; d++) {
    const p = Math.round(abs * d)
    const err = Math.abs(abs - p / d)
    if (err < bestErr) { bestErr = err; best = [p, d] }
    if (bestErr < 1e-9) break
  }
  if (!best || bestErr > 1e-9) return null
  let [p, d] = best
  if (d <= 1) return sign < 0 ? '-' + p : String(p)
  const g = gcd2(p, d)
  p /= g; d /= g
  return (sign < 0 ? '-' : '') + p + '/' + d
}

// عدد جميل للعرض: كسر إن أمكن (2/3) وإلا عشري
function nice(n) {
  const f = toFrac(n)
  return f && f.includes('/') ? f : fmt(n)
}

// تعبير خطي a·x + b بصيغة نصية: '2x + 1' ، '−x' ، 'x − 3' ، '5'
function linTex(a, b) {
  a = snap(a); b = snap(b)
  if (a === 0 && b === 0) return '0'
  if (a === 0) return fmt(b)
  const parts = []
  if (Math.abs(a) === 1) parts.push(a < 0 ? '−x' : 'x')
  else parts.push((a < 0 ? '−' : '') + fmt(Math.abs(a)) + 'x')
  if (b !== 0) parts.push((b < 0 ? ' − ' : ' + ') + fmt(Math.abs(b)))
  return parts.join('')
}

// رقم بعلامة صريحة للطرف الأيمن: '−32' ، '1/2' ، '0'
function signed(n) {
  n = snap(n)
  if (n === 0) return '0'
  if (n < 0) return '−' + nice(-n)
  return nice(n)
}

// هل النص متراجحة (يحتوي رمز ترتيب)؟
export function isInequality(raw) {
  return /[<>≤≥]/.test(String(raw))
}

// يقسّم المتراجحة إلى { op, left, right } ويوحّد الرموز ASCII
function splitIneq(raw) {
  let src = String(raw)
    .replace(/\s+/g, '')
    .replace(/>=|=>/g, '≥')
    .replace(/<=|=</g, '≤')
  const m = src.match(/[<>≤≥]/)
  if (!m) return null
  return {
    op: m[0],
    left: src.slice(0, m.index),
    right: src.slice(m.index + m[0].length)
  }
}

// المقارنة النصية بعد ضغط المسافات وتوحيد إشارة الطرح
const cmp = s => String(s).replace(/\s+/g, '').replace(/-/g, '−')

const FLIP = { '≤': '≥', '≥': '≤', '<': '>', '>': '<' }

// يحل المتراجحة الخطية ويعيد { ok:true, steps, solution, special } أو { ok:false, error }
// special: 'all' (جميع الأعداد) | 'none' (لا حل) | null
export function solveInequality(raw, opts) {
  const part = splitIneq(raw)
  if (!part) return { ok: false, error: 'syntax' }
  const { op, left, right } = part
  if (/[<>≤≥]/.test(left) || /[<>≤≥]/.test(right)) return { ok: false, error: 'multi' }

  const deg = !opts || opts.angle !== 'rad'
  const evalAt = (side, x) => ME.evaluate(side, { angle: deg ? 'deg' : 'rad', vars: { x } })

  let aL, bL, aR, bR
  try {
    bL = evalAt(left, 0); aL = evalAt(left, 1) - bL
    bR = evalAt(right, 0); aR = evalAt(right, 1) - bR
    // التحقق من الخطية: القيمة عند x = 2 يجب أن تطابق 2a + b
    const isLin = (a, b, side) => {
      const v2 = evalAt(side, 2)
      return Math.abs(v2 - (2 * a + b)) <= 1e-6 * Math.max(1, Math.abs(2 * a + b))
    }
    if (!isLin(aL, bL, left) || !isLin(aR, bR, right)) return { ok: false, error: 'nonlin' }
  } catch (e) {
    return { ok: false, error: (e && e.code) || 'syntax' }
  }

  aL = snap(aL); bL = snap(bL); aR = snap(aR); bR = snap(bR)
  const A = snap(aL - aR)
  const B = snap(bR - bL)

  const simText = linTex(aL, bL) + ' ' + op + ' ' + linTex(aR, bR)
  const steps = []
  const push = (kind, expr) => {
    if (steps.length === 0 || cmp(steps[steps.length - 1].expr) !== cmp(expr)) steps.push({ kind, expr })
  }
  if (cmp(simText) !== cmp(raw)) push('expand', simText)

  // لا يوجد متغير فعلي: متراجحة ثابتة
  if (A === 0) {
    const scale = Math.max(1, Math.abs(bL), Math.abs(bR))
    const eps = 1e-9 * scale
    const holds =
      op === '≤' ? bL <= bR + eps
      : op === '≥' ? bL + eps >= bR
      : op === '<' ? bL < bR - eps
      : bL > bR + eps
    push('check', fmt(bL) + ' ' + op + ' ' + fmt(bR))
    return { ok: true, type: 'ineq', op, steps, special: holds ? 'all' : 'none', solution: holds ? 'ℝ' : '' }
  }

  const moveText = linTex(A, 0) + ' ' + op + ' ' + signed(B)
  push('move', moveText)

  const finalOp = A < 0 ? FLIP[op] : op
  const finText = 'x ' + finalOp + ' ' + signed(B / A)
  if (cmp(finText) !== cmp(moveText)) push(A < 0 ? 'divideNeg' : 'divide', finText)

  return { ok: true, type: 'ineq', op, steps, special: null, solution: finText }
}