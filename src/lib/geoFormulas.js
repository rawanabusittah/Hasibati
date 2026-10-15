// ─────────────────────────────────────────────────────────────
//  حِساب الأشكال الهندسية — دوال نقيّة (لا تلمس الواجهة ولا الشبكة).
//
//  كل دالة تستقبل:
//    v : كائن قيم الحقول (نصوص من <input>)
//    t : دالة الترجمة
//  وتُعيد إحدى النتيجتين:
//    { error }                    → خطأ إدخال (نصّه مترجَم)
//    { summary, results }         → نجاح، مع ملخّص للحفظ في السجلّ
//
//  الفصل يسمح باختبار المنطق وحده دون تركيب أي مكوّن.
// ─────────────────────────────────────────────────────────────

const U = 'geo.unit'
const U2 = 'geo.unit2'
const U3 = 'geo.unit3'

const num = (x) => parseFloat(x)
const isPos = (x) => x > 0 && Number.isFinite(x)
const isInt = (x) => Number.isInteger(x)

// عرض الأرقام بمنزلتين عشريتين كحدٍّ أقصى (لتفادي خروج القيم الطويلة من المربّع)
export function gfmt(n, d = 2) {
  if (!Number.isFinite(n)) return String(n)
  const a = Math.abs(n)
  if (n !== 0 && (a >= 1e15 || a < 1e-9)) {
    return n.toExponential(8).replace(/\.?0+e/, 'e').replace('e+', 'e')
  }
  return String(Number(n.toFixed(d)))
}

// نصّ القيمة المعروضة (يدعم العناصر النصّية مثل نوع المثلث)
export function disp(it) {
  if (it.isText) return it.value
  return gfmt(it.raw, it.rounded ? 0 : 2)
}

