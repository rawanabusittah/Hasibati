<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from '../composables/i18n'
import { saveTool } from '../services/cloud'
import SavedHistory from '../components/SavedHistory.vue'

const { L, t } = useI18n()

const activeShape = ref('circle')

// حقول القياسات
const circR = ref('')
const sqSide = ref('')
const rectW = ref('')
const rectH = ref('')
const triA = ref('')
const triB = ref('')
const triC = ref('')
const rtA = ref('')
const rtB = ref('')
const rtC = ref('')
const sphR = ref('')
// ── أشكال إضافية ──
const rhoD1 = ref('')
const rhoD2 = ref('')
const parA = ref('')
const parB = ref('')
const parH = ref('')
const trpA = ref('')
const trpB = ref('')
const trpH = ref('')
const trpC = ref('')
const trpD = ref('')
const polyN = ref('')
const polyS = ref('')
const ellA = ref('')
const ellB = ref('')
const secR = ref('')
const secAngle = ref('')
const cubeA = ref('')
const cubL = ref('')
const cubW = ref('')
const cubH = ref('')
const cylR = ref('')
const cylH = ref('')
const coneR = ref('')
const coneH = ref('')

const errors = reactive({ circle: '', square: '', rect: '', triangle: '', right: '', sphere: '', rhombus: '', parallelogram: '', trapezoid: '', polygon: '', ellipse: '', sector: '', cube: '', cuboid: '', cylinder: '', cone: '' })
const results = reactive({ circle: [], square: [], rect: [], triangle: [], right: [], sphere: [], rhombus: [], parallelogram: [], trapezoid: [], polygon: [], ellipse: [], sector: [], cube: [], cuboid: [], cylinder: [], cone: [] })

const shapes = [
  { id: 'circle', ar: 'الدائرة', en: 'Circle', icon: '⭕' },
  { id: 'square', ar: 'المربع', en: 'Square', icon: '🟦' },
  { id: 'rect', ar: 'المستطيل', en: 'Rectangle', icon: '▬' },
  { id: 'triangle', ar: 'المثلث', en: 'Triangle', icon: '🔺' },
  { id: 'right', ar: 'المثلث القائم', en: 'Right triangle', icon: '📐' },
  { id: 'rhombus', ar: 'المعين', en: 'Rhombus', icon: '🔷' },
  { id: 'parallelogram', ar: 'متوازي الأضلاع', en: 'Parallelogram', icon: '⬛' },
  { id: 'trapezoid', ar: 'شبه المنحرف', en: 'Trapezoid', icon: '⏢' },
  { id: 'polygon', ar: 'المضلع المنتظم', en: 'Regular polygon', icon: '⬡' },
  { id: 'ellipse', ar: 'القطع الناقص', en: 'Ellipse', icon: '🥚' },
  { id: 'sector', ar: 'القطاع الدائري', en: 'Sector', icon: '🍕' },
  { id: 'sphere', ar: 'الكرة', en: 'Sphere', icon: '🔵' },
  { id: 'cube', ar: 'المكعب', en: 'Cube', icon: '🧊' },
  { id: 'cuboid', ar: 'متوازي المستطيلات', en: 'Cuboid', icon: '📦' },
  { id: 'cylinder', ar: 'الأسطوانة', en: 'Cylinder', icon: '🛢️' },
  { id: 'cone', ar: 'المخروط', en: 'Cone', icon: '🍦' }
]

const U2 = 'geo.unit2', U3 = 'geo.unit3', U = 'geo.unit'

// عرض الأرقام بمنزلتين عشريتين كحدٍّ أقصى (لتفادي خروج القيم الطويلة من المربّع)
function gfmt(n, d = 2) {
  if (!Number.isFinite(n)) return String(n)
  const a = Math.abs(n)
  if (n !== 0 && (a >= 1e15 || a < 1e-9)) {
    return n.toExponential(8).replace(/\.?0+e/, 'e').replace('e+', 'e')
  }
  return String(Number(n.toFixed(d)))
}
function disp(it) {
  if (it.isText) return it.value
  return gfmt(it.raw, it.rounded ? 0 : 2)
}
function toggleRound(it) { it.rounded = !it.rounded }

function calc(shape) {
  switch (shape) {
    case 'circle': return calcCircle()
    case 'square': return calcSquare()
    case 'rect': return calcRect()
    case 'triangle': return calcTriangle()
    case 'right': return calcRight()
    case 'sphere': return calcSphere()
    case 'rhombus': return calcRhombus()
    case 'parallelogram': return calcParallelogram()
    case 'trapezoid': return calcTrapezoid()
    case 'polygon': return calcPolygon()
    case 'ellipse': return calcEllipse()
    case 'sector': return calcSector()
    case 'cube': return calcCube()
    case 'cuboid': return calcCuboid()
    case 'cylinder': return calcCylinder()
    case 'cone': return calcCone()
  }
}

