<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { MathEngine } from '../lib/core'
import { solveSteps } from '../lib/steps'
import { solveInequality, isInequality } from '../lib/ineq'
import { evaluateComplex, polarOf, solveEquation, fmt as cxFmt, cz, deg360, degSigned } from '../lib/complex'
import { useI18n } from '../composables/i18n'
import { saveTool } from '../services/cloud'
import SavedHistory from '../components/SavedHistory.vue'

const { L, t } = useI18n()
const ME = MathEngine

const LS_HIST = 'hp_calc_history'
const LS_ANG = 'hp_angle'

// v: النص المدرج · n: الاسم [ع/إ] · s: الصيغة · d: الوصف [ع/إ] · x: مثال
const OPS = {
  arith: [
    { v: '+',    n: [L('جمع', 'Add')],            s: 'a + b', d: [L('يجمع عددين أو أكثر.', 'Adds two or more numbers.')], x: '12+8' },
    { v: '-',    n: [L('طرح', 'Subtract')],       s: 'a − b', d: [L('يطرح الثاني من الأول.', 'Subtracts the second from the first.')], x: '50-18' },
    { v: '×',    n: [L('ضرب', 'Multiply')],       s: 'a × b', d: [L('يضرب عددين أو أكثر.', 'Multiplies numbers.')], x: '7×6' },
    { v: '÷',    n: [L('قسمة', 'Divide')],        s: 'a ÷ b', d: [L('يقسم الأول على الثاني.', 'Divides the first by the second.')], x: '84÷4' },
    { v: '%',    n: [L('نسبة مئوية', 'Percent')], s: 'a + b%', d: [L('تضيف 10% من 200 إلى 200 = 220.', 'Adds 10% of 200 to 200 = 220.')], x: '200+10%' },
    { v: 'mod(', n: [L('باقي القسمة', 'Remainder')], s: 'mod(a, b)', d: [L('باقي قسمة a ÷ b.', 'Remainder of a ÷ b.')], x: 'mod(17,5)' },
    { v: 'abs(', n: [L('القيمة المطلقة', 'Absolute value')], s: 'abs(a)', d: [L('البعد عن الصفر دائماً موجب.', 'Always non-negative distance from zero.')], x: 'abs(-9)' },
    { v: 'round(', n: [L('تقريب', 'Round')], s: 'round(a)', d: [L('يقرّب لأقرب عدد صحيح.', 'Rounds to the nearest integer.')], x: 'round(3.6)' },
    { v: 'floor(', n: [L('تقريب للأدنى', 'Floor')], s: 'floor(a)', d: [L('أكبر عدد صحيح ≤ a.', 'Largest integer ≤ a.')], x: 'floor(3.9)' },
    { v: 'ceil(', n: [L('تقريب للأعلى', 'Ceil')], s: 'ceil(a)', d: [L('أصغر عدد صحيح ≥ a.', 'Smallest integer ≥ a.')], x: 'ceil(3.1)' }
  ],
  power: [
    { v: '^',     n: [L('رفع لأس', 'Power')],         s: 'x^y',     d: [L('يرفع الأساس إلى الأس.', 'Raises the base to an exponent.')], x: '2^10' },
    { v: '√',     n: [L('جذر تربيعي', 'Square root')], s: '√x',      d: [L('الجذر التربيعي الموجب.', 'The positive square root.')], x: '√49' },
    { v: 'cbrt(', n: [L('جذر تكعيبي', 'Cube root')],   s: 'cbrt(x)', d: [L('الجذر التكعيبي لأي عدد.', 'Cube root of any number.')], x: 'cbrt(27)' },
    { v: 'root(', n: [L('جذر عام', 'nth root')],       s: 'root(x, n)', d: [L('الجذر النوني للعدد.', 'The n-th root of a number.')], x: 'root(8,3)' },
    { v: 'exp(',  n: [L('أُسّ طبيعي', 'Exponential')], s: 'exp(x)', d: [L('e مرفوع لأس x.', 'e raised to the power x.')], x: 'exp(1)' }
  ],
  trig: [
    { v: 'sin(',  n: [L('جيب', 'Sine')],            s: 'sin(x)', d: [L('جيب الزاوية (بالدرجات أو الراديان حسب الوضع).', 'Sine of the angle (degrees or radians).')], x: 'sin(30)' },
    { v: 'cos(',  n: [L('جيب تمام', 'Cosine')],     s: 'cos(x)', d: [L('جيب تمام الزاوية.', 'Cosine of the angle.')], x: 'cos(60)' },
    { v: 'tan(',  n: [L('ظل', 'Tangent')],          s: 'tan(x)', d: [L('ظل الزاوية.', 'Tangent of the angle.')], x: 'tan(45)' },
    { v: 'asin(', n: [L('قوس الجيب', 'Arcsine')],   s: 'asin(x)', d: [L('الزاوية التي جيبها x.', 'The angle whose sine is x.')], x: 'asin(0.5)' },
    { v: 'acos(', n: [L('قوس جيب التمام', 'Arccosine')], s: 'acos(x)', d: [L('الزاوية التي جيب تمامها x.', 'The angle whose cosine is x.')], x: 'acos(0.5)' },
    { v: 'atan(', n: [L('قوس الظل', 'Arctangent')], s: 'atan(x)', d: [L('الزاوية التي ظلها x.', 'The angle whose tangent is x.')], x: 'atan(1)' }
  ],
  log: [
    { v: 'ln(',   n: [L('لوغاريتم طبيعي', 'Natural log')], s: 'ln(x)',    d: [L('اللوغاريتم للأساس e.', 'Logarithm base e.')], x: 'ln(e)' },
    { v: 'log(',  n: [L('لوغاريتم عشري', 'Common log')],   s: 'log(x)',   d: [L('اللوغاريتم للأساس 10.', 'Logarithm base 10.')], x: 'log(100)' },
    { v: 'log2(', n: [L('لوغاريتم ثنائي', 'Binary log')],  s: 'log2(x)',  d: [L('اللوغاريتم للأساس 2.', 'Logarithm base 2.')], x: 'log2(8)' },
    { v: 'logb(', n: [L('لوغاريتم بأساس اختياري', 'Log base b')], s: 'logb(x, b)', d: [L('اللوغاريتم للأساس b.', 'Logarithm to a chosen base.')], x: 'logb(8,2)' }
  ],
  ineq: [
    { v: '≤', n: [L('متراجحة خطية', 'Linear inequality')], s: 'ax + b ≤ c', d: [L('تحلّ متراجحة خطية بمتغير واحد وتعرض الحل بخطوات (تُقلب المتراجحة عند القسمة على عدد سالب).', 'Solves a one-variable linear inequality and shows the solution with steps (the sign flips when dividing by a negative number).')], x: '3-2(1-x)≤2' },
    { v: '<', n: [L('متراجحة صارمة', 'Strict inequality')], s: 'ax + b < c', d: [L('متراجحة بمتغير واحد برمز أصغر من أو أكبر من.', 'One-variable inequality with < or >.')], x: '-x<-x+7(x-2)' }
  ],
  complex: [
    { v: 'i', m: 'eval', n: [L('تقييم تعبير مركب', 'Evaluate complex')], s: 'a + bi', d: [L('يحسب أي تعبير بأعداد مركبة — جمع وطرح وضرب وقسمة وأسس، مع دوال re و im و conj و |z|.', 'Computes any complex-number expression — add, subtract, multiply, divide and powers, plus the functions re, im, conj and |z|.')], x: '(3+2i)+(5-i)' },
    { v: 'i', m: 'polar', n: [L('تحويل إلى القطبية', 'Convert to polar')], s: 'z = r(cosθ + i sinθ)', d: [L('يعرض العدد المركب بالصورة القطبية r(cosθ + i sinθ) وصيغة r ∠ θ° مع الزاوية بالدرجات والراديان.', 'Shows the complex number in polar form r(cosθ + i sinθ) and r ∠ θ°, with the angle in degrees and radians.')], x: '1+i' },
    { v: 'x^2+1=0', m: 'solve', n: [L('كل الحلول المركبة', 'Find all complex solutions')], s: 'ax² + bx + c = 0', d: [L('يحل معادلة من الدرجة الثانية أو من الصيغة xⁿ = k (حتى n = 4) ويوجد جميع الحلول المركبة.', 'Solves a quadratic equation or an xⁿ = k equation (up to n = 4) and finds all complex solutions.')], x: 'x^2-2x+5=0' },
    { v: 'i', m: 'degree', n: [L('الزاوية بالدرجات', 'Find the degree (argument)')], s: 'θ = arg(z)', d: [L('يحسب زاوية العدد المركب (الوسيط θ) بالدرجات مع المقياس.', 'Computes the angle (argument θ) of a complex number in degrees, with the modulus.')], x: '3+4i' },
    { v: 'conj(', m: 'eval', n: [L('المرافق', 'Conjugate')], s: 'conj(a+bi)', d: [L('يقلب إشارة الجزء التخيلي: المرافق لـ a + bi هو a − bi.', 'Flips the sign of the imaginary part: the conjugate of a + bi is a − bi.')], x: 'conj(3+4i)' },
    { v: '|', m: 'eval', n: [L('المقياس', 'Modulus')], s: '|a+bi|', d: [L('طول المتجه √(a²+b²) — دائماً عدد حقيقي غير سالب.', 'The vector length √(a²+b²) — always a non-negative real number.')], x: '|3+4i|' },
    { v: 're(', m: 'eval', n: [L('الجزء الحقيقي', 'Real part')], s: 're(z)', d: [L('يعزل الجزء الحقيقي من العدد المركب.', 'Extracts the real part of the complex number.')], x: 're(3+4i)' },
    { v: 'im(', m: 'eval', n: [L('الجزء التخيلي', 'Imaginary part')], s: 'im(z)', d: [L('يعزل الجزء التخيلي.', 'Extracts the imaginary part.')], x: 'im(3+4i)' },
    { v: 'i', m: 'eval', n: [L('قوى الوحدة التخيلية', 'Powers of i')], s: 'iⁿ', d: [L('يحسب أسس الوحدة التخيلية: i² = −1 ، i³ = −i ، i⁴ = 1.', 'Computes powers of the imaginary unit: i² = −1, i³ = −i, i⁴ = 1.')], x: 'i^10' }
  ],
  calculus: [
    { v: 'diff(',  n: [L('مشتقة أولى', 'First derivative')],  s: 'diff(f, x0)',     d: [L('مشتقة الدالة عند نقطة (عددية).', 'Numerical derivative at a point.')], x: 'diff(x^2,3)' },
    { v: 'diff2(', n: [L('مشتقة ثانية', 'Second derivative')], s: 'diff2(f, x0)',    d: [L('المشتقة الثانية عند نقطة.', 'Second derivative at a point.')], x: 'diff2(x^3,2)' },
    { v: 'int(',   n: [L('تكامل محدد', 'Definite integral')],  s: 'int(f, a, b)',   d: [L('تكامل الدالة من a إلى b.', 'Integral from a to b.')], x: 'int(x^2,0,3)' },
    { v: 'sum(',   n: [L('مجموع Σ', 'Sum')],                   s: 'sum(f, a, b)',   d: [L('مجموع الدالة على الأعداد الصحيحة.', 'Sum over integers.')], x: 'sum(x^2,1,5)' },
    { v: 'prod(',  n: [L('جداء Π', 'Product')],                s: 'prod(f, a, b)',  d: [L('جداء الدالة على الأعداد الصحيحة.', 'Product over integers.')], x: 'prod(x,1,5)' }
  ],
  combo: [
    { v: 'nCr(', n: [L('توافيق', 'Combination')],           s: 'nCr(n, r)', d: [L('عدد طرق اختيار r من n.', 'Ways to choose r from n.')], x: 'nCr(5,2)' },
    { v: 'nPr(', n: [L('تباديل', 'Permutation')],           s: 'nPr(n, r)', d: [L('عدد التباديل المرتبة.', 'Ordered arrangements.')], x: 'nPr(5,2)' },
    { v: 'gcd(', n: [L('قاسم مشترك أكبر', 'Greatest common divisor')], s: 'gcd(a, b)', d: [L('أكبر عدد يقسم العددين.', 'Largest number dividing both.')], x: 'gcd(12,18)' },
    { v: 'lcm(', n: [L('مضاعف مشترك أصغر', 'Least common multiple')],  s: 'lcm(a, b)', d: [L('أصغر مضاعف مشترك.', 'Smallest common multiple.')], x: 'lcm(4,6)' },
    { v: 'avg(', n: [L('المتوسط (Mean)', 'Mean')],          s: 'avg(a, b, …)', d: [L('المتوسط الحسابي = مجموع الأعداد ÷ عددها.', 'Arithmetic mean = sum of the numbers ÷ their count.')], x: 'avg(2,4,6)' },
    { v: 'max(', n: [L('القيمة العظمى (Maximum)', 'Maximum')], s: 'max(a, b, …)', d: [L('أكبر قيمة بين الأعداد.', 'Largest value.')], x: 'max(3,9,5)' },
    { v: 'min(', n: [L('القيمة الصغرى (Minimum)', 'Minimum')], s: 'min(a, b, …)', d: [L('أصغر قيمة بين الأعداد.', 'Smallest value.')], x: 'min(3,9,5)' },
    { v: '!',    n: [L('مضروب', 'Factorial')],             s: 'n!',          d: [L('جداء الأعداد من 1 إلى n.', 'Product of 1..n.')], x: '5!' },
    { v: 'med(', n: [L('الوسيط', 'Median')],                s: 'med(a, b, …)', d: [L('القيمة الوسطى بعد ترتيب البيانات (متوسط القيمتين الوسطيتين إذا كان العدد زوجياً).', 'The middle value after sorting (average of the two middle values when even).')], x: 'med(4,8,6)' },
    { v: 'mode(', n: [L('المنوال', 'Mode')],                s: 'mode(a, b, …)', d: [L('القيمة الأكثر تكراراً بين الأعداد.', 'The most frequent value in the data.')], x: 'mode(2,3,3,4)' },
    { v: 'std(', n: [L('الانحراف المعياري σ', 'Standard deviation (σ)')], s: 'std(a, b, …)', d: [L('الانحراف المعياري للمجتمع — القسمة على n.', 'Population standard deviation — divide by n.')], x: 'std(2,4,6)' },
    { v: 'sstd(', n: [L('انحراف العينة s', 'Sample std deviation (s)')], s: 'sstd(a, b, …)', d: [L('الانحراف المعياري للعينة — القسمة على n−1.', 'Sample standard deviation — divide by n−1.')], x: 'sstd(2,4,6)' },
    { v: 'var(', n: [L('التباين σ²', 'Variance (σ²)')],     s: 'var(a, b, …)', d: [L('تباين المجتمع = مربع الانحراف المعياري.', 'Population variance = standard deviation squared.')], x: 'var(2,4,6)' },
    { v: 'q1(', n: [L('الربيع الأدنى Q1', 'Lower quartile Q1')], s: 'q1(a, b, …)', d: [L('وسيط النصف الأدنى من البيانات.', 'Median of the lower half of the data.')], x: 'q1(1,2,3,4,5)' },
    { v: 'q3(', n: [L('الربيع الأعلى Q3', 'Upper quartile Q3')], s: 'q3(a, b, …)', d: [L('وسيط النصف الأعلى من البيانات.', 'Median of the upper half of the data.')], x: 'q3(1,2,3,4,5)' },
    { v: 'iqr(', n: [L('المدى الربيعي IQR (H-Spread)', 'IQR (H-Spread)')], s: 'iqr(a, b, …)', d: [L('H-Spread = Q3 − Q1 — مقياس انتشار البيانات.', 'H-Spread = Q3 − Q1 — a measure of spread.')], x: 'iqr(1,2,3,4,5)' },
    { v: 'mhinge(', n: [L('منتصف المفصلات (Midhinge)', 'Midhinge')], s: 'mhinge(a, b, …)', d: [L('منتصف المسافة بين Q1 و Q3: (Q1 + Q3) ÷ 2.', 'Halfway between Q1 and Q3: (Q1 + Q3) ÷ 2.')], x: 'mhinge(1,2,3,4,5)' },
    { v: 'midrange(', n: [L('المدى الأوسط (Midrange)', 'Midrange')], s: 'midrange(a, b, …)', d: [L('نقطة المنتصف بين العظمى والصغرى.', 'The midpoint between the maximum and minimum.')], x: 'midrange(1,2,3,4,5)' },
    { v: 'range(', n: [L('المدى', 'Range')],                 s: 'range(a, b, …)', d: [L('الفرق بين القيمة العظمى والصغرى.', 'Difference between the maximum and minimum.')], x: 'range(1,2,3,4,5)' },
    { v: 'a10(', n: [L('الحد العاشر', 'Find the 10th term')], s: 'a10(a₁, d)', d: [L('الحد العاشر من متتالية حسابية: a₁ + 9d.', '10th term of an arithmetic sequence: a₁ + 9d.')], x: 'a10(3,2)' },
    { v: 'nth(', n: [L('الحد النوني', 'nth term')],          s: 'nth(a₁, d, n)', d: [L('الحد النوني من متتالية حسابية: a₁ + (n−1)d.', 'nth term of an arithmetic sequence: a₁ + (n−1)d.')], x: 'nth(3,2,10)' },
    { v: 'gmean(', n: [L('المتوسط الهندسي', 'Geometric mean')], s: 'gmean(a, b, …)', d: [L('الجذر النوني لجداء قيم موجبة.', 'The n-th root of the product of positive values.')], x: 'gmean(2,8)' },
    { v: 'hmean(', n: [L('المتوسط التوافقي', 'Harmonic mean')], s: 'hmean(a, b, …)', d: [L('مقلوب متوسط المقلوبات لقيم موجبة.', 'Reciprocal of the average of reciprocals (positive values).')], x: 'hmean(2,6)' }
  ]
}

