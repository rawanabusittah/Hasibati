// ── فئات العمليات في الآلة الحاسبة ──
// كل فئة مصفوفة من العمليات. الحقول:
//   v: النص المُدرَج · n: الاسم [ع/إ] · s: الصيغة · d: الوصف [ع/إ] · x: مثال · m: وضع الأعداد المركبة
// تُبنى البيانات عبر دالة تأخذ `L` (مترجم الواجهة) لأن التسميات ثنائية اللغة.

/** أقسام العمليات بترتيب العرض (history تُعرض داخل تبويب السجل). */
export const CATS = ['arith', 'power', 'trig', 'log', 'ineq', 'complex', 'calculus', 'combo', 'history']

/** يبني كائن العمليات المُعرَّف حسب اللغة الحالية. */
export function buildOps(L) {
  return {
    arith: [
      { v: '+', n: [L('جمع', 'Add')], s: 'a + b', d: [L('يجمع عددين أو أكثر.', 'Adds two or more numbers.')], x: '12+8' },
      { v: '-', n: [L('طرح', 'Subtract')], s: 'a − b', d: [L('يطرح الثاني من الأول.', 'Subtracts the second from the first.')], x: '50-18' },
      { v: '×', n: [L('ضرب', 'Multiply')], s: 'a × b', d: [L('يضرب عددين أو أكثر.', 'Multiplies numbers.')], x: '7×6' },
      { v: '÷', n: [L('قسمة', 'Divide')], s: 'a ÷ b', d: [L('يقسم الأول على الثاني.', 'Divides the first by the second.')], x: '84÷4' },
      { v: '%', n: [L('نسبة مئوية', 'Percent')], s: 'a + b%', d: [L('تضيف 10% من 200 إلى 200 = 220.', 'Adds 10% of 200 to 200 = 220.')], x: '200+10%' },
      { v: 'mod(', n: [L('باقي القسمة', 'Remainder')], s: 'mod(a, b)', d: [L('باقي قسمة a ÷ b.', 'Remainder of a ÷ b.')], x: 'mod(17,5)' },
      { v: 'abs(', n: [L('القيمة المطلقة', 'Absolute value')], s: 'abs(a)', d: [L('البعد عن الصفر دائماً موجب.', 'Always non-negative distance from zero.')], x: 'abs(-9)' },
      { v: 'round(', n: [L('تقريب', 'Round')], s: 'round(a)', d: [L('يقرّب لأقرب عدد صحيح.', 'Rounds to the nearest integer.')], x: 'round(3.6)' },
      { v: 'floor(', n: [L('تقريب للأدنى', 'Floor')], s: 'floor(a)', d: [L('أكبر عدد صحيح ≤ a.', 'Largest integer ≤ a.')], x: 'floor(3.9)' },
      { v: 'ceil(', n: [L('تقريب للأعلى', 'Ceil')], s: 'ceil(a)', d: [L('أصغر عدد صحيح ≥ a.', 'Smallest integer ≥ a.')], x: 'ceil(3.1)' }
    ],
    power: [
      { v: '^', n: [L('رفع لأس', 'Power')], s: 'x^y', d: [L('يرفع الأساس إلى الأس.', 'Raises the base to an exponent.')], x: '2^10' },
      { v: '√', n: [L('جذر تربيعي', 'Square root')], s: '√x', d: [L('الجذر التربيعي الموجب.', 'The positive square root.')], x: '√49' },
      { v: 'cbrt(', n: [L('جذر تكعيبي', 'Cube root')], s: 'cbrt(x)', d: [L('الجذر التكعيبي لأي عدد.', 'Cube root of any number.')], x: 'cbrt(27)' },
      { v: 'root(', n: [L('جذر عام', 'nth root')], s: 'root(x, n)', d: [L('الجذر النوني للعدد.', 'The n-th root of a number.')], x: 'root(8,3)' },
      { v: 'exp(', n: [L('أُسّ طبيعي', 'Exponential')], s: 'exp(x)', d: [L('e مرفوع لأس x.', 'e raised to the power x.')], x: 'exp(1)' }
    ],
    trig: [
      { v: 'sin(', n: [L('جيب', 'Sine')], s: 'sin(x)', d: [L('جيب الزاوية (بالدرجات أو الراديان حسب الوضع).', 'Sine of the angle (degrees or radians).')], x: 'sin(30)' },
      { v: 'cos(', n: [L('جيب تمام', 'Cosine')], s: 'cos(x)', d: [L('جيب تمام الزاوية.', 'Cosine of the angle.')], x: 'cos(60)' },
      { v: 'tan(', n: [L('ظل', 'Tangent')], s: 'tan(x)', d: [L('ظل الزاوية.', 'Tangent of the angle.')], x: 'tan(45)' },
      { v: 'asin(', n: [L('قوس الجيب', 'Arcsine')], s: 'asin(x)', d: [L('الزاوية التي جيبها x.', 'The angle whose sine is x.')], x: 'asin(0.5)' },
      { v: 'acos(', n: [L('قوس جيب التمام', 'Arccosine')], s: 'acos(x)', d: [L('الزاوية التي جيب تمامها x.', 'The angle whose cosine is x.')], x: 'acos(0.5)' },
      { v: 'atan(', n: [L('قوس الظل', 'Arctangent')], s: 'atan(x)', d: [L('الزاوية التي ظلها x.', 'The angle whose tangent is x.')], x: 'atan(1)' }
    ],
    log: [
      { v: 'ln(', n: [L('لوغاريتم طبيعي', 'Natural log')], s: 'ln(x)', d: [L('اللوغاريتم للأساس e.', 'Logarithm base e.')], x: 'ln(e)' },
      { v: 'log(', n: [L('لوغاريتم عشري', 'Common log')], s: 'log(x)', d: [L('اللوغاريتم للأساس 10.', 'Logarithm base 10.')], x: 'log(100)' },
      { v: 'log2(', n: [L('لوغاريتم ثنائي', 'Binary log')], s: 'log2(x)', d: [L('اللوغاريتم للأساس 2.', 'Logarithm base 2.')], x: 'log2(8)' },
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
      { v: 'diff(', n: [L('مشتقة أولى', 'First derivative')], s: 'diff(f, x0)', d: [L('مشتقة الدالة عند نقطة (عددية).', 'Numerical derivative at a point.')], x: 'diff(x^2,3)' },
      { v: 'diff2(', n: [L('مشتقة ثانية', 'Second derivative')], s: 'diff2(f, x0)', d: [L('المشتقة الثانية عند نقطة.', 'Second derivative at a point.')], x: 'diff2(x^3,2)' },
      { v: 'int(', n: [L('تكامل محدد', 'Definite integral')], s: 'int(f, a, b)', d: [L('تكامل الدالة من a إلى b.', 'Integral from a to b.')], x: 'int(x^2,0,3)' },
      { v: 'sum(', n: [L('مجموع Σ', 'Sum')], s: 'sum(f, a, b)', d: [L('مجموع الدالة على الأعداد الصحيحة.', 'Sum over integers.')], x: 'sum(x^2,1,5)' },
      { v: 'prod(', n: [L('جداء Π', 'Product')], s: 'prod(f, a, b)', d: [L('جداء الدالة على الأعداد الصحيحة.', 'Product over integers.')], x: 'prod(x,1,5)' }
    ],
    combo: [
      { v: 'nCr(', n: [L('توافيق', 'Combination')], s: 'nCr(n, r)', d: [L('عدد طرق اختيار r من n.', 'Ways to choose r from n.')], x: 'nCr(5,2)' },
      { v: 'nPr(', n: [L('تباديل', 'Permutation')], s: 'nPr(n, r)', d: [L('عدد التباديل المرتبة.', 'Ordered arrangements.')], x: 'nPr(5,2)' },
      { v: 'gcd(', n: [L('قاسم مشترك أكبر', 'Greatest common divisor')], s: 'gcd(a, b)', d: [L('أكبر عدد يقسم العددين.', 'Largest number dividing both.')], x: 'gcd(12,18)' },
      { v: 'lcm(', n: [L('مضاعف مشترك أصغر', 'Least common multiple')], s: 'lcm(a, b)', d: [L('أصغر مضاعف مشترك.', 'Smallest common multiple.')], x: 'lcm(4,6)' },
      { v: 'avg(', n: [L('المتوسط (Mean)', 'Mean')], s: 'avg(a, b, …)', d: [L('المتوسط الحسابي = مجموع الأعداد ÷ عددها.', 'Arithmetic mean = sum of the numbers ÷ their count.')], x: 'avg(2,4,6)' },
      { v: 'max(', n: [L('القيمة العظمى (Maximum)', 'Maximum')], s: 'max(a, b, …)', d: [L('أكبر قيمة بين الأعداد.', 'Largest value.')], x: 'max(3,9,5)' },
      { v: 'min(', n: [L('القيمة الصغرى (Minimum)', 'Minimum')], s: 'min(a, b, …)', d: [L('أصغر قيمة بين الأعداد.', 'Smallest value.')], x: 'min(3,9,5)' },
      { v: '!', n: [L('مضروب', 'Factorial')], s: 'n!', d: [L('جداء الأعداد من 1 إلى n.', 'Product of 1..n.')], x: '5!' },
      { v: 'med(', n: [L('الوسيط', 'Median')], s: 'med(a, b, …)', d: [L('القيمة الوسطى بعد ترتيب البيانات (متوسط القيمتين الوسطيتين إذا كان العدد زوجياً).', 'The middle value after sorting (average of the two middle values when even).')], x: 'med(4,8,6)' },
      { v: 'mode(', n: [L('المنوال', 'Mode')], s: 'mode(a, b, …)', d: [L('القيمة الأكثر تكراراً بين الأعداد.', 'The most frequent value in the data.')], x: 'mode(2,3,3,4)' },
      { v: 'std(', n: [L('الانحراف المعياري σ', 'Standard deviation (σ)')], s: 'std(a, b, …)', d: [L('الانحراف المعياري للمجتمع — القسمة على n.', 'Population standard deviation — divide by n.')], x: 'std(2,4,6)' },
      { v: 'sstd(', n: [L('انحراف العينة s', 'Sample std deviation (s)')], s: 'sstd(a, b, …)', d: [L('الانحراف المعياري للعينة — القسمة على n−1.', 'Sample standard deviation — divide by n−1.')], x: 'sstd(2,4,6)' },
      { v: 'var(', n: [L('التباين σ²', 'Variance (σ²)')], s: 'var(a, b, …)', d: [L('تباين المجتمع = مربع الانحراف المعياري.', 'Population variance = standard deviation squared.')], x: 'var(2,4,6)' },
      { v: 'q1(', n: [L('الربيع الأدنى Q1', 'Lower quartile Q1')], s: 'q1(a, b, …)', d: [L('وسيط النصف الأدنى من البيانات.', 'Median of the lower half of the data.')], x: 'q1(1,2,3,4,5)' },
      { v: 'q3(', n: [L('الربيع الأعلى Q3', 'Upper quartile Q3')], s: 'q3(a, b, …)', d: [L('وسيط النصف الأعلى من البيانات.', 'Median of the upper half of the data.')], x: 'q3(1,2,3,4,5)' },
      { v: 'iqr(', n: [L('المدى الربيعي IQR (H-Spread)', 'IQR (H-Spread)')], s: 'iqr(a, b, …)', d: [L('H-Spread = Q3 − Q1 — مقياس انتشار البيانات.', 'H-Spread = Q3 − Q1 — a measure of spread.')], x: 'iqr(1,2,3,4,5)' },
      { v: 'mhinge(', n: [L('منتصف المفصلات (Midhinge)', 'Midhinge')], s: 'mhinge(a, b, …)', d: [L('منتصف المسافة بين Q1 و Q3: (Q1 + Q3) ÷ 2.', 'Halfway between Q1 and Q3: (Q1 + Q3) ÷ 2.')], x: 'mhinge(1,2,3,4,5)' },
      { v: 'midrange(', n: [L('المدى الأوسط (Midrange)', 'Midrange')], s: 'midrange(a, b, …)', d: [L('نقطة المنتصف بين العظمى والصغرى.', 'The midpoint between the maximum and minimum.')], x: 'midrange(1,2,3,4,5)' },
      { v: 'range(', n: [L('المدى', 'Range')], s: 'range(a, b, …)', d: [L('الفرق بين القيمة العظمى والصغرى.', 'Difference between the maximum and minimum.')], x: 'range(1,2,3,4,5)' },
      { v: 'a10(', n: [L('الحد العاشر', 'Find the 10th term')], s: 'a10(a₁, d)', d: [L('الحد العاشر من متتالية حسابية: a₁ + 9d.', '10th term of an arithmetic sequence: a₁ + 9d.')], x: 'a10(3,2)' },
      { v: 'nth(', n: [L('الحد النوني', 'nth term')], s: 'nth(a₁, d, n)', d: [L('الحد النوني من متتالية حسابية: a₁ + (n−1)d.', 'nth term of an arithmetic sequence: a₁ + (n−1)d.')], x: 'nth(3,2,10)' },
      { v: 'gmean(', n: [L('المتوسط الهندسي', 'Geometric mean')], s: 'gmean(a, b, …)', d: [L('الجذر النوني لجداء قيم موجبة.', 'The n-th root of the product of positive values.')], x: 'gmean(2,8)' },
      { v: 'hmean(', n: [L('المتوسط التوافقي', 'Harmonic mean')], s: 'hmean(a, b, …)', d: [L('مقلوب متوسط المقلوبات لقيم موجبة.', 'Reciprocal of the average of reciprocals (positive values).')], x: 'hmean(2,6)' }
    ]
  }
}

/** تسميات الأقسام (أيقونة + اسم) حسب اللغة الحالية. */
export function buildCatLabels(L) {
  return {
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
}