export const GEO_CALCS = {
  // ── ثنائية الأبعاد ──
  circle(v, t) {
    const r = num(v.r)
    if (!isPos(r)) return { error: t('geo.err.r') }
    return {
      summary: 'r=' + r,
      results: [
        { label: t('geo.area'), raw: Math.PI * r * r, unit: t(U2), formula: 'A = π × r²' },
        { label: t('geo.perimeter'), raw: 2 * Math.PI * r, unit: t(U), formula: 'C = 2 × π × r' },
        { label: t('geo.diag2'), raw: 2 * r, unit: t(U), formula: 'd = 2 × r' }
      ]
    }
  },

  square(v, t) {
    const a = num(v.a)
    if (!isPos(a)) return { error: t('geo.err.side') }
    return {
      summary: 'a=' + a,
      results: [
        { label: t('geo.area'), raw: a * a, unit: t(U2), formula: 'A = a²' },
        { label: t('geo.perimeter'), raw: 4 * a, unit: t(U), formula: 'P = 4 × a' },
        { label: t('geo.diag'), raw: a * Math.SQRT2, unit: t(U), formula: 'd = a × √2' }
      ]
    }
  },

  rect(v, t) {
    const w = num(v.w)
    const h = num(v.h)
    if (!isPos(w) || !isPos(h)) return { error: t('geo.err.rect') }
    return {
      summary: 'w=' + w + ', h=' + h,
      results: [
        { label: t('geo.area'), raw: w * h, unit: t(U2), formula: 'A = w × h' },
        { label: t('geo.perimeter'), raw: 2 * (w + h), unit: t(U), formula: 'P = 2 × (w + h)' },
        { label: t('geo.diag'), raw: Math.sqrt(w * w + h * h), unit: t(U), formula: 'd = √(w² + h²)' }
      ]
    }
  },

  triangle(v, t) {
    const a = num(v.a)
    const b = num(v.b)
    const c = num(v.c)
    if (!isPos(a) || !isPos(b) || !isPos(c)) return { error: t('geo.err.side') }
    if (a + b <= c || a + c <= b || b + c <= a) return { error: t('geo.err.tri') }

    const s = (a + b + c) / 2
    const area = Math.sqrt(s * (s - a) * (s - b) * (s - c))
    let type = 'scal'
    const sq = [a, b, c].map((x) => x * x).sort((x, y) => x - y)
    if (a === b && b === c) type = 'equi'
    else if (Math.abs(sq[0] + sq[1] - sq[2]) < 1e-9) type = 'right'
    else if (a === b || b === c || a === c) type = 'iso'

    return {
      summary: 'a=' + a + ', b=' + b + ', c=' + c,
      results: [
        { label: t('geo.perimeter'), raw: a + b + c, unit: t(U), formula: 'P = a + b + c' },
        { label: t('geo.semiperim'), raw: s, unit: t(U), formula: 's = (a + b + c) ÷ 2' },
        { label: t('geo.area'), raw: area, unit: t(U2), formula: 'A = √(s(s−a)(s−b)(s−c))' },
        { label: t('geo.type'), value: t('geo.type.' + type), isText: true, formula: '' },
        { label: t('geo.inradius'), raw: area / s, unit: t(U), formula: 'r = A ÷ s' },
        { label: t('geo.circumradius'), raw: (a * b * c) / (4 * area), unit: t(U), formula: 'R = (a × b × c) ÷ (4A)' }
      ]
    }
  },

  right(v, t) {
    const ra = num(v.a)
    const rb = num(v.b)
    const rc = num(v.c)
    const va = isPos(ra)
    const vb = isPos(rb)
    const vc = isPos(rc)
    if ([va, vb, vc].filter(Boolean).length < 2) return { error: t('geo.err.right') }

    let A = va ? ra : 0
    let B = vb ? rb : 0
    let C = vc ? rc : 0
    let fA = '', fB = '', fC = ''

    if (va && vb && !vc) {
      C = Math.sqrt(A * A + B * B); fC = 'c = √(a² + b²)'
    } else if (va && vc && !vb) {
      if (C <= A) return { error: t('geo.err.hyp') }
      B = Math.sqrt(C * C - A * A); fB = 'b = √(c² − a²)'
    } else if (vb && vc && !va) {
      if (C <= B) return { error: t('geo.err.hyp') }
      A = Math.sqrt(C * C - B * B); fA = 'a = √(c² − b²)'
    } else {
      // ثلاثة أضلاع: تحقّق من صحّة فيثاغورس
      const sq = [A, B, C].map((x) => x * x).sort((x, y) => x - y)
      if (Math.abs(sq[0] + sq[1] - sq[2]) > 1e-6 * sq[2]) return { error: t('geo.err.rightTri') }
    }

    return {
      summary: 'a=' + A + ', b=' + B + ', c=' + C,
      results: [
        { label: t('geo.legA'), raw: A, unit: t(U), formula: fA },
        { label: t('geo.legB'), raw: B, unit: t(U), formula: fB },
        { label: t('geo.hyp'), raw: C, unit: t(U), formula: fC },
        { label: t('geo.area'), raw: (A * B) / 2, unit: t(U2), formula: 'A = (a × b) ÷ 2' },
        { label: t('geo.perimeter'), raw: A + B + C, unit: t(U), formula: 'P = a + b + c' }
      ]
    }
  },

  rhombus(v, t) {
    const d1 = num(v.d1)
    const d2 = num(v.d2)
    if (!isPos(d1) || !isPos(d2)) return { error: t('geo.err.diag') }
    const side = Math.sqrt(Math.pow(d1 / 2, 2) + Math.pow(d2 / 2, 2))
    return {
      summary: 'd1=' + d1 + ', d2=' + d2,
      results: [
        { label: t('geo.area'), raw: (d1 * d2) / 2, unit: t(U2), formula: 'A = (d₁ × d₂) ÷ 2' },
        { label: t('geo.side'), raw: side, unit: t(U), formula: 'a = √((d₁/2)² + (d₂/2)²)' },
        { label: t('geo.perimeter'), raw: 4 * side, unit: t(U), formula: 'P = 4 × a' }
      ]
    }
  },

  parallelogram(v, t) {
    const a = num(v.a)
    const b = num(v.b)
    const h = num(v.h)
    if (!isPos(a) || !isPos(b) || !isPos(h)) return { error: t('geo.err.rect') }
    return {
      summary: 'a=' + a + ', b=' + b + ', h=' + h,
      results: [
        { label: t('geo.area'), raw: b * h, unit: t(U2), formula: 'A = b × h' },
        { label: t('geo.perimeter'), raw: 2 * (a + b), unit: t(U), formula: 'P = 2 × (a + b)' }
      ]
    }
  },

  trapezoid(v, t) {
    const a = num(v.a)
    const b = num(v.b)
    const h = num(v.h)
    if (!isPos(a) || !isPos(b) || !isPos(h)) return { error: t('geo.err.rect') }
    const c = num(v.c)
    const d = num(v.d)
    const results = [
      { label: t('geo.area'), raw: ((a + b) / 2) * h, unit: t(U2), formula: 'A = ((a + b) ÷ 2) × h' },
      { label: t('geo.median'), raw: (a + b) / 2, unit: t(U), formula: 'm = (a + b) ÷ 2' }
    ]
    if (isPos(c) && isPos(d)) {
      results.push({ label: t('geo.perimeter'), raw: a + b + c + d, unit: t(U), formula: 'P = a + b + c + d' })
    }
    return { summary: 'a=' + a + ', b=' + b + ', h=' + h, results }
  },

  polygon(v, t) {
    const n = parseInt(v.n, 10)
    const s = num(v.s)
    if (!isInt(n) || n < 3) return { error: t('geo.err.poly') }
    if (!isPos(s)) return { error: t('geo.err.side') }
    const tan = Math.tan(Math.PI / n)
    return {
      summary: 'n=' + n + ', s=' + s,
      results: [
        { label: t('geo.perimeter'), raw: n * s, unit: t(U), formula: 'P = n × s' },
        { label: t('geo.area'), raw: (n * s * s) / (4 * tan), unit: t(U2), formula: 'A = (n × s²) ÷ (4 × tan(π/n))' },
        { label: t('geo.apothem'), raw: s / (2 * tan), unit: t(U), formula: 'r = s ÷ (2 × tan(π/n))' },
        { label: t('geo.circumradius'), raw: s / (2 * Math.sin(Math.PI / n)), unit: t(U), formula: 'R = s ÷ (2 × sin(π/n))' }
      ]
    }
  },

  ellipse(v, t) {
    const a = num(v.a)
    const b = num(v.b)
    if (!isPos(a) || !isPos(b)) return { error: t('geo.err.rect') }
    const per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))
    return {
      summary: 'a=' + a + ', b=' + b,
      results: [
        { label: t('geo.area'), raw: Math.PI * a * b, unit: t(U2), formula: 'A = π × a × b' },
        { label: t('geo.perimeter'), raw: per, unit: t(U), formula: 'P ≈ π[3(a+b) − √((3a+b)(a+3b))]' }
      ]
    }
  },

  sector(v, t) {
    const r = num(v.r)
    const deg = num(v.deg)
    if (!isPos(r)) return { error: t('geo.err.r') }
    if (!(deg > 0) || deg > 360 || !Number.isFinite(deg)) return { error: t('geo.err.angle') }
    const frac = deg / 360
    const arc = frac * 2 * Math.PI * r
    const chord = 2 * r * Math.sin(((deg / 2) * Math.PI) / 180)
    return {
      summary: 'r=' + r + ', θ=' + deg + '°',
      results: [
        { label: t('geo.area'), raw: frac * Math.PI * r * r, unit: t(U2), formula: 'A = (θ ÷ 360) × π × r²' },
        { label: t('geo.arc'), raw: arc, unit: t(U), formula: 'L = (θ ÷ 360) × 2 × π × r' },
        { label: t('geo.chord'), raw: chord, unit: t(U), formula: 'c = 2r × sin(θ ÷ 2)' },
        { label: t('geo.perimeter'), raw: arc + 2 * r, unit: t(U), formula: 'P = L + 2r' }
      ]
    }
  },

  // ── مجسّمات ──
  sphere(v, t) {
    const r = num(v.r)
    if (!isPos(r)) return { error: t('geo.err.r') }
    return {
      summary: 'r=' + r,
      results: [
        { label: t('geo.volume'), raw: (4 / 3) * Math.PI * Math.pow(r, 3), unit: t(U3), formula: 'V = 4/3 × π × r³' },
        { label: t('geo.surface'), raw: 4 * Math.PI * r * r, unit: t(U2), formula: 'S = 4 × π × r²' }
      ]
    }
  },

  hemisphere(v, t) {
    const r = num(v.r)
    if (!isPos(r)) return { error: t('geo.err.r') }
    return {
      summary: 'r=' + r,
      results: [
        { label: t('geo.volume'), raw: (2 / 3) * Math.PI * Math.pow(r, 3), unit: t(U3), formula: 'V = (2/3) × π × r³' },
        { label: t('geo.curvedSurface'), raw: 2 * Math.PI * r * r, unit: t(U2), formula: 'C = 2 × π × r²' },
        { label: t('geo.baseArea'), raw: Math.PI * r * r, unit: t(U2), formula: 'Aᵦ = π × r²' },
        { label: t('geo.surface'), raw: 3 * Math.PI * r * r, unit: t(U2), formula: 'S = 3 × π × r²' },
        { label: t('geo.diag2'), raw: 2 * r, unit: t(U), formula: 'd = 2 × r' }
      ]
    }
  },

  cube(v, t) {
    const a = num(v.a)
    if (!isPos(a)) return { error: t('geo.err.side') }
    return {
      summary: 'a=' + a,
      results: [
        { label: t('geo.volume'), raw: Math.pow(a, 3), unit: t(U3), formula: 'V = a³' },
        { label: t('geo.surface'), raw: 6 * a * a, unit: t(U2), formula: 'S = 6 × a²' },
        { label: t('geo.diagFace'), raw: a * Math.SQRT2, unit: t(U), formula: 'd = a × √2' },
        { label: t('geo.diagSpace'), raw: a * Math.sqrt(3), unit: t(U), formula: 'D = a × √3' }
      ]
    }
  },

  cuboid(v, t) {
    const l = num(v.l)
    const w = num(v.w)
    const h = num(v.h)
    if (!isPos(l) || !isPos(w) || !isPos(h)) return { error: t('geo.err.rect') }
    return {
      summary: 'l=' + l + ', w=' + w + ', h=' + h,
      results: [
        { label: t('geo.volume'), raw: l * w * h, unit: t(U3), formula: 'V = l × w × h' },
        { label: t('geo.surface'), raw: 2 * (l * w + l * h + w * h), unit: t(U2), formula: 'S = 2(lw + lh + wh)' },
        { label: t('geo.diagSpace'), raw: Math.sqrt(l * l + w * w + h * h), unit: t(U), formula: 'D = √(l² + w² + h²)' }
      ]
    }
  },

  cylinder(v, t) {
    const r = num(v.r)
    const h = num(v.h)
    if (!isPos(r) || !isPos(h)) return { error: t('geo.err.rect') }
    return {
      summary: 'r=' + r + ', h=' + h,
      results: [
        { label: t('geo.volume'), raw: Math.PI * r * r * h, unit: t(U3), formula: 'V = π × r² × h' },
        { label: t('geo.lateral'), raw: 2 * Math.PI * r * h, unit: t(U2), formula: 'L = 2 × π × r × h' },
        { label: t('geo.surface'), raw: 2 * Math.PI * r * (h + r), unit: t(U2), formula: 'S = 2 × π × r × (h + r)' }
      ]
    }
  },

  cone(v, t) {
    const r = num(v.r)
    const h = num(v.h)
    if (!isPos(r) || !isPos(h)) return { error: t('geo.err.rect') }
    const l = Math.sqrt(r * r + h * h)
    return {
      summary: 'r=' + r + ', h=' + h,
      results: [
        { label: t('geo.slant'), raw: l, unit: t(U), formula: 'l = √(r² + h²)' },
        { label: t('geo.volume'), raw: (1 / 3) * Math.PI * r * r * h, unit: t(U3), formula: 'V = (1/3) × π × r² × h' },
        { label: t('geo.lateral'), raw: Math.PI * r * l, unit: t(U2), formula: 'L = π × r × l' },
        { label: t('geo.surface'), raw: Math.PI * r * (l + r), unit: t(U2), formula: 'S = π × r × (l + r)' }
      ]
    }
  },

  pyramid(v, t) {
    const a = num(v.a)
    const h = num(v.h)
    if (!isPos(a) || !isPos(h)) return { error: t('geo.err.rect') }
    const half = a / 2
    const slant = Math.sqrt(h * h + half * half)
    const baseArea = a * a
    const lateral = 2 * a * slant
    return {
      summary: 'a=' + a + ', h=' + h,
      results: [
        { label: t('geo.volume'), raw: (baseArea * h) / 3, unit: t(U3), formula: 'V = (a² × h) ÷ 3' },
        { label: t('geo.baseArea'), raw: baseArea, unit: t(U2), formula: 'Aᵦ = a²' },
        { label: t('geo.slant'), raw: slant, unit: t(U), formula: 'l = √(h² + (a/2)²)' },
        { label: t('geo.lateral'), raw: lateral, unit: t(U2), formula: 'L = 2 × a × l' },
        { label: t('geo.surface'), raw: baseArea + lateral, unit: t(U2), formula: 'S = a² + 2 × a × l' },
        { label: t('geo.edge'), raw: Math.sqrt(h * h + half * half * 2), unit: t(U), formula: 'e = √(h² + a²/2)' }
      ]
    }
  },

  prism(v, t) {
    const n = parseInt(v.n, 10)
    const s = num(v.s)
    const h = num(v.h)
    if (!isInt(n) || n < 3) return { error: t('geo.err.poly') }
    if (!isPos(s) || !isPos(h)) return { error: t('geo.err.rect') }
    const baseArea = (n * s * s) / (4 * Math.tan(Math.PI / n))
    const per = n * s
    const lateral = per * h
    return {
      summary: 'n=' + n + ', s=' + s + ', h=' + h,
      results: [
        { label: t('geo.volume'), raw: baseArea * h, unit: t(U3), formula: 'V = Aᵦ × h' },
        { label: t('geo.baseArea'), raw: baseArea, unit: t(U2), formula: 'Aᵦ = (n × s²) ÷ (4 tan(π/n))' },
        { label: t('geo.basePerimeter'), raw: per, unit: t(U), formula: 'Pᵦ = n × s' },
        { label: t('geo.lateral'), raw: lateral, unit: t(U2), formula: 'L = Pᵦ × h' },
        { label: t('geo.surface'), raw: 2 * baseArea + lateral, unit: t(U2), formula: 'S = 2Aᵦ + L' }
      ]
    }
  },

  obliqueCylinder(v, t) {
    const r = num(v.r)
    const h = num(v.h)
    const th = num(v.tilt)
    if (!isPos(r) || !isPos(h)) return { error: t('geo.err.rect') }
    if (!(th > 0) || !(th < 90) || !Number.isFinite(th)) return { error: t('geo.err.tilt') }
    const rad = (th * Math.PI) / 180
    const gen = h / Math.sin(rad)
    const baseArea = Math.PI * r * r
    const lateral = 2 * Math.PI * r * gen
    return {
      summary: 'r=' + r + ', h=' + h + ', θ=' + th,
      results: [
        { label: t('geo.volume'), raw: baseArea * h, unit: t(U3), formula: 'V = π × r² × h' },
        { label: t('geo.baseArea'), raw: baseArea, unit: t(U2), formula: 'Aᵦ = π × r²' },
        { label: t('geo.generatrix'), raw: gen, unit: t(U), formula: 'l = h ÷ sin θ' },
        { label: t('geo.offset'), raw: h / Math.tan(rad), unit: t(U), formula: 'd = h ÷ tan θ' },
        { label: t('geo.lateral'), raw: lateral, unit: t(U2), formula: 'L = 2 × π × r × l' },
        { label: t('geo.surface'), raw: 2 * baseArea + lateral, unit: t(U2), formula: 'S = 2 × π × r² + L' }
      ]
    }
  },

  frustum(v, t) {
    const r1 = num(v.r1)
    const r2 = num(v.r2)
    const h = num(v.h)
    if (!isPos(r1) || !isPos(r2) || !isPos(h)) return { error: t('geo.err.rect') }
    const dr = r1 - r2
    const slant = Math.sqrt(h * h + dr * dr)
    const A1 = Math.PI * r1 * r1
    const A2 = Math.PI * r2 * r2
    const lateral = Math.PI * (r1 + r2) * slant
    return {
      summary: 'r1=' + r1 + ', r2=' + r2 + ', h=' + h,
      results: [
        { label: t('geo.volume'), raw: ((Math.PI * h) / 3) * (r1 * r1 + r1 * r2 + r2 * r2), unit: t(U3), formula: 'V = (π × h ÷ 3)(r₁² + r₁r₂ + r₂²)' },
        { label: t('geo.slant'), raw: slant, unit: t(U), formula: 'l = √(h² + (r₁ − r₂)²)' },
        { label: t('geo.lateral'), raw: lateral, unit: t(U2), formula: 'L = π × (r₁ + r₂) × l' },
        { label: t('geo.baseAreaBig'), raw: A1, unit: t(U2), formula: 'A₁ = π × r₁²' },
        { label: t('geo.baseAreaSmall'), raw: A2, unit: t(U2), formula: 'A₂ = π × r₂²' },
        { label: t('geo.surface'), raw: A1 + A2 + lateral, unit: t(U2), formula: 'S = A₁ + A₂ + L' }
      ]
    }
  },

  obliqueBox(v, t) {
    const a = num(v.a)
    const b = num(v.b)
    const c = num(v.c)
    const th = num(v.tilt)
    if (!isPos(a) || !isPos(b) || !isPos(c)) return { error: t('geo.err.rect') }
    if (!(th > 0) || !(th < 90) || !Number.isFinite(th)) return { error: t('geo.err.tilt') }
    const rad = (th * Math.PI) / 180
    const sin = Math.sin(rad)
    const hgt = c * sin
    const baseArea = a * b
    const lateral = 2 * b * c + 2 * a * c * sin
    return {
      summary: 'a=' + a + ', b=' + b + ', c=' + c + ', θ=' + th,
      results: [
        { label: t('geo.volume'), raw: baseArea * hgt, unit: t(U3), formula: 'V = a × b × h' },
        { label: t('geo.baseArea'), raw: baseArea, unit: t(U2), formula: 'Aᵦ = a × b' },
        { label: t('geo.vertHeight'), raw: hgt, unit: t(U), formula: 'h = c × sin θ' },
        { label: t('geo.offset'), raw: c * Math.cos(rad), unit: t(U), formula: 'd = c × cos θ' },
        { label: t('geo.lateral'), raw: lateral, unit: t(U2), formula: 'L = 2b·c + 2a·c·sin θ' },
        { label: t('geo.surface'), raw: 2 * baseArea + lateral, unit: t(U2), formula: 'S = 2(a·b + b·c + a·c·sin θ)' }
      ]
    }
  }
}
