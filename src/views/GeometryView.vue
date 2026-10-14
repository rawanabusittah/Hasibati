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

const errors = reactive({ circle: '', square: '', rect: '', triangle: '', right: '', sphere: '' })
const results = reactive({ circle: [], square: [], rect: [], triangle: [], right: [], sphere: [] })

const shapes = [
  { id: 'circle', label: L('الدائرة', 'Circle'), icon: '⭕' },
  { id: 'square', label: L('المربع', 'Square'), icon: '🟦' },
  { id: 'rect', label: L('المستطيل', 'Rectangle'), icon: '▬' },
  { id: 'triangle', label: L('المثلث', 'Triangle'), icon: '🔺' },
  { id: 'right', label: L('المثلث القائم', 'Right triangle'), icon: '📐' },
  { id: 'sphere', label: L('الكرة', 'Sphere'), icon: '🔵' }
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
      >{{ sh.icon }} <span>{{ sh.label }}</span></button>
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
              <p v-else class="res-empty">{{ L(
                sh.id === 'circle' ? 'اكتب نصف القطر وستظهر النتائج هنا.' :
                sh.id === 'square' ? 'اكتب طول الضلع وستظهر النتائج هنا.' :
                sh.id === 'rect' ? 'اكتب العرض والارتفاع وستظهر النتائج هنا.' :
                sh.id === 'triangle' ? 'اكتب الأضلاع الثلاثة وستظهر النتائج هنا.' :
                sh.id === 'right' ? 'اكتب ضلعين (ساقين أو وتراً وساقاً) وستظهر النتائج هنا.' :
                'اكتب نصف القطر وستظهر النتائج هنا.',
                sh.id === 'circle' ? 'Type the radius and the results appear here.' :
                sh.id === 'square' ? 'Type the side length and the results appear here.' :
                sh.id === 'rect' ? 'Type the width and height and the results appear here.' :
                sh.id === 'triangle' ? 'Type the three sides and the results appear here.' :
                sh.id === 'right' ? 'Type any two sides (two legs, or the hypotenuse and a leg) and the results appear here.' :
                'Type the radius and the results appear here.'
              ) }}</p>
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