const CATS = ['arith', 'power', 'trig', 'log', 'ineq', 'complex', 'calculus', 'combo', 'history']
const CAT_LABELS = {
  arith: ['➖', L('حسابية', 'Arithmetic')],
  power: ['√', L('أسس وجذور', 'Powers & roots')],
  trig: ['📐', L('مثلثات', 'Trigonometry')],
  log: ['ln', L('لوغاريتمات', 'Logarithms')],
  ineq: ['≤', L('متراجحات', 'Inequalities')],
  complex: ['ℂ', L('أعداد مركبة', 'Complex')],
  calculus: ['∫', L('تفاضل وتكامل', 'Calculus')],
  combo: ['🎲', L('إحصاء وتوافيق', 'Stats & combinatorics')],
  history: ['🕘', L('السجل', 'History')]
}

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

function fmt(n) {
  if (!Number.isFinite(n)) return String(n)
  if (n === 0) return '0'
  const a = Math.abs(n)
  if (a >= 1e15 || a < 1e-9) return n.toExponential(8).replace(/\.?0+e/, 'e').replace('e+', 'e')
  return String(Number(n.toPrecision(12)))
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

const LAMBDA_LABEL = { diff: 'ldiff', diff2: 'ldiff2', int: 'lint', sum: 'lsum', prod: 'lprod' }
function stepKindLabel(s) {
  if (s.kind === 'calc') return t('calc.steps.' + (LAMBDA_LABEL[s.name] || 'kcalc'), { n: s.name })
  if (s.kind === 'fn') return t('calc.steps.kfn', { n: s.name })
  return t('calc.steps.k' + s.kind)
}

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

function cxFinalText(cx) {
  if (cx.mode === 'solve') {
    if (cx.special === 'all') return t('calc.ineq.all')
    if (cx.special === 'none') return t('calc.ineq.none')
    return cx.roots.map(cxFmt).join(' ، ')
  }
  if (cx.mode === 'polar') {
    return cx.zStr + ' = ' + cx.p.r + '(cos ' + cx.p.deg360 + '° + i sin ' + cx.p.deg360 + '°)  =  ' + cx.p.r + ' ∠ ' + cx.p.degP + '°'
  }
  if (cx.mode === 'degree') return cx.zStr + '  →  θ = ' + cx.p.degP + '°'
  return cx.zStr
}

// ── العمليات القابلة للطي ──
function togglePanel(key) {
  const s = new Set(openPanels.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  openPanels.value = s
}
function isOpen(key) { return openPanels.value.has(key) }

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
const pad = [
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
]

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
      <!-- ════ العمليات ════ -->
      <div class="ops-col">
        <section class="ops" aria-labelledby="ops-h">
          <div class="ops-tabs" role="tablist" :aria-label="L('أقسام العمليات', 'Operation categories')">
            <button
              v-for="cat in CATS"
              :key="cat"
              type="button"
              class="ops-tab"
              :class="{ active: activeCat === cat }"
              role="tab"
              :aria-selected="String(activeCat === cat)"
              @click="activeCat = cat"
            >
              <span aria-hidden="true">{{ CAT_LABELS[cat][0] }}</span>
              <span>{{ CAT_LABELS[cat][1] }}</span>
            </button>
          </div>

          <div class="ops-body" role="tabpanel" :aria-label="L('العمليات المتاحة', 'Available operations')">
            <div
              v-for="cat in visibleCats"
              :key="cat"
              class="ops-list"
              :data-cat="cat"
              :hidden="activeCat !== cat"
            >
              <div
                v-for="op in OPS[cat]"
                :key="cat + ':' + op.v"
                class="ops-item"
                :class="{ open: isOpen(cat + ':' + op.v) }"
              >
                <button type="button" class="ops-head" :aria-expanded="String(isOpen(cat + ':' + op.v))" @click="togglePanel(cat + ':' + op.v)">
                  <span class="ops-name">{{ op.n[0] }}</span>
                  <span class="ops-syn">{{ op.s }}</span>
                  <span class="ops-chev" aria-hidden="true">▼</span>
                </button>
                <div class="ops-panel" :hidden="!isOpen(cat + ':' + op.v)">
                  <p class="ops-desc">{{ op.d[0] }}</p>
                  <div class="ops-example">
                    <small>EX</small>
                    <div class="ex-expr">{{ op.x }}</div>
                    <div class="ex-res">{{ exampleResult(op.x, op.m) }}</div>
                  </div>
                  <div class="ops-actions">
                    <button type="button" class="ops-act primary" @click="insertOp(op)">{{ t('calc.insert') }}</button>
                    <button type="button" class="ops-act" @click="tryExample(op.x, op.m)">{{ t('calc.tryEx') }}</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- السجل -->
            <div class="ops-history" :hidden="activeCat !== 'history'">
              <div class="history-head">
                <h2 id="hist-h">{{ L('السجل', 'History') }}</h2>
                <button type="button" class="history-clear" @click="clearHistoryPanel">{{ L('مسح', 'Clear') }}</button>
              </div>
              <ul class="history-list">
                <li v-if="!historyList.length" class="history-empty">{{ t('calc.history.empty') }}</li>
                <li v-for="(h, i) in reversedHistory" :key="'h' + i">
                  <button type="button" class="history-item" @click="useHistoryItem(h)">
                    <span class="h-expr">{{ h.e }}</span>
                    <span class="h-res">{{ h.r }}</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <!-- ════ لوحة الأرقام ════ -->
      <div class="calc-side">
        <div class="calc-wrapper">
          <div class="calc-buttons" role="group" :aria-label="L('لوحة الأرقام', 'Number pad')">
            <button
              v-for="(b, i) in pad"
              :key="i"
              type="button"
              class="calc-btn"
              :class="[b.cls]"
              :aria-label="b.aria ? b.aria[0] : undefined"
              @click="onPad(b.act, b.val)"
            >{{ b.label }}</button>
          </div>
        </div>
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

  <!-- ════ نافذة خطوات الحل بالترتيب ════ -->
  <Teleport to="body">
    <div v-if="showSteps" class="steps-overlay" role="presentation" @click.self="closeSteps">
    <div class="steps-card" role="dialog" aria-modal="true" :aria-label="t('calc.steps.title')">
      <header class="steps-head">
        <div class="steps-head-text">
          <h2 class="steps-title">{{ t('calc.steps.title') }}</h2>
          <p class="steps-sub">{{ t('calc.steps.subtitle') }}</p>
        </div>
        <button type="button" class="steps-close" :aria-label="t('calc.steps.close')" @click="closeSteps">✕</button>
      </header>

      <div class="steps-body">
        <p v-if="stepsError" class="steps-msg" role="alert">
          {{ stepsError === 'empty' ? t('calc.steps.empty') : t(stepsError) }}
        </p>

        <template v-else-if="stepsData && stepsData.type === 'ineq'">
          <div class="steps-orig">
            <span class="steps-tag">{{ t('calc.steps.original') }}</span>
            <code class="steps-expr" dir="ltr">{{ stepsData.original }}</code>
          </div>

          <ol class="steps-list">
            <li v-for="(s, i) in stepsData.steps" :key="i" class="steps-item ineq-item">
              <span class="steps-num">{{ i + 1 }}</span>
              <code class="ineq-expr" dir="ltr">{{ s.expr }}</code>
              <span class="steps-kind">{{ t('calc.steps.ineq.' + s.kind) }}</span>
            </li>
          </ol>

          <div class="steps-final">
            <span class="steps-tag">{{ t('calc.steps.ineq.solution') }}</span>
            <code class="steps-expr fin" dir="ltr">{{ stepsData.special === 'all' ? t('calc.ineq.all') : stepsData.special === 'none' ? t('calc.ineq.none') : stepsData.solution }}</code>
          </div>
        </template>

        <template v-else-if="stepsData && stepsData.type === 'stats'">
          <div class="steps-orig">
            <span class="steps-tag">{{ t('calc.steps.original') }}</span>
            <code class="steps-expr" dir="ltr">{{ stepsData.original }}</code>
          </div>

          <div class="cx-main" dir="ltr">{{ stepsData.original }} = {{ stepsData.final === null ? '—' : fmt(stepsData.final) }}</div>

          <div class="cx-grid">
            <div class="cx-cell"><small>{{ L('العدد', 'Count') }}</small><b dir="ltr">{{ stepsData.m.n }}</b></div>
            <div class="cx-cell"><small>{{ L('المجموع', 'Sum') }}</small><b dir="ltr">{{ fmt(stepsData.m.sum) }}</b></div>
            <div class="cx-cell"><small>{{ L('المتوسط', 'Mean') }}</small><b dir="ltr">{{ fmt(stepsData.m.mean) }}</b></div>
            <div class="cx-cell"><small>{{ L('الوسيط', 'Median') }}</small><b dir="ltr">{{ fmt(stepsData.m.median) }}</b></div>
            <div class="cx-cell"><small>{{ L('المنوال', 'Mode(s)') }}</small><b dir="ltr">{{ stepsData.m.modes.length ? stepsData.m.modes.map(fmt).join(' ، ') : t('calc.stats.nomode') }}</b></div>
            <div class="cx-cell"><small>{{ L('الربيع Q1', 'Quartile Q1') }}</small><b dir="ltr">{{ fmt(stepsData.m.q1) }}</b></div>
            <div class="cx-cell"><small>{{ L('الربيع Q3', 'Quartile Q3') }}</small><b dir="ltr">{{ fmt(stepsData.m.q3) }}</b></div>
            <div class="cx-cell"><small>{{ L('المدى الربيعي', 'IQR') }}</small><b dir="ltr">{{ fmt(stepsData.m.iqr) }}</b></div>
            <div class="cx-cell"><small>σ</small><b dir="ltr">{{ fmt(stepsData.m.stdev) }}</b></div>
            <div class="cx-cell"><small>s</small><b dir="ltr">{{ stepsData.m.sstd === null ? '—' : fmt(stepsData.m.sstd) }}</b></div>
            <div class="cx-cell"><small>σ²</small><b dir="ltr">{{ fmt(stepsData.m.varPop) }}</b></div>
            <div class="cx-cell"><small>{{ L('الصغرى', 'Min') }}</small><b dir="ltr">{{ fmt(stepsData.m.min) }}</b></div>
            <div class="cx-cell"><small>{{ L('العظمى', 'Max') }}</small><b dir="ltr">{{ fmt(stepsData.m.max) }}</b></div>
            <div class="cx-cell"><small>{{ L('المدى', 'Range') }}</small><b dir="ltr">{{ fmt(stepsData.m.range) }}</b></div>
            <div class="cx-cell"><small>{{ L('المدى الأوسط', 'Midrange') }}</small><b dir="ltr">{{ fmt(stepsData.m.midrange) }}</b></div>
            <div class="cx-cell"><small>{{ L('منتصف المفصلات', 'Midhinge') }}</small><b dir="ltr">{{ fmt(stepsData.m.midhinge) }}</b></div>
          </div>

          <div class="steps-final">
            <span class="steps-tag">{{ t('calc.steps.final') }}</span>
            <code class="steps-expr fin" dir="ltr">{{ stepsData.final === null ? '—' : fmt(stepsData.final) }}</code>
          </div>
        </template>

        <template v-else-if="stepsData && stepsData.type === 'complex'">
          <div class="steps-orig">
            <span class="steps-tag">{{ t('calc.steps.original') }}</span>
            <code class="steps-expr" dir="ltr">{{ stepsData.original }}</code>
          </div>

          <!-- حل المعادلات -->
          <template v-if="stepsData.cx.mode === 'solve'">
            <p v-if="stepsData.cx.special === 'all'" class="cx-plain">{{ t('calc.ineq.all') }}</p>
            <p v-else-if="stepsData.cx.special === 'none'" class="cx-plain">{{ t('calc.ineq.none') }}</p>
            <template v-else>
              <p class="cx-note">
                {{ L('درجة المعادلة', 'Equation degree') }}: {{ stepsData.cx.degree }}
                · {{ L('N حلول', 'N solutions').replace('N', String(stepsData.cx.roots.length)) }}
              </p>
              <ul class="cx-roots">
                <li v-for="(rt, i) in stepsData.cx.roots" :key="i">
                  <span class="cx-root-var">x<sub>{{ i + 1 }}</sub></span>
                  <span class="cx-root-eq">=</span>
                  <b class="cx-root-val" dir="ltr">{{ cxFmt(rt) }}</b>
                </li>
              </ul>
            </template>
          </template>

          <!-- تقييم / قطبية / درجة -->
          <template v-else>
            <div class="cx-main" dir="ltr">
              {{ stepsData.cx.mode === 'polar'
                ? stepsData.cx.zStr + ' = ' + stepsData.cx.p.r + '(cos ' + stepsData.cx.p.deg360 + '° + i sin ' + stepsData.cx.p.deg360 + '°)'
                : stepsData.cx.zStr }}
            </div>
            <div v-if="stepsData.cx.mode === 'polar'" class="cx-sub" dir="ltr">{{ stepsData.cx.p.r }} ∠ {{ stepsData.cx.p.degP }}°</div>
            <div v-else-if="stepsData.cx.mode === 'degree'" class="cx-arg" dir="ltr">{{ stepsData.cx.p.degP }}°</div>
            <div class="cx-grid">
              <div class="cx-cell"><small>Re</small><b dir="ltr">{{ stepsData.cx.p.re }}</b></div>
              <div class="cx-cell"><small>Im</small><b dir="ltr">{{ stepsData.cx.p.im }}</b></div>
              <div class="cx-cell"><small>|z|</small><b dir="ltr">{{ stepsData.cx.p.abs }}</b></div>
              <div class="cx-cell"><small>θ°</small><b dir="ltr">{{ stepsData.cx.p.deg360 }}°</b></div>
              <div class="cx-cell"><small>rad</small><b dir="ltr">{{ stepsData.cx.p.rad }}</b></div>
              <div class="cx-cell"><small>z̄</small><b dir="ltr">{{ stepsData.cx.p.conj }}</b></div>
            </div>
          </template>

          <div class="steps-final">
            <span class="steps-tag">{{ t('calc.steps.final') }}</span>
            <code class="steps-expr fin" dir="ltr">{{ cxFinalText(stepsData.cx) }}</code>
          </div>
        </template>

        <template v-else-if="stepsData">
          <div class="steps-orig">
            <span class="steps-tag">{{ t('calc.steps.original') }}</span>
            <code class="steps-expr" dir="ltr">{{ stepsData.original }}</code>
          </div>

          <ol class="steps-list">
            <li v-for="(s, i) in stepsData.steps" :key="i" class="steps-item">
              <span class="steps-num">{{ i + 1 }}</span>
              <div class="steps-math" dir="ltr">
                <code class="steps-sub">{{ s.sub }}</code>
                <span class="steps-eq">=</span>
                <span class="steps-res">{{ s.res }}</span>
              </div>
              <span class="steps-kind">{{ stepKindLabel(s) }}</span>
            </li>
          </ol>

          <div class="steps-final">
            <span class="steps-tag">{{ t('calc.steps.final') }}</span>
            <code class="steps-expr fin" dir="ltr">{{ stepsData.final }}</code>
          </div>
        </template>
      </div>

      <footer class="steps-foot">{{ stepsData && stepsData.type === 'ineq' ? t('calc.steps.ineq.hint') : t('calc.steps.hint') }}</footer>
    </div>
    </div>
  </Teleport>

  <SavedHistory tool="calculator" />
</template>

<style scoped>
/* ── نافذة خطوات الحل بالترتيب ── */
.steps-overlay {
  position: fixed; inset: 0; z-index: 400;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  background: rgba(4, 8, 20, 0.62);
  backdrop-filter: blur(6px);
  overscroll-behavior: contain;
}
.steps-card {
  width: min(680px, 100%);
  max-height: min(86vh, 760px);
  display: flex; flex-direction: column;
  background: var(--bg-card);
  border: 2px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: 8px 8px 0 var(--shadow-ink), var(--shadow-glow);
  animation: steps-pop 0.2s var(--transition);
}
@keyframes steps-pop {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}
.steps-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.8rem;
  padding: 1rem 1.1rem; border-bottom: 2px solid var(--border);
}
.steps-title { margin: 0; font-size: 1.15rem; color: var(--text-primary); }
.steps-sub { margin: 0.2rem 0 0; font-size: 0.82rem; color: var(--text-secondary); }
.steps-close {
  flex: none; width: 38px; height: 38px; cursor: pointer;
  border: 2px solid var(--line); border-radius: 10px;
  background: var(--bg-secondary); color: var(--text-primary);
  font: 700 1rem var(--font-main);
  box-shadow: 2px 2px 0 var(--shadow-ink);
  transition: transform var(--transition), box-shadow var(--transition);
}
.steps-close:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--shadow-ink); }
.steps-close:active { transform: translate(1px, 1px); box-shadow: none; }
.steps-body { overflow: auto; padding: 1rem 1.1rem; }
.steps-msg { color: var(--accent-danger); font-weight: 600; text-align: center; padding: 1.2rem 0.5rem; }
.steps-orig, .steps-final {
  display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
  margin-block: 0.2rem 1rem;
}
.steps-tag {
  flex: none; font-size: 0.72rem; font-weight: 800;
  color: #0d1633; background: var(--hl);
  border: 2px solid var(--line); border-radius: 999px; padding: 0.18rem 0.7rem;
}
.steps-expr {
  font: 700 1rem var(--font-mono); color: var(--accent);
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 8px; padding: 0.28rem 0.6rem;
  direction: ltr; text-align: left;
  overflow-x: auto; white-space: nowrap; max-width: 100%;
}
.steps-expr.fin { color: var(--accent-3); font-size: 1.25rem; }
.steps-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.steps-item {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: center; gap: 0.65rem;
  background: var(--bg-card-hover);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.7rem;
}
.steps-num {
  width: 2rem; height: 2rem; display: grid; place-items: center;
  background: var(--accent); color: #fff;
  border-radius: 50%; font: 800 0.82rem var(--font-main);
  box-shadow: 2px 2px 0 var(--shadow-ink); flex: none;
}
.steps-math {
  display: flex; align-items: center; gap: 0.5rem; min-width: 0;
  direction: ltr; justify-content: flex-start;
}
.ineq-expr {
  font: 800 1.05rem var(--font-mono); color: var(--text-primary);
  direction: ltr; text-align: left; unicode-bidi: isolate;
  white-space: nowrap; overflow-x: auto; min-width: 0; scrollbar-width: thin;
}
.steps-sub {
  font: 700 0.95rem var(--font-mono); color: var(--text-primary);
  white-space: nowrap; overflow-x: auto; max-width: 100%; scrollbar-width: thin;
}
.steps-eq { color: var(--text-muted); font-weight: 800; flex: none; }
.steps-res { font: 800 1rem var(--font-mono); color: var(--accent-3); flex: none; }
.steps-kind {
  justify-self: end; text-align: left; direction: ltr;
  font-size: 0.72rem; font-weight: 700; color: var(--text-muted);
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 999px; padding: 0.15rem 0.6rem; white-space: nowrap;
}
.steps-foot {
  padding: 0.7rem 1.1rem; border-top: 2px solid var(--border);
  font-size: 0.8rem; color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
.bar-btn.bar-steps { border-color: var(--accent); color: var(--accent); }
/* ── تفاصيل الأعداد المركبة داخل نافذة الخطوات ── */
.cx-plain {
  text-align: center; padding: 1rem 0; margin: 0 0 1rem;
  font: 800 1.4rem var(--font-main); color: var(--accent-3);
}
.cx-note { margin: 0 0 .7rem; font-size: .8rem; color: var(--text-secondary); text-align: center; }
.cx-roots { list-style: none; margin: 0 0 1rem; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
.cx-roots li {
  display: flex; align-items: baseline; justify-content: center; gap: .55rem;
  background: var(--bg-card-hover); border: 1.5px solid var(--border);
  border-radius: var(--radius-md); padding: .55rem .8rem;
}
.cx-root-var { font: 800 .9rem var(--font-mono); color: var(--text-secondary); }
.cx-root-eq { color: var(--text-muted); font-weight: 800; }
.cx-root-val { font: 800 1.1rem var(--font-mono); color: var(--accent-3); direction: ltr; unicode-bidi: isolate; }
.cx-main {
  font: 800 1.35rem var(--font-mono); color: var(--text-primary);
  text-align: center; padding: .4rem 0; word-break: break-word;
  direction: ltr; unicode-bidi: isolate;
}
.cx-sub { font: 700 1rem var(--font-mono); color: var(--text-secondary); text-align: center; padding-bottom: .5rem; direction: ltr; }
.cx-arg { font: 800 2rem var(--font-mono); color: var(--accent-3); text-align: center; padding: .2rem 0 .5rem; direction: ltr; }
.cx-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: .5rem; margin: .8rem 0; padding: .8rem 0 0; border-top: 2px dashed var(--border);
}
.cx-cell { background: var(--bg-secondary); border: 1.5px solid var(--border); border-radius: 10px; padding: .5rem .5rem .55rem; text-align: center; }
.cx-cell small { display: block; font-size: .7rem; font-weight: 800; color: var(--text-muted); margin-bottom: .2rem; }
.cx-cell b { display: block; font: 700 .92rem var(--font-mono); direction: ltr; unicode-bidi: isolate; color: var(--text-primary); overflow-wrap: anywhere; }
@media (max-width: 480px) {
  .steps-item { grid-template-columns: 2rem minmax(0, 1fr); }
  .steps-kind { grid-column: 2; justify-self: start; text-align: left; }
}
</style>