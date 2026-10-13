// ============================================================
// steps — محرك "خطوات الحل بالترتيب"
// يحاكي بنية MathEngine بدقة (نفس الأولويات، الضرب الضمني،
// النسبة المئوية الذكية، و-2^2 = -4 …) لكنه يسجّل كل عملية
// ينفّذها على شكل خطوة مرقّمة تُظهر المقطع ونتيجته، بحيث
// تظهر الخطوات بترتيب التنفيذ الفعلي. القيمة النهائية مطابقة
// تماماً لنتيجة MathEngine.evaluate() — تُعرض بـ ME.format.
// ============================================================
import { MathEngine } from './core'

const ME = MathEngine

const NAMES = ['diff2', 'prod', 'diff', 'asin', 'acos', 'atan', 'cbrt', 'floor', 'round', 'ceil',
               'midrange', 'mhinge', 'log2', 'logb', 'root', 'sin', 'cos', 'tan', 'exp', 'abs',
               'mod', 'gcd', 'lcm', 'nCr', 'nPr', 'avg', 'max', 'min', 'sstd', 'svar', 'gmean',
               'hmean', 'sum', 'int', 'log', 'ln', 'med', 'mode', 'std', 'var', 'iqr', 'range',
               'nth', 'a10', 'q1', 'q3']
const UNARY = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'log2', 'exp',
                       'abs', 'cbrt', 'floor', 'ceil', 'round'])
const LAMBDA = new Set(['diff', 'diff2', 'int', 'sum', 'prod'])

