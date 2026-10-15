// ─────────────────────────────────────────────────────────────
//  بيانات الأشكال الهندسية — مصدر واحد يغذّي الشريط ولوحات القياس.
//
//  النصوص ثنائية اللغة بصيغة [عربي, إنجليزي] وتُترجم في الواجهة
//  عبر L()، لذا تتبع تبديل اللغة مباشرة.
//
//  ترتيب المصفوفة = ترتيب تبويبات شريط الأشكال.
// ─────────────────────────────────────────────────────────────

export const SHAPES = [
  {
    id: 'circle', ar: 'الدائرة', en: 'Circle',
    title: ['حساب الدائرة', 'Circle calculator'],
    action: ['احسب الدائرة', 'Calculate circle'],
    formula: 'A = π × r² | C = 2 × π × r | d = 2r',
    errorId: 'circle-error',
    fields: [{ key: 'r', label: ['نصف القطر (r)', 'Radius (r)'], ph: ['مثال: 5', 'e.g. 5'] }]
  },
  {
    id: 'square', ar: 'المربع', en: 'Square',
    title: ['حساب المربع', 'Square calculator'],
    action: ['احسب المربع', 'Calculate square'],
    formula: 'A = a² | P = 4 × a | d = a × √2',
    errorId: 'square-error',
    fields: [{ key: 'a', label: ['طول الضلع (a)', 'Side length (a)'], ph: ['مثال: 7', 'e.g. 7'] }]
  },
  {
    id: 'rect', ar: 'المستطيل', en: 'Rectangle',
    title: ['حساب المستطيل', 'Rectangle calculator'],
    action: ['احسب المستطيل', 'Calculate rectangle'],
    formula: 'A = w × h | P = 2(w + h) | d = √(w² + h²)',
    errorId: 'rect-error',
    fields: [
      { key: 'w', label: ['العرض (w)', 'Width (w)'], ph: ['مثال: 8', 'e.g. 8'] },
      { key: 'h', label: ['الارتفاع (h)', 'Height (h)'], ph: ['مثال: 5', 'e.g. 5'] }
    ]
  },
  {
    id: 'triangle', ar: 'المثلث', en: 'Triangle',
    title: ['حساب المثلث', 'Triangle calculator'],
    action: ['احسب المثلث', 'Calculate triangle'],
    formula: 's = (a+b+c)/2 | A = √(s(s−a)(s−b)(s−c))',
    errorId: 'tri-error',
    fields: [
      { key: 'a', label: ['الضلع a', 'Side a'], ph: '3' },
      { key: 'b', label: ['الضلع b', 'Side b'], ph: '4' },
      { key: 'c', label: ['الضلع c', 'Side c'], ph: '5' }
    ]
  },
  {
    id: 'right', ar: 'المثلث القائم', en: 'Right triangle',
    title: ['حساب المثلث القائم', 'Right triangle calculator'],
    action: ['احسب المثلث القائم', 'Calculate right triangle'],
    formula: 'c = √(a² + b²) | A = (a × b) ÷ 2',
    errorId: 'rt-error',
    hint: ['أدخل أي ضلعين وسيُحسب الضلع الثالث تلقائياً (فيثاغورس).', 'Enter any two sides and the third is computed automatically (Pythagoras).'],
    fields: [
      { key: 'a', label: ['الساق a', 'Leg a'], ph: '3' },
      { key: 'b', label: ['الساق b', 'Leg b'], ph: '4' },
      { key: 'c', label: ['الوتر c', 'Hypotenuse c'], ph: '5' }
    ]
  },
  {
    id: 'rhombus', ar: 'المعين', en: 'Rhombus',
    title: ['حساب المعين', 'Rhombus calculator'],
    action: ['احسب المعين', 'Calculate rhombus'],
    formula: 'A = (d₁ × d₂) ÷ 2 | P = 4 × a',
    errorId: 'rho-error',
    fields: [
      { key: 'd1', label: ['القطر الأول (d₁)', 'First diagonal (d₁)'], ph: '8' },
      { key: 'd2', label: ['القطر الثاني (d₂)', 'Second diagonal (d₂)'], ph: '6' }
    ]
  },
  {
    id: 'parallelogram', ar: 'متوازي الأضلاع', en: 'Parallelogram',
    title: ['حساب متوازي الأضلاع', 'Parallelogram calculator'],
    action: ['احسب متوازي الأضلاع', 'Calculate parallelogram'],
    formula: 'A = b × h | P = 2 × (a + b)',
    errorId: 'par-error',
    fields: [
      { key: 'b', label: ['القاعدة (b)', 'Base (b)'], ph: '10' },
      { key: 'h', label: ['الارتفاع (h)', 'Height (h)'], ph: '4' },
      { key: 'a', label: ['الضلع الجانبي (a)', 'Side (a)'], ph: '6' }
    ]
  },
  {
    id: 'trapezoid', ar: 'شبه المنحرف', en: 'Trapezoid',
    title: ['حساب شبه المنحرف', 'Trapezoid calculator'],
    action: ['احسب شبه المنحرف', 'Calculate trapezoid'],
    formula: 'A = ((a + b) ÷ 2) × h | m = (a + b) ÷ 2',
    errorId: 'trp-error',
    fields: [
      { key: 'a', label: ['القاعدة الكبرى (a)', 'Longer base (a)'], ph: '10' },
      { key: 'b', label: ['القاعدة الصغرى (b)', 'Shorter base (b)'], ph: '6' },
      { key: 'h', label: ['الارتفاع (h)', 'Height (h)'], ph: '4' },
      { key: 'c', label: ['الضلع c (اختياري)', 'Side c (optional)'], ph: '5' },
      { key: 'd', label: ['الضلع d (اختياري)', 'Side d (optional)'], ph: '5' }
    ]
  },
  {
    id: 'polygon', ar: 'المضلع المنتظم', en: 'Regular polygon',
    title: ['حساب المضلع المنتظم', 'Regular polygon calculator'],
    action: ['احسب المضلع', 'Calculate polygon'],
    formula: 'A = (n × s²) ÷ (4 tan(π/n)) | P = n × s',
    errorId: 'poly-error',
    fields: [
      { key: 'n', label: ['عدد الأضلاع (n)', 'Number of sides (n)'], ph: '6', min: 3, step: 1 },
      { key: 's', label: ['طول الضلع (s)', 'Side length (s)'], ph: '5' }
    ]
  },
  {
    id: 'ellipse', ar: 'القطع الناقص', en: 'Ellipse',
    title: ['حساب القطع الناقص', 'Ellipse calculator'],
    action: ['احسب القطع الناقص', 'Calculate ellipse'],
    formula: 'A = π × a × b | P ≈ π[3(a+b) − √((3a+b)(a+3b))]',
    errorId: 'ell-error',
    fields: [
      { key: 'a', label: ['نصف المحور الأكبر (a)', 'Semi-major axis (a)'], ph: '8' },
      { key: 'b', label: ['نصف المحور الأصغر (b)', 'Semi-minor axis (b)'], ph: '5' }
    ]
  },
  {
    id: 'sector', ar: 'القطاع الدائري', en: 'Sector',
    title: ['حساب القطاع الدائري', 'Sector calculator'],
    action: ['احسب القطاع', 'Calculate sector'],
    formula: 'A = (θ ÷ 360) × π × r² | L = (θ ÷ 360) × 2 × π × r',
    errorId: 'sec-error',
    fields: [
      { key: 'r', label: ['نصف القطر (r)', 'Radius (r)'], ph: '6' },
      { key: 'deg', label: ['الزاوية (بالدرجات)', 'Angle (degrees)'], ph: '90', max: 360 }
    ]
  },
  {
    id: 'sphere', ar: 'الكرة', en: 'Sphere',
    title: ['حساب الكرة', 'Sphere calculator'],
    action: ['احسب الكرة', 'Calculate sphere'],
    formula: 'V = 4/3 × π × r³ | S = 4 × π × r²',
    errorId: 'sphere-error',
    fields: [{ key: 'r', label: ['نصف القطر (r)', 'Radius (r)'], ph: ['مثال: 3', 'e.g. 3'] }]
  },
  {
    id: 'hemisphere', ar: 'شبه الكرة', en: 'Hemisphere',
    title: ['حساب شبه الكرة', 'Hemisphere calculator'],
    action: ['احسب شبه الكرة', 'Calculate hemisphere'],
    formula: 'V = (2/3) × π × r³ | S = 3 × π × r²',
    errorId: 'hemi-error',
    fields: [{ key: 'r', label: ['نصف القطر (r)', 'Radius (r)'], ph: '3' }]
  },
  {
    id: 'cube', ar: 'المكعب', en: 'Cube',
    title: ['حساب المكعب', 'Cube calculator'],
    action: ['احسب المكعب', 'Calculate cube'],
    formula: 'V = a³ | S = 6 × a² | D = a × √3',
    errorId: 'cube-error',
    fields: [{ key: 'a', label: ['طول الضلع (a)', 'Side length (a)'], ph: '3' }]
  },
  {
    id: 'cuboid', ar: 'متوازي المستطيلات', en: 'Cuboid',
    title: ['حساب متوازي المستطيلات', 'Cuboid calculator'],
    action: ['احسب متوازي المستطيلات', 'Calculate cuboid'],
    formula: 'V = l × w × h | S = 2(lw + lh + wh) | D = √(l² + w² + h²)',
    errorId: 'cub-error',
    fields: [
      { key: 'l', label: ['الطول (l)', 'Length (l)'], ph: '8' },
      { key: 'w', label: ['العرض (w)', 'Width (w)'], ph: '5' },
      { key: 'h', label: ['الارتفاع (h)', 'Height (h)'], ph: '4' }
    ]
  },
  {
    id: 'cylinder', ar: 'الأسطوانة', en: 'Cylinder',
    title: ['حساب الأسطوانة', 'Cylinder calculator'],
    action: ['احسب الأسطوانة', 'Calculate cylinder'],
    formula: 'V = π × r² × h | L = 2 × π × r × h | S = 2 × π × r × (h + r)',
    errorId: 'cyl-error',
    fields: [
      { key: 'r', label: ['نصف القطر (r)', 'Radius (r)'], ph: '3' },
      { key: 'h', label: ['الارتفاع (h)', 'Height (h)'], ph: '7' }
    ]
  },
  {
    id: 'cone', ar: 'المخروط', en: 'Cone',
    title: ['حساب المخروط', 'Cone calculator'],
    action: ['احسب المخروط', 'Calculate cone'],
    formula: 'V = (1/3) × π × r² × h | l = √(r² + h²) | S = π × r × (l + r)',
    errorId: 'cone-error',
    fields: [
      { key: 'r', label: ['نصف القطر (r)', 'Radius (r)'], ph: '3' },
      { key: 'h', label: ['الارتفاع (h)', 'Height (h)'], ph: '4' }
    ]
  },
  {
    id: 'obliqueCylinder', ar: 'الأسطوانة المائلة', en: 'Oblique cylinder',
    title: ['حساب الأسطوانة المائلة', 'Oblique cylinder calculator'],
    action: ['احسب الأسطوانة المائلة', 'Calculate oblique cylinder'],
    formula: 'V = π × r² × h | L = 2 × π × r × l',
    errorId: 'oc-error',
    fields: [
      { key: 'r', label: ['نصف القطر (r)', 'Radius (r)'], ph: '3' },
      { key: 'h', label: ['الارتفاع العمودي (h)', 'Perpendicular height (h)'], ph: '5' },
      { key: 'tilt', label: ['زاوية الميل عن القاعدة (θ°)', 'Tilt from the base (θ°)'], ph: '60', max: 90 }
    ]
  },
  {
    id: 'pyramid', ar: 'الهرم', en: 'Pyramid',
    title: ['حساب الهرم', 'Pyramid calculator'],
    action: ['احسب الهرم', 'Calculate pyramid'],
    formula: 'V = (a² × h) ÷ 3 | S = a² + 2 × a × l',
    errorId: 'pyr-error',
    fields: [
      { key: 'a', label: ['ضلع القاعدة (a)', 'Base side (a)'], ph: '4' },
      { key: 'h', label: ['الارتفاع (h)', 'Height (h)'], ph: '6' }
    ]
  },
  {
    id: 'prism', ar: 'المنشور', en: 'Prism',
    title: ['حساب المنشور', 'Prism calculator'],
    action: ['احسب المنشور', 'Calculate prism'],
    formula: 'V = Aᵦ × h | L = Pᵦ × h | S = 2Aᵦ + L',
    errorId: 'prm-error',
    fields: [
      { key: 'n', label: ['أضلاع القاعدة (n)', 'Base sides (n)'], ph: '6', min: 3, step: 1 },
      { key: 's', label: ['طول ضلع القاعدة (s)', 'Base side length (s)'], ph: '3' },
      { key: 'h', label: ['الارتفاع (h)', 'Height (h)'], ph: '5' }
    ]
  },
  {
    id: 'frustum', ar: 'المخروط الناقص', en: 'Cone frustum',
    title: ['حساب المخروط الناقص', 'Cone frustum calculator'],
    action: ['احسب المخروط الناقص', 'Calculate frustum'],
    formula: 'V = (π × h ÷ 3)(r₁² + r₁r₂ + r₂²) | L = π × (r₁ + r₂) × l',
    errorId: 'fr-error',
    fields: [
      { key: 'r1', label: ['نصف قطر القاعدة الكبرى (r₁)', 'Bottom radius (r₁)'], ph: '5' },
      { key: 'r2', label: ['نصف قطر القاعدة الصغرى (r₂)', 'Top radius (r₂)'], ph: '2' },
      { key: 'h', label: ['الارتفاع (h)', 'Height (h)'], ph: '4' }
    ]
  },
  {
    id: 'obliqueBox', ar: 'متوازي السطوح المائل', en: 'Oblique box',
    title: ['حساب متوازي السطوح المائل', 'Oblique box calculator'],
    action: ['احسب متوازي السطوح المائل', 'Calculate oblique box'],
    formula: 'V = a × b × h | L = 2b·c + 2a·c·sin θ',
    errorId: 'ob-error',
    fields: [
      { key: 'a', label: ['الطول (a)', 'Length (a)'], ph: '6' },
      { key: 'b', label: ['العرض (b)', 'Width (b)'], ph: '4' },
      { key: 'c', label: ['الحرف الجانبي (c)', 'Lateral edge (c)'], ph: '5' },
      { key: 'tilt', label: ['زاوية الميل عن القاعدة (θ°)', 'Tilt from the base (θ°)'], ph: '70', max: 90 }
    ]
  }
]

// قيم ابتدائية فارغة لكل حقل، تُبنى من التعريف نفسه
export function emptyValues(shape) {
  return Object.fromEntries(shape.fields.map((f) => [f.key, '']))
}