function calcCircle() {
  const r = parseFloat(circR.value)
  if (!(r > 0) || !Number.isFinite(r)) { errors.circle = t('geo.err.r'); results.circle = []; return }
  errors.circle = ''
  results.circle = [
    { label: t('geo.area'), raw: Math.PI * r * r, unit: t(U2), formula: 'A = π × r²' },
    { label: t('geo.perimeter'), raw: 2 * Math.PI * r, unit: t(U), formula: 'C = 2 × π × r' },
    { label: t('geo.diag2'), raw: 2 * r, unit: t(U), formula: 'd = 2 × r' }
  ]
  saveTool('geometry', 'circle', 'r=' + r)
}
function calcSquare() {
  const a = parseFloat(sqSide.value)
  if (!(a > 0) || !Number.isFinite(a)) { errors.square = t('geo.err.side'); results.square = []; return }
  errors.square = ''
  results.square = [
    { label: t('geo.area'), raw: a * a, unit: t(U2), formula: 'A = a²' },
    { label: t('geo.perimeter'), raw: 4 * a, unit: t(U), formula: 'P = 4 × a' },
    { label: t('geo.diag'), raw: a * Math.SQRT2, unit: t(U), formula: 'd = a × √2' }
  ]
  saveTool('geometry', 'square', 'a=' + a)
}
function calcRect() {
  const w = parseFloat(rectW.value)
  const h = parseFloat(rectH.value)
  if (!(w > 0) || !(h > 0) || !Number.isFinite(w) || !Number.isFinite(h)) { errors.rect = t('geo.err.rect'); results.rect = []; return }
  errors.rect = ''
  results.rect = [
    { label: t('geo.area'), raw: w * h, unit: t(U2), formula: 'A = w × h' },
    { label: t('geo.perimeter'), raw: 2 * (w + h), unit: t(U), formula: 'P = 2 × (w + h)' },
    { label: t('geo.diag'), raw: Math.sqrt(w * w + h * h), unit: t(U), formula: 'd = √(w² + h²)' }
  ]
  saveTool('geometry', 'rect', 'w=' + w + ', h=' + h)
}
function calcTriangle() {
  const a = parseFloat(triA.value)
  const b = parseFloat(triB.value)
  const c = parseFloat(triC.value)
  if (!(a > 0) || !(b > 0) || !(c > 0) || !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) {
    errors.triangle = t('geo.err.side'); results.triangle = []; return
  }
  if (a + b <= c || a + c <= b || b + c <= a) { errors.triangle = t('geo.err.tri'); results.triangle = []; return }
  errors.triangle = ''
  const s = (a + b + c) / 2
  const area = Math.sqrt(s * (s - a) * (s - b) * (s - c))
  let type = 'scal'
  const sq = [a, b, c].map(x => x * x).sort((x, y) => x - y)
  if (a === b && b === c) type = 'equi'
  else if (Math.abs(sq[0] + sq[1] - sq[2]) < 1e-9) type = 'right'
  else if (a === b || b === c || a === c) type = 'iso'
  results.triangle = [
    { label: t('geo.perimeter'), raw: a + b + c, unit: t(U), formula: 'P = a + b + c' },
    { label: t('geo.semiperim'), raw: s, unit: t(U), formula: 's = (a + b + c) ÷ 2' },
    { label: t('geo.area'), raw: area, unit: t(U2), formula: 'A = √(s(s−a)(s−b)(s−c))' },
    { label: t('geo.type'), value: t('geo.type.' + type), isText: true, formula: '' },
    { label: t('geo.inradius'), raw: area / s, unit: t(U), formula: 'r = A ÷ s' },
    { label: t('geo.circumradius'), raw: (a * b * c) / (4 * area), unit: t(U), formula: 'R = (a × b × c) ÷ (4A)' }
  ]
  saveTool('geometry', 'triangle', 'a=' + a + ', b=' + b + ', c=' + c)
}
function calcRight() {
  const ra = parseFloat(rtA.value)
  const rb = parseFloat(rtB.value)
  const rc = parseFloat(rtC.value)
  const va = ra > 0 && Number.isFinite(ra)
  const vb = rb > 0 && Number.isFinite(rb)
  const vc = rc > 0 && Number.isFinite(rc)
  const given = [va, vb, vc].filter(Boolean).length

  if (given < 2) { errors.right = t('geo.err.right'); results.right = []; return }

  let A = va ? ra : 0
  let B = vb ? rb : 0
  let C = vc ? rc : 0
  let fA = '', fB = '', fC = ''

  if (va && vb && !vc) { C = Math.sqrt(A * A + B * B); fC = 'c = √(a² + b²)' }
  else if (va && vc && !vb) {
    if (C <= A) { errors.right = t('geo.err.hyp'); results.right = []; return }
    B = Math.sqrt(C * C - A * A); fB = 'b = √(c² − a²)'
  } else if (vb && vc && !va) {
    if (C <= B) { errors.right = t('geo.err.hyp'); results.right = []; return }
    A = Math.sqrt(C * C - B * B); fA = 'a = √(c² − b²)'
  } else {
    // ثلاثة أضلاع: تحقّق من صحة فيثاغورس
    const sq = [A, B, C].map(x => x * x).sort((x, y) => x - y)
    if (Math.abs(sq[0] + sq[1] - sq[2]) > 1e-6 * sq[2]) { errors.right = t('geo.err.rightTri'); results.right = []; return }
  }

  errors.right = ''
  const area = (A * B) / 2
  results.right = [
    { label: t('geo.legA'), raw: A, unit: t(U), formula: fA },
    { label: t('geo.legB'), raw: B, unit: t(U), formula: fB },
    { label: t('geo.hyp'), raw: C, unit: t(U), formula: fC },
    { label: t('geo.area'), raw: area, unit: t(U2), formula: 'A = (a × b) ÷ 2' },
    { label: t('geo.perimeter'), raw: A + B + C, unit: t(U), formula: 'P = a + b + c' }
  ]
  saveTool('geometry', 'right', 'a=' + A + ', b=' + B + ', c=' + C)
}
function calcSphere() {
  const r = parseFloat(sphR.value)
  if (!(r > 0) || !Number.isFinite(r)) { errors.sphere = t('geo.err.r'); results.sphere = []; return }
  errors.sphere = ''
  results.sphere = [
    { label: t('geo.volume'), raw: (4 / 3) * Math.PI * Math.pow(r, 3), unit: t(U3), formula: 'V = 4/3 × π × r³' },
    { label: t('geo.surface'), raw: 4 * Math.PI * r * r, unit: t(U2), formula: 'S = 4 × π × r²' }
  ]
  saveTool('geometry', 'sphere', 'r=' + r)
}

