// ============================================================
// complex — محرك الأعداد المركبة
//  • evaluateComplex : محلل تعبيرات آمن بأعداد مركبة (بدون eval)
//    يدعم + − × ÷ ^ والأقواس والضرب الضمني (2i ، i(1+2i))
//    والثوابت i و π و e والدوال re im conj arg abs sqrt exp ln
//    ورموز القيمة المطلقة |z|.
//  • polarOf         : التحويل إلى الصورة القطبية r∠θ
//  • solveEquation   : حل المعادلات (درجة ≤ 2 أو xⁿ = k لـ n = 2..4)
//    وإيجاد جميع الحلول المركبة.
// ============================================================
import { MathEngine } from './core'

const ME = MathEngine

const snap = v => (Math.abs(v) < 1e-12 ? 0 : v)
const Z = (re, im = 0) => ({ re: snap(re), im: snap(im) })

export const cz = {
  add(a, b) { return Z(a.re + b.re, a.im + b.im) },
  sub(a, b) { return Z(a.re - b.re, a.im - b.im) },
  neg(a) { return Z(-a.re, -a.im) },
  mul(a, b) { return Z(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re) },
  div(a, b) {
    const d = b.re * b.re + b.im * b.im
    if (d === 0) throw { code: 'div0' }
    return Z((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d)
  },
  conj(a) { return Z(a.re, -a.im) },
  abs(a) { return Math.hypot(a.re, a.im) },
  arg(a) { return Math.atan2(a.im, a.re) },
  sqrt(a) {
    const r = Math.hypot(a.re, a.im)
    if (r === 0) return Z(0)
    const th = Math.atan2(a.im, a.re) / 2
    const s = Math.sqrt(r)
    return Z(s * Math.cos(th), s * Math.sin(th))
  },
  exp(a) {
    const e = Math.exp(a.re)
    return Z(e * Math.cos(a.im), e * Math.sin(a.im))
  },
  ln(a) {
    if (a.re === 0 && a.im === 0) throw { code: 'domain' }
    return Z(Math.log(Math.hypot(a.re, a.im)), Math.atan2(a.im, a.re))
  },
  pow(a, b) {
    if (b.im === 0 && Number.isInteger(b.re)) {
      return ipow(a, b.re)
    }
    // a^b = exp(b · ln a) — فرع رئيسي
    return cz.exp(cz.mul(b, cz.ln(a)))
  }
}

function ipow(a, n) {
  if (n === 0) return Z(1)
  let r = Z(1)
  let base = a
  let k = Math.abs(n)
  while (k) {
    if (k & 1) r = cz.mul(r, base)
    base = cz.mul(base, base)
    k = Math.floor(k / 2)
  }
  return n < 0 ? cz.div(Z(1), r) : r
}

// ── عرض العدد المركب: '3 + 4i' ، '−2i' ، '1 − i' ، '5' ──
export const fmt = (z) => {
  const re = snap(z.re)
  const im = snap(z.im)
  if (im === 0) return ME.format(re)
  const imAbs = ME.format(Math.abs(im))
  const imPart = imAbs === '1' ? 'i' : imAbs + 'i'
  if (re === 0) return im < 0 ? '−' + imPart : imPart
  return ME.format(re) + (im < 0 ? ' − ' : ' + ') + imPart
}

// عرض رقم حقيقي بنفس أسلوب المحرك
export const fmtNum = n => ME.format(n)

// ── التحليل: تعبير مركب → { re, im } ──
const FUNCS = { re: 1, im: 1, conj: 1, arg: 1, abs: 1, sqrt: 1, exp: 1, ln: 1 }
// ملاحظة: '|' خارج رموز بداية الحدود حتى لا يبتلع قوس الإغلاق في |z| كثب ضرب ضمني
const startsPrimary = c => /[0-9.(iπ√A-Za-z]/.test(c)

export function evaluateComplex(raw) {
  let src = String(raw)
    .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
    .replace(/[\[\]]/g, '')
    .replace(/\s+/g, '')
  if (!src) throw { code: 'syntax' }

  let open = 0
  for (const c of src) {
    if (c === '(') open++
    else if (c === ')') { if (--open < 0) throw { code: 'syntax' } }
  }
  src += ')'.repeat(open)

  let pos = 0
  const peek = () => src[pos]

  function call(name, v) {
    switch (name) {
      case 're': return Z(v.re)
      case 'im': return Z(v.im)
      case 'conj': return cz.conj(v)
      case 'abs': return Z(cz.abs(v))
      case 'arg': return Z(cz.arg(v))
      case 'sqrt': return cz.sqrt(v)
      case 'exp': return cz.exp(v)
      case 'ln': return cz.ln(v)
    }
    throw { code: 'syntax' }
  }

  function parseExpr() {
    let v = parseTerm()
    while (peek() === '+' || peek() === '-') {
      const op = src[pos++]
      const r = parseTerm()
      v = op === '+' ? cz.add(v, r) : cz.sub(v, r)
    }
    return v
  }
  function parseTerm() {
    let v = parseUnary()
    for (;;) {
      const c = peek()
      if (c === '*') { pos++; v = cz.mul(v, parseUnary()) }
      else if (c === '/') { pos++; v = cz.div(v, parseUnary()) }
      else if (c !== undefined && startsPrimary(c)) v = cz.mul(v, parseUnary())
      else break
    }
    return v
  }
  function parseUnary() {
    const c = peek()
    if (c === '-') { pos++; return cz.neg(parseUnary()) }
    if (c === '+') { pos++; return parseUnary() }
    return parsePower()
  }
  function parsePower() {
    const b = parsePostfix()
    if (peek() === '^') {
      pos++
      return cz.pow(b, parseUnary())
    }
    return b
  }
  function parsePostfix() {
    return parsePrimary()
  }
  function parsePrimary() {
    const rest = src.slice(pos)
    let m
    if (rest[0] === '(') {
      pos++
      const v = parseExpr()
      if (peek() !== ')') throw { code: 'syntax' }
      pos++
      return v
    }
    if (rest[0] === '|') {
      pos++
      const v = parseExpr()
      if (peek() !== '|') throw { code: 'syntax' }
      pos++
      return Z(cz.abs(v))
    }
    if (rest[0] === '√') {
      pos++
      return cz.sqrt(parseUnary())
    }
    if ((m = rest.match(/^(\d+\.?\d*|\.\d+)/))) {
      pos += m[0].length
      return Z(parseFloat(m[0]))
    }
    if (rest[0] === 'π') { pos++; return Z(Math.PI) }
    if ((m = rest.match(/^([A-Za-z][A-Za-z0-9]*)\(/)) && Object.prototype.hasOwnProperty.call(FUNCS, m[1])) {
      pos += m[0].length
      const v = parseExpr()
      if (peek() !== ')') throw { code: 'syntax' }
      pos++
      return call(m[1], v)
    }
    if (rest[0] === 'i') { pos++; return Z(0, 1) }
    if (rest[0] === 'e') { pos++; return Z(Math.E) }
    throw { code: 'syntax' }
  }

  const value = parseExpr()
  if (pos !== src.length) throw { code: 'syntax' }
  if (!Number.isFinite(value.re) || !Number.isFinite(value.im)) throw { code: 'domain' }
  return Z(value.re, value.im)
}

// ── الصورة القطبية: r ، الزاوية بالراديان والدرجات ──
export function polarOf(z) {
  const r = cz.abs(z)
  const rad = cz.arg(z)
  const deg = rad * 180 / Math.PI
  return { r, rad, deg }
}

// درجة الزاوية ضمن [0، 360) والفريدة ضمن (−180، 180]
export const deg360 = d => ((d % 360) + 360) % 360
export const degSigned = d => {
  const n = deg360(d)
  return n > 180 ? n - 360 : n
}

// ── حل المعادلات: درجة ≤ 2 أو xⁿ = k (n = 2..4) ──
// يعيد { ok:true, roots, degree, special } أو { ok:false, error }
// special: 'all' | 'none' | null
export function solveEquation(raw) {
  let src = String(raw)
    .replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/')
    .replace(/\s+/g, '')
  if (!src) return { ok: false, error: 'syntax' }
  if ((src.match(/=/g) || []).length > 1) return { ok: false, error: 'multi' }

  const sides = src.split('=')
  const lhs = sides[0] || ''
  const rhs = sides.length > 1 ? sides[1] : ''

  const poly = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
  const addPoly = (side, sign) => {
    if (!side) return
    const terms = side.split(/(?=[+-])/)
    for (let t of terms) {
      t = t.trim()
      if (!t) continue
      let s = 1
      if (t[0] === '-') { s = -1; t = t.slice(1) }
      else if (t[0] === '+') t = t.slice(1)
      let m
      if ((m = t.match(/^(\d*\.?\d+)\*?x(?:\^(\d+))?$/))) {
        const p = m[2] === undefined ? 1 : parseInt(m[2], 10)
        if (p > 4) return { error: 'deg' }
        poly[p] += (m[1] === '' ? 1 : parseFloat(m[1])) * s * sign
      } else if ((m = t.match(/^x(?:\^(\d+))?$/))) {
        const p = m[1] === undefined ? 1 : parseInt(m[1], 10)
        if (p > 4) return { error: 'deg' }
        poly[p] += s * sign
      } else if ((m = t.match(/^(\d*\.?\d+)$/))) {
        poly[0] += parseFloat(m[1]) * s * sign
      } else {
        return { error: 'syntax' }
      }
    }
    return null
  }

  const e1 = addPoly(lhs, 1)
  if (e1) return { ok: false, error: e1.error }
  const e2 = addPoly(rhs, -1)
  if (e2) return { ok: false, error: e2.error }

  let degree = 0
  for (let p = 4; p >= 0; p--) {
    poly[p] = snap(poly[p])
    if (poly[p] !== 0) { degree = p; break }
  }

  // هوية أو تناقض (كل المعاملات صفر)
  if (degree === 0) {
    if (poly[0] === 0) return { ok: true, degree: 0, roots: [], special: 'all' }
    return { ok: true, degree: 0, roots: [], special: 'none' }
  }

  // xⁿ = k حيث n = 2..4 ومعامل واحد وثابت فقط → جذور وحدة معمّمة
  if (degree >= 3) {
    let onlyMono = true
    for (let p = 0; p <= 4; p++) if (p !== degree && p !== 0 && poly[p] !== 0) onlyMono = false
    if (!onlyMono) return { ok: false, error: 'deg' }
    const a = poly[degree]
    const k = poly[0]
    const target = Z(-k / a) // حل a·xⁿ + k = 0
    const r = Math.hypot(target.re, target.im)
    const th = Math.atan2(target.im, target.re)
    const rr = Math.pow(r, 1 / degree)
    const roots = []
    for (let j = 0; j < degree; j++) {
      const ang = (th + 2 * Math.PI * j) / degree
      roots.push(Z(rr * Math.cos(ang), rr * Math.sin(ang)))
    }
    return { ok: true, degree, roots, special: null }
  }

  if (degree === 2) {
    const a = poly[2], b = poly[1], c = poly[0]
    const disc = b * b - 4 * a * c
    const sd = cz.sqrt(Z(disc))
    return {
      ok: true, degree: 2, special: null,
      roots: [
        cz.div(cz.sub(Z(-b), sd), Z(2 * a)),
        cz.div(cz.add(Z(-b), sd), Z(2 * a))
      ]
    }
  }

  // degree === 1
  const roots = [cz.div(Z(-poly[0]), Z(poly[1]))]
  return { ok: true, degree: 1, roots, special: null }
}