const startsPrimary = c => /[0-9.(π√A-Za-z]/.test(c)
const isCompound = s => /[-+−×÷^*!%]/.test(s)
const fmt = n => ME.format(n)

// مضروب — نفس قيود المحرك
function fact(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) throw { code: 'domain' }
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

// يعيد { steps: [{ sub, res, kind, name? }], original, final }
// أو { ok:false, error } · error ∈ syntax | div0 | domain
export function solveSteps(raw, opts) {
  try {
    // نفس تطبيع المحرك (مع إبقاء × ÷ كما هي لعرضها في الخطوات)
    let src = String(raw).replace(/−/g, '-').replace(/\s+/g, '')
    if (!src) throw { code: 'syntax' }

    let open = 0
    for (const c of src) {
      if (c === '(') open++
      else if (c === ')') { if (--open < 0) throw { code: 'syntax' } }
    }
    src += ')'.repeat(open)

    const deg = !opts || opts.angle !== 'rad'
    const vars = (opts && opts.vars) || {}
    const callOpts = () => ({ angle: deg ? 'deg' : 'rad', vars })

    let pos = 0
    let pctTerm = false
    const peek = () => src[pos]
    const bad = code => ({ code })
    const step = (sub, res, kind, name) => ({ sub, res, kind, name })
    // عقدة: نص العرض + القيمة الدقيقة + خطواتها المتراكمة
    const leaf = (text, value, steps = []) => ({ text, value, steps })
    const bin = (a, b, sym, kind, value) =>
      leaf(`${a.text} ${sym} ${b.text}`, value,
        [...a.steps, ...b.steps, step(`${a.text} ${sym} ${b.text}`, fmt(value), kind)])

    function parseArgs() {
      const a = [parseExpr()]
      while (peek() === ',') { pos++; a.push(parseExpr()) }
      if (peek() !== ')') throw bad('syntax')
      pos++
      return a
    }

    function call(name, fstart) {
      if (LAMBDA.has(name)) {
        let depth = 0, comma = -1
        for (let i = pos; i < src.length; i++) {
          const ch = src[i]
          if (ch === '(') depth++
          else if (ch === ')') { if (depth === 0) break; depth-- }
          else if (ch === ',' && depth === 0) { comma = i; break }
        }
        if (comma < 0) throw bad('syntax')
        pos = comma + 1
        parseArgs()
        const callText = src.slice(fstart, pos)
        const value = ME.evaluate(callText, callOpts())
        return leaf(callText, value, [step(callText, fmt(value), 'calc', name)])
      }
      const a = parseArgs()
      const callText = src.slice(fstart, pos)
      const value = ME.evaluate(callText, callOpts())
      if (UNARY.has(name) && a.length === 1) {
        // الدوال أحادية الوسيط تُظهر خطوات وسيطها أولاً (مثل sin(30+10))
        return leaf(callText, value, [...a[0].steps, step(callText, fmt(value), 'fn', name)])
      }
      return leaf(callText, value, [step(callText, fmt(value), 'fn', name)])
    }

    // expr := term (('+'|'-') term)*
    function parseExpr() {
      let v = parseTerm()
      while (peek() === '+' || peek() === '-') {
        const op = src[pos++]
        const sym = op === '+' ? '+' : '−'
        const r = parseTerm()

        if (pctTerm) {
          // 200 + 10%  →  200 + (10% × 200)
          const t = `${v.text} × ${r.text}`
          const tv = v.value * r.value
          const av = op === '+' ? v.value + tv : v.value - tv
          const steps = [...v.steps, ...r.steps,
            step(`(${t})`, fmt(tv), 'pct'),
            step(`${v.text} ${sym} ${fmt(tv)}`, fmt(av), op === '+' ? 'add' : 'sub')]
          v = leaf(`${v.text} ${sym} ${fmt(tv)}`, av, steps)
          continue
        }

        v = bin(v, r, sym, op === '+' ? 'add' : 'sub', op === '+' ? v.value + r.value : v.value - r.value)
      }
      return v
    }

    // term := unary (('*'|'/'|implicit) unary)*
    function parseTerm() {
      let v = parseUnary()
      let single = v.lastPct === true
      for (;;) {
        const c = peek()
        if (c === '*' || c === '×') {
          pos++
          const r = parseUnary()
          v = bin(v, r, '×', 'mul', v.value * r.value)
          single = false
        } else if (c === '/' || c === '÷') {
          pos++
          const r = parseUnary()
          if (r.value === 0) throw bad('div0')
          v = bin(v, r, '÷', 'div', v.value / r.value)
          single = false
        } else if (c !== undefined && startsPrimary(c)) {
          const r = parseUnary()
          v = bin(v, r, '×', 'mul', v.value * r.value)
          single = false
        } else break
      }
      pctTerm = single
      return v
    }

    // unary := ('-'|'+') unary | power    (-2^2 = -4)
    function parseUnary() {
      const c = peek()
      if (c === '-') {
        pos++
        const x = parseUnary()
        if (isCompound(x.text)) {
          const text = `-(${x.text})`
          return leaf(text, -x.value, [...x.steps, step(text, fmt(-x.value), 'neg')])
        }
        return leaf(`-${x.text}`, -x.value, x.steps)
      }
      if (c === '+') { pos++; return parseUnary() }
      return parsePower()
    }

    // power := postfix ('^' unary)?       (يمين-الارتباط)
    function parsePower() {
      const b = parsePostfix()
      if (peek() === '^') {
        pos++
        const e = parseUnary()
        const value = Math.pow(b.value, e.value)
        if (!Number.isFinite(value)) throw bad('domain')
        return leaf(`${b.text} ^ ${e.text}`, value,
          [...b.steps, ...e.steps, step(`${b.text} ^ ${e.text}`, fmt(value), 'pow')])
      }
      return b
    }

    // postfix := primary ('!' | '%')*
    function parsePostfix() {
      let v = parsePrimary()
      v.lastPct = false
      while (peek() === '!' || peek() === '%') {
        if (src[pos++] === '!') {
          const value = fact(v.value)
          v = leaf(`${v.text}!`, value, [...v.steps, step(`${v.text}!`, fmt(value), 'fact')])
          v.lastPct = false
        } else {
          const value = v.value / 100
          v = leaf(`${v.text}%`, value, [...v.steps, step(`${v.text}%`, fmt(value), 'pct')])
          v.lastPct = true
        }
      }
      return v
    }

    function parsePrimary() {
      const rest = src.slice(pos)
      let m
      if (rest[0] === '(') {
        pos++
        const v = parseExpr()
        if (peek() !== ')') throw bad('syntax')
        pos++
        return leaf(`(${v.text})`, v.value, v.steps)
      }
      if (rest[0] === '√') {
        pos++
        const v = parsePostfix()
        if (v.value < 0) throw bad('domain')
        const value = Math.sqrt(v.value)
        return leaf(`√${v.text}`, value, [...v.steps, step(`√${v.text}`, fmt(value), 'sqrt')])
      }
      if ((m = rest.match(/^(\d+\.?\d*|\.\d+)/))) {
        pos += m[0].length
        return leaf(m[0], parseFloat(m[0]))
      }
      if (rest[0] === 'π') { pos++; return leaf('π', Math.PI, [step('π', fmt(Math.PI), 'const')]) }
      if ((m = rest.match(/^([A-Za-z][A-Za-z0-9]*)\(/)) && NAMES.includes(m[1])) {
        pos += m[0].length
        return call(m[1], pos - m[0].length)
      }
      if (rest[0] === 'e') { pos++; return leaf('e', Math.E, [step('e', fmt(Math.E), 'const')]) }
      if (rest[0] === 'x' && Object.prototype.hasOwnProperty.call(vars, 'x')) {
        pos++
        return leaf('x', vars.x, [step('x', fmt(vars.x), 'const')])
      }
      throw bad('syntax')
    }

    const root = parseExpr()
    if (pos !== src.length) throw bad('syntax')
    if (!Number.isFinite(root.value)) throw bad('domain')

    return { ok: true, original: String(raw).trim(), steps: root.steps, final: fmt(root.value) }
  } catch (e) {
    return { ok: false, error: (e && e.code) || 'syntax' }
  }
}