// ════════ أشكال ثنائية الأبعاد إضافية ════════
function calcRhombus() {
  const d1 = parseFloat(rhoD1.value)
  const d2 = parseFloat(rhoD2.value)
  if (!(d1 > 0) || !(d2 > 0) || !Number.isFinite(d1) || !Number.isFinite(d2)) { errors.rhombus = t('geo.err.diag'); results.rhombus = []; return }
  errors.rhombus = ''
  const side = Math.sqrt(Math.pow(d1 / 2, 2) + Math.pow(d2 / 2, 2))
  results.rhombus = [
    { label: t('geo.area'), raw: (d1 * d2) / 2, unit: t(U2), formula: 'A = (d₁ × d₂) ÷ 2' },
    { label: t('geo.side'), raw: side, unit: t(U), formula: 'a = √((d₁/2)² + (d₂/2)²)' },
    { label: t('geo.perimeter'), raw: 4 * side, unit: t(U), formula: 'P = 4 × a' }
  ]
  saveTool('geometry', 'rhombus', 'd1=' + d1 + ', d2=' + d2)
}
function calcParallelogram() {
  const a = parseFloat(parA.value)
  const b = parseFloat(parB.value)
  const h = parseFloat(parH.value)
  if (!(a > 0) || !(b > 0) || !(h > 0) || !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(h)) { errors.parallelogram = t('geo.err.rect'); results.parallelogram = []; return }
  errors.parallelogram = ''
  results.parallelogram = [
    { label: t('geo.area'), raw: b * h, unit: t(U2), formula: 'A = b × h' },
    { label: t('geo.perimeter'), raw: 2 * (a + b), unit: t(U), formula: 'P = 2 × (a + b)' }
  ]
  saveTool('geometry', 'parallelogram', 'a=' + a + ', b=' + b + ', h=' + h)
}
function calcTrapezoid() {
  const a = parseFloat(trpA.value)
  const b = parseFloat(trpB.value)
  const h = parseFloat(trpH.value)
  if (!(a > 0) || !(b > 0) || !(h > 0) || !Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(h)) { errors.trapezoid = t('geo.err.rect'); results.trapezoid = []; return }
  errors.trapezoid = ''
  const c = parseFloat(trpC.value)
  const d = parseFloat(trpD.value)
  results.trapezoid = [
    { label: t('geo.area'), raw: ((a + b) / 2) * h, unit: t(U2), formula: 'A = ((a + b) ÷ 2) × h' },
    { label: t('geo.median'), raw: (a + b) / 2, unit: t(U), formula: 'm = (a + b) ÷ 2' }
  ]
  if (c > 0 && d > 0 && Number.isFinite(c) && Number.isFinite(d)) {
    results.trapezoid.push({ label: t('geo.perimeter'), raw: a + b + c + d, unit: t(U), formula: 'P = a + b + c + d' })
  }
  saveTool('geometry', 'trapezoid', 'a=' + a + ', b=' + b + ', h=' + h)
}
function calcPolygon() {
  const n = parseInt(polyN.value, 10)
  const s = parseFloat(polyS.value)
  if (!Number.isInteger(n) || n < 3) { errors.polygon = t('geo.err.poly'); results.polygon = []; return }
  if (!(s > 0) || !Number.isFinite(s)) { errors.polygon = t('geo.err.side'); results.polygon = []; return }
  errors.polygon = ''
  const tan = Math.tan(Math.PI / n)
  results.polygon = [
    { label: t('geo.perimeter'), raw: n * s, unit: t(U), formula: 'P = n × s' },
    { label: t('geo.area'), raw: (n * s * s) / (4 * tan), unit: t(U2), formula: 'A = (n × s²) ÷ (4 × tan(π/n))' },
    { label: t('geo.apothem'), raw: s / (2 * tan), unit: t(U), formula: 'r = s ÷ (2 × tan(π/n))' },
    { label: t('geo.circumradius'), raw: s / (2 * Math.sin(Math.PI / n)), unit: t(U), formula: 'R = s ÷ (2 × sin(π/n))' }
  ]
  saveTool('geometry', 'polygon', 'n=' + n + ', s=' + s)
}
function calcEllipse() {
  const a = parseFloat(ellA.value)
  const b = parseFloat(ellB.value)
  if (!(a > 0) || !(b > 0) || !Number.isFinite(a) || !Number.isFinite(b)) { errors.ellipse = t('geo.err.rect'); results.ellipse = []; return }
  errors.ellipse = ''
  const per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)))
  results.ellipse = [
    { label: t('geo.area'), raw: Math.PI * a * b, unit: t(U2), formula: 'A = π × a × b' },
    { label: t('geo.perimeter'), raw: per, unit: t(U), formula: 'P ≈ π[3(a+b) − √((3a+b)(a+3b))]' }
  ]
  saveTool('geometry', 'ellipse', 'a=' + a + ', b=' + b)
}
function calcSector() {
  const r = parseFloat(secR.value)
  const deg = parseFloat(secAngle.value)
  if (!(r > 0) || !Number.isFinite(r)) { errors.sector = t('geo.err.r'); results.sector = []; return }
  if (!(deg > 0) || deg > 360 || !Number.isFinite(deg)) { errors.sector = t('geo.err.angle'); results.sector = []; return }
  errors.sector = ''
  const frac = deg / 360
  const arc = frac * 2 * Math.PI * r
  const chord = 2 * r * Math.sin((deg / 2) * Math.PI / 180)
  results.sector = [
    { label: t('geo.area'), raw: frac * Math.PI * r * r, unit: t(U2), formula: 'A = (θ ÷ 360) × π × r²' },
    { label: t('geo.arc'), raw: arc, unit: t(U), formula: 'L = (θ ÷ 360) × 2 × π × r' },
    { label: t('geo.chord'), raw: chord, unit: t(U), formula: 'c = 2r × sin(θ ÷ 2)' },
    { label: t('geo.perimeter'), raw: arc + 2 * r, unit: t(U), formula: 'P = L + 2r' }
  ]
  saveTool('geometry', 'sector', 'r=' + r + ', θ=' + deg + '°')
}

// ════════ مجسمات ثلاثية الأبعاد ════════
function calcCube() {
  const a = parseFloat(cubeA.value)
  if (!(a > 0) || !Number.isFinite(a)) { errors.cube = t('geo.err.side'); results.cube = []; return }
  errors.cube = ''
  results.cube = [
    { label: t('geo.volume'), raw: Math.pow(a, 3), unit: t(U3), formula: 'V = a³' },
    { label: t('geo.surface'), raw: 6 * a * a, unit: t(U2), formula: 'S = 6 × a²' },
    { label: t('geo.diagFace'), raw: a * Math.SQRT2, unit: t(U), formula: 'd = a × √2' },
    { label: t('geo.diagSpace'), raw: a * Math.sqrt(3), unit: t(U), formula: 'D = a × √3' }
  ]
  saveTool('geometry', 'cube', 'a=' + a)
}
function calcCuboid() {
  const l = parseFloat(cubL.value)
  const w = parseFloat(cubW.value)
  const h = parseFloat(cubH.value)
  if (!(l > 0) || !(w > 0) || !(h > 0) || !Number.isFinite(l) || !Number.isFinite(w) || !Number.isFinite(h)) { errors.cuboid = t('geo.err.rect'); results.cuboid = []; return }
  errors.cuboid = ''
  results.cuboid = [
    { label: t('geo.volume'), raw: l * w * h, unit: t(U3), formula: 'V = l × w × h' },
    { label: t('geo.surface'), raw: 2 * (l * w + l * h + w * h), unit: t(U2), formula: 'S = 2(lw + lh + wh)' },
    { label: t('geo.diagSpace'), raw: Math.sqrt(l * l + w * w + h * h), unit: t(U), formula: 'D = √(l² + w² + h²)' }
  ]
  saveTool('geometry', 'cuboid', 'l=' + l + ', w=' + w + ', h=' + h)
}
function calcCylinder() {
  const r = parseFloat(cylR.value)
  const h = parseFloat(cylH.value)
  if (!(r > 0) || !(h > 0) || !Number.isFinite(r) || !Number.isFinite(h)) { errors.cylinder = t('geo.err.rect'); results.cylinder = []; return }
  errors.cylinder = ''
  results.cylinder = [
    { label: t('geo.volume'), raw: Math.PI * r * r * h, unit: t(U3), formula: 'V = π × r² × h' },
    { label: t('geo.lateral'), raw: 2 * Math.PI * r * h, unit: t(U2), formula: 'L = 2 × π × r × h' },
    { label: t('geo.surface'), raw: 2 * Math.PI * r * (h + r), unit: t(U2), formula: 'S = 2 × π × r × (h + r)' }
  ]
  saveTool('geometry', 'cylinder', 'r=' + r + ', h=' + h)
}
function calcCone() {
  const r = parseFloat(coneR.value)
  const h = parseFloat(coneH.value)
  if (!(r > 0) || !(h > 0) || !Number.isFinite(r) || !Number.isFinite(h)) { errors.cone = t('geo.err.rect'); results.cone = []; return }
  errors.cone = ''
  const l = Math.sqrt(r * r + h * h)
  results.cone = [
    { label: t('geo.slant'), raw: l, unit: t(U), formula: 'l = √(r² + h²)' },
    { label: t('geo.volume'), raw: (1 / 3) * Math.PI * r * r * h, unit: t(U3), formula: 'V = (1/3) × π × r² × h' },
    { label: t('geo.lateral'), raw: Math.PI * r * l, unit: t(U2), formula: 'L = π × r × l' },
    { label: t('geo.surface'), raw: Math.PI * r * (l + r), unit: t(U2), formula: 'S = π × r × (l + r)' }
  ]
  saveTool('geometry', 'cone', 'r=' + r + ', h=' + h)
}
</script>

<template>
  <div class="section tool-page" style="max-width: 1180px">
    <!-- ════ العنوان ════ -->
    <header class="page-head">
      <h1 class="section-title">{{ L('حساب الأشكال الهندسية', 'Geometry Calculator') }}</h1>
      <p class="section-sub">{{ L('اختر شكلاً واكتب أبعاده لتظهر كل النتائج مباشرة مع المعادلة المستخدمة.', 'Pick a shape, type its measurements, and watch every result appear with the formula behind it.') }}</p>
    </header>

    <!-- ════ شريط اختيار الشكل ════ -->
    <div class="calc-bar shape-bar" role="tablist" :aria-label="L('الأشكال الهندسية', 'Geometric shapes')">
      <button
        v-for="sh in shapes"
        :key="sh.id"
        type="button"
        class="geo-tab"
        :class="{ active: activeShape === sh.id }"
        role="tab"
        :aria-selected="String(activeShape === sh.id)"
        :aria-controls="sh.id + '-panel'"
        @click="activeShape = sh.id"
      >{{ sh.icon }} <span>{{ L(sh.ar, sh.en) }}</span></button>
    </div>

    <div class="calc-layout calc-layout--ops">
      <!-- ════ القياسات ════ -->
      <div class="ops-col">
        <section class="ops" aria-labelledby="meas-h">
          <div class="panel-bar"><b id="meas-h">{{ L('القياسات', 'Measurements') }}</b></div>
          <div class="panel-body">

            <!-- الدائرة -->
            <div class="geo-panel" :class="{ active: activeShape === 'circle' }" id="circle-panel" role="tabpanel" :aria-label="L('حساب الدائرة', 'Circle calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('رسم توضيحي للدائرة مع نصف القطر والقطر', 'Circle illustration showing radius and diameter')">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#4f9cf9" stroke-width="2" stroke-dasharray="6 3" opacity="0.5"/>
                  <circle cx="60" cy="60" r="2.5" fill="#4f9cf9"/>
                  <line x1="60" y1="60" x2="108" y2="60" stroke="#4f9cf9" stroke-width="1.5" opacity="0.8"/>
                  <text x="82" y="55" fill="#4f9cf9" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r</text>
                  <line x1="12" y1="60" x2="108" y2="60" stroke="#a78bfa" stroke-width="1" opacity="0.4" stroke-dasharray="3 2"/>
                  <text x="60" y="76" fill="#a78bfa" font-size="8" font-family="Cairo,sans-serif" text-anchor="middle">d = 2r</text>
                </svg>
              </div>
              <div class="formula-bar">A = π × r² | C = 2 × π × r | d = 2r</div>
              <div class="input-group">
                <label for="circle-r">{{ L('نصف القطر (r)', 'Radius (r)') }}</label>
                <input type="number" id="circle-r" v-model="circR" :placeholder="L('مثال: 5', 'e.g. 5')" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="circle-error" @keydown.enter.prevent="calc('circle')" />
                <div id="circle-error" class="error-msg" role="alert" aria-live="polite">{{ errors.circle }}</div>
              </div>
              <button type="button" class="btn-primary" @click="calc('circle')">{{ L('احسب الدائرة', 'Calculate circle') }}</button>
            </div>

            <!-- المربع -->
            <div class="geo-panel" :class="{ active: activeShape === 'square' }" id="square-panel" role="tabpanel" :aria-label="L('حساب المربع', 'Square calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('رسم توضيحي للمربع مع الضلع والقطر', 'Square illustration showing side and diagonal')">
                  <rect x="15" y="15" width="90" height="90" fill="none" stroke="#34d399" stroke-width="2" stroke-dasharray="6 3" opacity="0.6"/>
                  <line x1="15" y1="15" x2="105" y2="105" stroke="#a78bfa" stroke-width="1" opacity="0.4" stroke-dasharray="3 2"/>
                  <line x1="15" y1="8" x2="105" y2="8" stroke="#34d399" stroke-width="1.5" opacity="0.8"/>
                  <text x="60" y="6" fill="#34d399" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
                </svg>
              </div>
              <div class="formula-bar">A = a² | P = 4 × a | d = a × √2</div>
              <div class="input-group">
                <label for="square-side">{{ L('طول الضلع (a)', 'Side length (a)') }}</label>
                <input type="number" id="square-side" v-model="sqSide" :placeholder="L('مثال: 7', 'e.g. 7')" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="square-error" @keydown.enter.prevent="calc('square')" />
                <div id="square-error" class="error-msg" role="alert" aria-live="polite">{{ errors.square }}</div>
              </div>
              <button type="button" class="btn-primary" @click="calc('square')">{{ L('احسب المربع', 'Calculate square') }}</button>
            </div>

            <!-- المستطيل -->
            <div class="geo-panel" :class="{ active: activeShape === 'rect' }" id="rect-panel" role="tabpanel" :aria-label="L('حساب المستطيل', 'Rectangle calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 100" width="140" height="100" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('رسم توضيحي للمستطيل بالعرض والارتفاع', 'Rectangle illustration showing width and height')">
                  <rect x="10" y="15" width="120" height="70" fill="none" stroke="#fb923c" stroke-width="2" stroke-dasharray="6 3" opacity="0.6"/>
                  <line x1="10" y1="15" x2="130" y2="85" stroke="#a78bfa" stroke-width="1" opacity="0.4" stroke-dasharray="3 2"/>
                  <text x="70" y="10" fill="#fb923c" font-size="8" font-family="Cairo,sans-serif" text-anchor="middle">w</text>
                  <text x="136" y="54" fill="#fb923c" font-size="8" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
                </svg>
              </div>
              <div class="formula-bar">A = w × h | P = 2(w + h) | d = √(w² + h²)</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="rect-w">{{ L('العرض (w)', 'Width (w)') }}</label>
                  <input type="number" id="rect-w" v-model="rectW" :placeholder="L('مثال: 8', 'e.g. 8')" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="rect-error" @keydown.enter.prevent="calc('rect')" />
                </div>
                <div class="input-group">
                  <label for="rect-h">{{ L('الارتفاع (h)', 'Height (h)') }}</label>
                  <input type="number" id="rect-h" v-model="rectH" :placeholder="L('مثال: 5', 'e.g. 5')" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="rect-error" @keydown.enter.prevent="calc('rect')" />
                </div>
              </div>
              <div id="rect-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.rect }}</div>
              <button type="button" class="btn-primary" @click="calc('rect')">{{ L('احسب المستطيل', 'Calculate rectangle') }}</button>
            </div>

            <!-- المثلث -->
            <div class="geo-panel" :class="{ active: activeShape === 'triangle' }" id="triangle-panel" role="tabpanel" :aria-label="L('حساب المثلث', 'Triangle calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('رسم توضيحي لمثلث بأضلاعه a و b و c', 'Triangle illustration with sides a, b and c')">
                  <polygon points="15,95 125,95 85,15" fill="none" stroke="#f87171" stroke-width="2" stroke-dasharray="6 3" opacity="0.65"/>
                  <text x="70" y="108" fill="#f87171" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">c</text>
                  <text x="112" y="50" fill="#f87171" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">b</text>
                  <text x="42" y="50" fill="#f87171" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
                </svg>
              </div>
              <div class="formula-bar">s = (a+b+c)/2 | A = √(s(s−a)(s−b)(s−c))</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="tri-a">{{ L('الضلع a', 'Side a') }}</label>
                  <input type="number" id="tri-a" v-model="triA" placeholder="3" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="tri-error" @keydown.enter.prevent="calc('triangle')" />
                </div>
                <div class="input-group">
                  <label for="tri-b">{{ L('الضلع b', 'Side b') }}</label>
                  <input type="number" id="tri-b" v-model="triB" placeholder="4" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="tri-error" @keydown.enter.prevent="calc('triangle')" />
                </div>
                <div class="input-group">
                  <label for="tri-c">{{ L('الضلع c', 'Side c') }}</label>
                  <input type="number" id="tri-c" v-model="triC" placeholder="5" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="tri-error" @keydown.enter.prevent="calc('triangle')" />
                </div>
              </div>
              <div id="tri-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.triangle }}</div>
              <button type="button" class="btn-primary" @click="calc('triangle')">{{ L('احسب المثلث', 'Calculate triangle') }}</button>
            </div>

            <!-- المثلث القائم -->
            <div class="geo-panel" :class="{ active: activeShape === 'right' }" id="right-panel" role="tabpanel" :aria-label="L('حساب المثلث القائم', 'Right triangle calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('مثلث قائم الزاوية بساقيه a و b والوتر c', 'Right triangle with legs a and b and hypotenuse c')">
                  <polygon points="22,95 122,95 22,15" fill="none" stroke="#34d399" stroke-width="2" stroke-dasharray="6 3" opacity="0.7"/>
                  <polyline points="22,79 38,79 38,95" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity="0.6"/>
                  <line x1="22" y1="15" x2="122" y2="95" stroke="#f59e0b" stroke-width="1.5" opacity="0.75" stroke-dasharray="3 2"/>
                  <text x="72" y="108" fill="#34d399" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">b</text>
                  <text x="8" y="58" fill="#34d399" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
                  <text x="84" y="45" fill="#f59e0b" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">c</text>
                </svg>
              </div>
              <div class="formula-bar">c = √(a² + b²) | A = (a × b) ÷ 2</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="rt-a">{{ L('الساق a', 'Leg a') }}</label>
                  <input type="number" id="rt-a" v-model="rtA" placeholder="3" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="rt-error" @keydown.enter.prevent="calc('right')" />
                </div>
                <div class="input-group">
                  <label for="rt-b">{{ L('الساق b', 'Leg b') }}</label>
                  <input type="number" id="rt-b" v-model="rtB" placeholder="4" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="rt-error" @keydown.enter.prevent="calc('right')" />
                </div>
                <div class="input-group">
                  <label for="rt-c">{{ L('الوتر c', 'Hypotenuse c') }}</label>
                  <input type="number" id="rt-c" v-model="rtC" placeholder="5" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="rt-error" @keydown.enter.prevent="calc('right')" />
                </div>
              </div>
              <p class="rt-hint">{{ L('أدخل أي ضلعين وسيُحسب الضلع الثالث تلقائياً (فيثاغورس).', 'Enter any two sides and the third is computed automatically (Pythagoras).') }}</p>
              <div id="rt-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.right }}</div>
              <button type="button" class="btn-primary" @click="calc('right')">{{ L('احسب المثلث القائم', 'Calculate right triangle') }}</button>
            </div>

            <!-- الكرة -->
            <div class="geo-panel" :class="{ active: activeShape === 'sphere' }" id="sphere-panel" role="tabpanel" :aria-label="L('حساب الكرة', 'Sphere calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('رسم توضيحي للكرة ونصف قطرها', 'Sphere illustration showing its radius')">
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#a78bfa" stroke-width="2" opacity="0.65"/>
                  <ellipse cx="60" cy="60" rx="46" ry="14" fill="none" stroke="#a78bfa" stroke-width="1" stroke-dasharray="4 3" opacity="0.45"/>
                  <line x1="60" y1="60" x2="106" y2="60" stroke="#4f9cf9" stroke-width="1.5"/>
                  <circle cx="60" cy="60" r="2.5" fill="#4f9cf9"/>
                  <text x="83" y="55" fill="#4f9cf9" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r</text>
                </svg>
              </div>
              <div class="formula-bar">V = 4/3 × π × r³ | S = 4 × π × r²</div>
              <div class="input-group">
                <label for="sphere-r">{{ L('نصف القطر (r)', 'Radius (r)') }}</label>
                <input type="number" id="sphere-r" v-model="sphR" :placeholder="L('مثال: 3', 'e.g. 3')" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="sphere-error" @keydown.enter.prevent="calc('sphere')" />
                <div id="sphere-error" class="error-msg" role="alert" aria-live="polite">{{ errors.sphere }}</div>
              </div>
              <button type="button" class="btn-primary" @click="calc('sphere')">{{ L('احسب الكرة', 'Calculate sphere') }}</button>
            </div>

            <!-- المعين -->
            <div class="geo-panel" :class="{ active: activeShape === 'rhombus' }" id="rhombus-panel" role="tabpanel" :aria-label="L('حساب المعين', 'Rhombus calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('معين مع قطريه', 'Rhombus with its two diagonals')">
                  <polygon points="70,12 128,55 70,98 12,55" fill="none" stroke="#22d3ee" stroke-width="2" stroke-dasharray="6 3" opacity="0.7"/>
                  <line x1="12" y1="55" x2="128" y2="55" stroke="#a78bfa" stroke-width="1" opacity="0.45" stroke-dasharray="3 2"/>
                  <line x1="70" y1="12" x2="70" y2="98" stroke="#a78bfa" stroke-width="1" opacity="0.45" stroke-dasharray="3 2"/>
                  <text x="98" y="50" fill="#22d3ee" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">d₁</text>
                  <text x="80" y="34" fill="#22d3ee" font-size="9" font-family="Cairo,sans-serif">d₂</text>
                </svg>
              </div>
              <div class="formula-bar">A = (d₁ × d₂) ÷ 2 | P = 4 × a</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="rho-d1">{{ L('القطر الأول (d₁)', 'First diagonal (d₁)') }}</label>
                  <input type="number" id="rho-d1" v-model="rhoD1" placeholder="8" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="rho-error" @keydown.enter.prevent="calc('rhombus')" />
                </div>
                <div class="input-group">
                  <label for="rho-d2">{{ L('القطر الثاني (d₂)', 'Second diagonal (d₂)') }}</label>
                  <input type="number" id="rho-d2" v-model="rhoD2" placeholder="6" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="rho-error" @keydown.enter.prevent="calc('rhombus')" />
                </div>
              </div>
              <div id="rho-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.rhombus }}</div>
              <button type="button" class="btn-primary" @click="calc('rhombus')">{{ L('احسب المعين', 'Calculate rhombus') }}</button>
            </div>

            <!-- متوازي الأضلاع -->
            <div class="geo-panel" :class="{ active: activeShape === 'parallelogram' }" id="parallelogram-panel" role="tabpanel" :aria-label="L('حساب متوازي الأضلاع', 'Parallelogram calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('متوازي أضلاع بقاعدته وارتفاعه وضلعه', 'Parallelogram with its base, height and side')">
                  <polygon points="30,92 130,92 110,22 10,22" fill="none" stroke="#f472b6" stroke-width="2" stroke-dasharray="6 3" opacity="0.7"/>
                  <line x1="30" y1="92" x2="30" y2="22" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
                  <polyline points="30,78 44,78 44,92" fill="none" stroke="#a78bfa" stroke-width="1" opacity="0.5"/>
                  <text x="80" y="106" fill="#f472b6" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">b</text>
                  <text x="39" y="60" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
                  <text x="10" y="44" fill="#f472b6" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
                </svg>
              </div>
              <div class="formula-bar">A = b × h | P = 2 × (a + b)</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="par-b">{{ L('القاعدة (b)', 'Base (b)') }}</label>
                  <input type="number" id="par-b" v-model="parB" placeholder="10" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="par-error" @keydown.enter.prevent="calc('parallelogram')" />
                </div>
                <div class="input-group">
                  <label for="par-h">{{ L('الارتفاع (h)', 'Height (h)') }}</label>
                  <input type="number" id="par-h" v-model="parH" placeholder="4" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="par-error" @keydown.enter.prevent="calc('parallelogram')" />
                </div>
                <div class="input-group">
                  <label for="par-a">{{ L('الضلع الجانبي (a)', 'Side (a)') }}</label>
                  <input type="number" id="par-a" v-model="parA" placeholder="6" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="par-error" @keydown.enter.prevent="calc('parallelogram')" />
                </div>
              </div>
              <div id="par-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.parallelogram }}</div>
              <button type="button" class="btn-primary" @click="calc('parallelogram')">{{ L('احسب متوازي الأضلاع', 'Calculate parallelogram') }}</button>
            </div>

            <!-- شبه المنحرف -->
            <div class="geo-panel" :class="{ active: activeShape === 'trapezoid' }" id="trapezoid-panel" role="tabpanel" :aria-label="L('حساب شبه المنحرف', 'Trapezoid calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('شبه منحرف بقاعدتيه وارتفاعه وضلعيه', 'Trapezoid with its bases, height and legs')">
                  <polygon points="20,92 120,92 96,22 44,22" fill="none" stroke="#fbbf24" stroke-width="2" stroke-dasharray="6 3" opacity="0.7"/>
                  <line x1="44" y1="22" x2="44" y2="92" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
                  <text x="70" y="106" fill="#fbbf24" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
                  <text x="70" y="16" fill="#fbbf24" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">b</text>
                  <text x="37" y="60" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
                  <text x="22" y="58" fill="#fbbf24" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">c</text>
                  <text x="116" y="58" fill="#fbbf24" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">d</text>
                </svg>
              </div>
              <div class="formula-bar">A = ((a + b) ÷ 2) × h | m = (a + b) ÷ 2</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="trp-a">{{ L('القاعدة الكبرى (a)', 'Longer base (a)') }}</label>
                  <input type="number" id="trp-a" v-model="trpA" placeholder="10" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="trp-error" @keydown.enter.prevent="calc('trapezoid')" />
                </div>
                <div class="input-group">
                  <label for="trp-b">{{ L('القاعدة الصغرى (b)', 'Shorter base (b)') }}</label>
                  <input type="number" id="trp-b" v-model="trpB" placeholder="6" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="trp-error" @keydown.enter.prevent="calc('trapezoid')" />
                </div>
                <div class="input-group">
                  <label for="trp-h">{{ L('الارتفاع (h)', 'Height (h)') }}</label>
                  <input type="number" id="trp-h" v-model="trpH" placeholder="4" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="trp-error" @keydown.enter.prevent="calc('trapezoid')" />
                </div>
              </div>
              <div class="field-row">
                <div class="input-group">
                  <label for="trp-c">{{ L('الضلع c (اختياري)', 'Side c (optional)') }}</label>
                  <input type="number" id="trp-c" v-model="trpC" placeholder="5" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="trp-error" @keydown.enter.prevent="calc('trapezoid')" />
                </div>
                <div class="input-group">
                  <label for="trp-d">{{ L('الضلع d (اختياري)', 'Side d (optional)') }}</label>
                  <input type="number" id="trp-d" v-model="trpD" placeholder="5" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="trp-error" @keydown.enter.prevent="calc('trapezoid')" />
                </div>
              </div>
              <div id="trp-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.trapezoid }}</div>
              <button type="button" class="btn-primary" @click="calc('trapezoid')">{{ L('احسب شبه المنحرف', 'Calculate trapezoid') }}</button>
            </div>

            <!-- المضلع المنتظم -->
            <div class="geo-panel" :class="{ active: activeShape === 'polygon' }" id="polygon-panel" role="tabpanel" :aria-label="L('حساب المضلع المنتظم', 'Regular polygon calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('مضلع منتظم سداسي مع ضلعه وعاموده', 'Regular hexagon with its side and apothem')">
                  <polygon points="70,10 109,33 109,78 70,100 31,78 31,33" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-dasharray="6 3" opacity="0.7"/>
                  <line x1="70" y1="55" x2="109" y2="33" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
                  <line x1="70" y1="10" x2="70" y2="100" stroke="#a78bfa" stroke-width="1" opacity="0.3" stroke-dasharray="3 2"/>
                  <circle cx="70" cy="55" r="2.5" fill="#a78bfa"/>
                  <text x="120" y="58" fill="#2dd4bf" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">s</text>
                  <text x="99" y="40" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r</text>
                </svg>
              </div>
              <div class="formula-bar">A = (n × s²) ÷ (4 tan(π/n)) | P = n × s</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="poly-n">{{ L('عدد الأضلاع (n)', 'Number of sides (n)') }}</label>
                  <input type="number" id="poly-n" v-model="polyN" placeholder="6" min="3" step="1" inputmode="numeric" autocomplete="off" aria-describedby="poly-error" @keydown.enter.prevent="calc('polygon')" />
                </div>
                <div class="input-group">
                  <label for="poly-s">{{ L('طول الضلع (s)', 'Side length (s)') }}</label>
                  <input type="number" id="poly-s" v-model="polyS" placeholder="5" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="poly-error" @keydown.enter.prevent="calc('polygon')" />
                </div>
              </div>
              <div id="poly-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.polygon }}</div>
              <button type="button" class="btn-primary" @click="calc('polygon')">{{ L('احسب المضلع', 'Calculate polygon') }}</button>
            </div>

            <!-- القطع الناقص -->
            <div class="geo-panel" :class="{ active: activeShape === 'ellipse' }" id="ellipse-panel" role="tabpanel" :aria-label="L('حساب القطع الناقص', 'Ellipse calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('قطع ناقص مع نصف محوره الأكبر والأصغر', 'Ellipse with its semi-major and semi-minor axes')">
                  <ellipse cx="70" cy="55" rx="56" ry="34" fill="none" stroke="#60a5fa" stroke-width="2" opacity="0.7"/>
                  <line x1="14" y1="55" x2="126" y2="55" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
                  <line x1="70" y1="21" x2="70" y2="89" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
                  <circle cx="70" cy="55" r="2.5" fill="#60a5fa"/>
                  <text x="99" y="50" fill="#60a5fa" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
                  <text x="80" y="35" fill="#60a5fa" font-size="9" font-family="Cairo,sans-serif">b</text>
                </svg>
              </div>
              <div class="formula-bar">A = π × a × b | P ≈ π[3(a+b) − √((3a+b)(a+3b))]</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="ell-a">{{ L('نصف المحور الأكبر (a)', 'Semi-major axis (a)') }}</label>
                  <input type="number" id="ell-a" v-model="ellA" placeholder="8" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="ell-error" @keydown.enter.prevent="calc('ellipse')" />
                </div>
                <div class="input-group">
                  <label for="ell-b">{{ L('نصف المحور الأصغر (b)', 'Semi-minor axis (b)') }}</label>
                  <input type="number" id="ell-b" v-model="ellB" placeholder="5" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="ell-error" @keydown.enter.prevent="calc('ellipse')" />
                </div>
              </div>
              <div id="ell-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.ellipse }}</div>
              <button type="button" class="btn-primary" @click="calc('ellipse')">{{ L('احسب القطع الناقص', 'Calculate ellipse') }}</button>
            </div>

            <!-- القطاع الدائري -->
            <div class="geo-panel" :class="{ active: activeShape === 'sector' }" id="sector-panel" role="tabpanel" :aria-label="L('حساب القطاع الدائري', 'Sector calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 110" width="140" height="110" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('قطاع دائري بزاويته ونصف قطره', 'Circular sector with its angle and radius')">
                  <path d="M60,90 L60,30 A60,60 0 0,1 111.96,60 Z" fill="none" stroke="#fb7185" stroke-width="2" stroke-dasharray="6 3" opacity="0.75"/>
                  <circle cx="60" cy="90" r="2.5" fill="#fb7185"/>
                  <path d="M60,72 A18,18 0 0,1 75.6,81 Z" fill="none" stroke="#a78bfa" stroke-width="1" opacity="0.6"/>
                  <text x="53" y="58" fill="#fb7185" font-size="9" font-family="Cairo,sans-serif" text-anchor="end">r</text>
                  <text x="72" y="84" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif">θ</text>
                </svg>
              </div>
              <div class="formula-bar">A = (θ ÷ 360) × π × r² | L = (θ ÷ 360) × 2 × π × r</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="sec-r">{{ L('نصف القطر (r)', 'Radius (r)') }}</label>
                  <input type="number" id="sec-r" v-model="secR" placeholder="6" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="sec-error" @keydown.enter.prevent="calc('sector')" />
                </div>
                <div class="input-group">
                  <label for="sec-angle">{{ L('الزاوية (بالدرجات)', 'Angle (degrees)') }}</label>
                  <input type="number" id="sec-angle" v-model="secAngle" placeholder="90" min="0" max="360" step="any" inputmode="decimal" autocomplete="off" aria-describedby="sec-error" @keydown.enter.prevent="calc('sector')" />
                </div>
              </div>
              <div id="sec-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.sector }}</div>
              <button type="button" class="btn-primary" @click="calc('sector')">{{ L('احسب القطاع', 'Calculate sector') }}</button>
            </div>

            <!-- المكعب -->
            <div class="geo-panel" :class="{ active: activeShape === 'cube' }" id="cube-panel" role="tabpanel" :aria-label="L('حساب المكعب', 'Cube calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 130 122" width="130" height="122" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('مكعب مع ضلعه', 'Cube with its side')">
                  <polygon points="30,45 90,45 90,105 30,105" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.65"/>
                  <polygon points="30,45 55,25 115,25 90,45" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.45"/>
                  <polygon points="90,45 115,25 115,85 90,105" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.45"/>
                  <text x="60" y="119" fill="#38bdf8" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">a</text>
                </svg>
              </div>
              <div class="formula-bar">V = a³ | S = 6 × a² | D = a × √3</div>
              <div class="input-group">
                <label for="cube-a">{{ L('طول الضلع (a)', 'Side length (a)') }}</label>
                <input type="number" id="cube-a" v-model="cubeA" placeholder="3" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="cube-error" @keydown.enter.prevent="calc('cube')" />
                <div id="cube-error" class="error-msg" role="alert" aria-live="polite">{{ errors.cube }}</div>
              </div>
              <button type="button" class="btn-primary" @click="calc('cube')">{{ L('احسب المكعب', 'Calculate cube') }}</button>
            </div>

            <!-- متوازي المستطيلات -->
            <div class="geo-panel" :class="{ active: activeShape === 'cuboid' }" id="cuboid-panel" role="tabpanel" :aria-label="L('حساب متوازي المستطيلات', 'Cuboid calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 125" width="140" height="125" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('متوازي مستطيلات بأبعاده الثلاثة', 'Cuboid with its three dimensions')">
                  <polygon points="25,55 95,55 95,110 25,110" fill="none" stroke="#818cf8" stroke-width="2" opacity="0.65"/>
                  <polygon points="25,55 55,30 125,30 95,55" fill="none" stroke="#818cf8" stroke-width="2" opacity="0.45"/>
                  <polygon points="95,55 125,30 125,85 95,110" fill="none" stroke="#818cf8" stroke-width="2" opacity="0.45"/>
                  <text x="60" y="122" fill="#818cf8" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">l</text>
                  <text x="112" y="85" fill="#818cf8" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
                  <text x="40" y="41" fill="#818cf8" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">w</text>
                </svg>
              </div>
              <div class="formula-bar">V = l × w × h | S = 2(lw + lh + wh) | D = √(l² + w² + h²)</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="cub-l">{{ L('الطول (l)', 'Length (l)') }}</label>
                  <input type="number" id="cub-l" v-model="cubL" placeholder="8" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="cub-error" @keydown.enter.prevent="calc('cuboid')" />
                </div>
                <div class="input-group">
                  <label for="cub-w">{{ L('العرض (w)', 'Width (w)') }}</label>
                  <input type="number" id="cub-w" v-model="cubW" placeholder="5" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="cub-error" @keydown.enter.prevent="calc('cuboid')" />
                </div>
                <div class="input-group">
                  <label for="cub-h">{{ L('الارتفاع (h)', 'Height (h)') }}</label>
                  <input type="number" id="cub-h" v-model="cubH" placeholder="4" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="cub-error" @keydown.enter.prevent="calc('cuboid')" />
                </div>
              </div>
              <div id="cub-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.cuboid }}</div>
              <button type="button" class="btn-primary" @click="calc('cuboid')">{{ L('احسب متوازي المستطيلات', 'Calculate cuboid') }}</button>
            </div>

            <!-- الأسطوانة -->
            <div class="geo-panel" :class="{ active: activeShape === 'cylinder' }" id="cylinder-panel" role="tabpanel" :aria-label="L('حساب الأسطوانة', 'Cylinder calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 120" width="140" height="120" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('أسطوانة بنصف قطرها وارتفاعها', 'Cylinder with its radius and height')">
                  <ellipse cx="70" cy="28" rx="44" ry="14" fill="none" stroke="#c084fc" stroke-width="2" opacity="0.7"/>
                  <path d="M26,28 L26,92 A44,14 0 0,0 114,92 L114,28" fill="none" stroke="#c084fc" stroke-width="2" opacity="0.7"/>
                  <line x1="70" y1="28" x2="114" y2="28" stroke="#a78bfa" stroke-width="1" opacity="0.55" stroke-dasharray="3 2"/>
                  <circle cx="70" cy="28" r="2.5" fill="#c084fc"/>
                  <text x="93" y="24" fill="#c084fc" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r</text>
                  <text x="17" y="63" fill="#c084fc" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">h</text>
                </svg>
              </div>
              <div class="formula-bar">V = π × r² × h | L = 2 × π × r × h | S = 2 × π × r × (h + r)</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="cyl-r">{{ L('نصف القطر (r)', 'Radius (r)') }}</label>
                  <input type="number" id="cyl-r" v-model="cylR" placeholder="3" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="cyl-error" @keydown.enter.prevent="calc('cylinder')" />
                </div>
                <div class="input-group">
                  <label for="cyl-h">{{ L('الارتفاع (h)', 'Height (h)') }}</label>
                  <input type="number" id="cyl-h" v-model="cylH" placeholder="7" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="cyl-error" @keydown.enter.prevent="calc('cylinder')" />
                </div>
              </div>
              <div id="cyl-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.cylinder }}</div>
              <button type="button" class="btn-primary" @click="calc('cylinder')">{{ L('احسب الأسطوانة', 'Calculate cylinder') }}</button>
            </div>

            <!-- المخروط -->
            <div class="geo-panel" :class="{ active: activeShape === 'cone' }" id="cone-panel" role="tabpanel" :aria-label="L('حساب المخروط', 'Cone calculator')">
              <div class="shape-figure">
                <svg viewBox="0 0 140 122" width="140" height="122" xmlns="http://www.w3.org/2000/svg" role="img" :aria-label="L('مخروط بنصف قطر قاعدته وارتفاعه وارتفاعه الجانبي', 'Cone with its base radius, height and slant height')">
                  <ellipse cx="70" cy="95" rx="46" ry="14" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.5"/>
                  <path d="M70,15 L24,95 A46,14 0 0,0 116,95 Z" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.75"/>
                  <line x1="70" y1="15" x2="70" y2="95" stroke="#a78bfa" stroke-width="1" opacity="0.55" stroke-dasharray="3 2"/>
                  <line x1="70" y1="95" x2="116" y2="95" stroke="#a78bfa" stroke-width="1" opacity="0.5" stroke-dasharray="3 2"/>
                  <circle cx="70" cy="95" r="2.5" fill="#f59e0b"/>
                  <text x="63" y="58" fill="#a78bfa" font-size="9" font-family="Cairo,sans-serif" text-anchor="end">h</text>
                  <text x="95" y="110" fill="#f59e0b" font-size="9" font-family="Cairo,sans-serif" text-anchor="middle">r</text>
                  <text x="38" y="52" fill="#f59e0b" font-size="9" font-family="Cairo,sans-serif" text-anchor="end">l</text>
                </svg>
              </div>
              <div class="formula-bar">V = (1/3) × π × r² × h | l = √(r² + h²) | S = π × r × (l + r)</div>
              <div class="field-row">
                <div class="input-group">
                  <label for="cone-r">{{ L('نصف القطر (r)', 'Radius (r)') }}</label>
                  <input type="number" id="cone-r" v-model="coneR" placeholder="3" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="cone-error" @keydown.enter.prevent="calc('cone')" />
                </div>
                <div class="input-group">
                  <label for="cone-h">{{ L('الارتفاع (h)', 'Height (h)') }}</label>
                  <input type="number" id="cone-h" v-model="coneH" placeholder="4" min="0" step="any" inputmode="decimal" autocomplete="off" aria-describedby="cone-error" @keydown.enter.prevent="calc('cone')" />
                </div>
              </div>
              <div id="cone-error" class="error-msg" role="alert" aria-live="polite" style="margin:-0.5rem 0 0.75rem;">{{ errors.cone }}</div>
              <button type="button" class="btn-primary" @click="calc('cone')">{{ L('احسب المخروط', 'Calculate cone') }}</button>
            </div>

          </div>
        </section>
      </div>

      <!-- ════ النتائج ════ -->
      <div class="calc-side">
        <section class="ops" aria-labelledby="geo-res-h">
          <div class="panel-bar"><b id="geo-res-h">{{ L('النتائج', 'Results') }}</b><span>{{ L('مع المعادلة', 'With each formula') }}</span></div>
          <div class="panel-body">
            <div
              v-for="sh in shapes"
              :key="sh.id"
              class="geo-res"
              :class="{ active: activeShape === sh.id }"
              :data-res-for="sh.id + '-panel'"
            >
              <template v-if="results[sh.id].length">
                <div class="geo-results-grid" role="status" aria-live="polite">
                  <div v-for="(it, i) in results[sh.id]" :key="i" class="geo-result-item">
                    <div class="geo-label">{{ it.label }}</div>
                    <div class="geo-val" :class="{ 'is-text': it.isText }">
                      {{ disp(it) }}<small v-if="it.unit">{{ it.unit }}</small>
                    </div>
                    <div v-if="it.formula" class="geo-formula">{{ it.formula }}</div>
                    <button
                      v-if="!it.isText"
                      type="button"
                      class="geo-round"
                      :aria-pressed="String(!!it.rounded)"
                      @click="toggleRound(it)"
                    >{{ it.rounded ? L('↩ إرجاع الكسور', '↩ Show decimals') : L('≈ تقريب', '≈ Round') }}</button>
                  </div>
                </div>
              </template>
              <p v-else class="res-empty">{{ t('geo.empty.' + sh.id) }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>

  <SavedHistory tool="geometry" />
</template>

<style scoped>
/* النتائج كثيرة (خصوصاً المثلث) — فعّل تمريراً عمودياً داخل كل لوحة */
.calc-layout--ops .ops > .panel-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}

/* الأرقام الطويلة لا تخرج من المربّع */
.geo-val {
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.3;
}

/* زر التقريب تحت كل مربّع */
.geo-round {
  margin-top: 0.6rem;
  min-height: 30px;
  padding: 0.15rem 0.7rem;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color var(--transition), color var(--transition), background var(--transition);
}
.geo-round:hover { border-color: var(--line); color: var(--text-primary); background: var(--hl-soft); }
.geo-round[aria-pressed="true"] { background: var(--hl); color: #0d1633; border-color: var(--line); }

/* تلميح المثلث القائم */
.rt-hint { font-size: 0.8rem; color: var(--text-muted); margin: -0.5rem 0 0.75rem; line-height: 1.7; }
</style>