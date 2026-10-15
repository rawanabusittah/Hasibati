// اختبارات محرّك الهندسة (geoFormulas) وبيانات الأشكال (geoShapes)
// الدوال نقيّة: تستقبل القيم + دالة ترجمة، وتعيد { error } أو { summary, results }.
import { describe, it, expect } from 'vitest'
import { GEO_CALCS, gfmt, disp } from '../src/lib/geoFormulas.js'
import { SHAPES, emptyValues } from '../src/lib/geoShapes.js'

// مترجم مزيّف: يعيد المفتاح نفسه ليتسنّى مقارنة رسائل الخطأ والوسوم
const t = (k) => k
const run = (id, v) => GEO_CALCS[id](v, t)
const res = (out, label) => out.results.find((r) => r.label === label)

describe('geoShapes — تماسك البيانات', () => {
  it('كل شكل له دالة حساب والعكس', () => {
    expect(SHAPES.map((s) => s.id).sort()).toEqual(Object.keys(GEO_CALCS).sort())
  })

  it('كل شكل مكتمل التعريف (وسم، معادلة، حقول، معرّف خطأ)', () => {
    for (const s of SHAPES) {
      expect(s.ar && s.en).toBeTruthy()
      expect(s.title).toHaveLength(2)
      expect(s.action).toHaveLength(2)
      expect(s.formula.length).toBeGreaterThan(0)
      expect(s.errorId.endsWith('-error')).toBe(true)
      expect(s.fields.length).toBeGreaterThan(0)
      for (const f of s.fields) {
        expect(f.key).toBeTruthy()
        expect(f.label).toHaveLength(2)
      }
    }
  })

  it('emptyValues يعيد كل الحقول فارغة دون تكرار', () => {
    for (const s of SHAPES) {
      const v = emptyValues(s)
      expect(Object.keys(v).sort()).toEqual(s.fields.map((f) => f.key).sort())
      expect(Object.values(v).every((x) => x === '')).toBe(true)
    }
  })
})

describe('geoFormulas — الدائرة والمربع والمستطيل', () => {
  it('الدائرة: المساحة والمحيط والقطر', () => {
    const out = run('circle', { r: '5' })
    expect(out.error).toBeUndefined()
    expect(res(out, 'geo.area').raw).toBeCloseTo(78.5398, 3)
    expect(res(out, 'geo.perimeter').raw).toBeCloseTo(31.4159, 3)
    expect(res(out, 'geo.diag2').raw).toBe(10)
    expect(out.summary).toBe('r=5')
  })

  it('الدائرة: نصف قطر غير صالح', () => {
    expect(run('circle', { r: '' }).error).toBe('geo.err.r')
    expect(run('circle', { r: '0' }).error).toBe('geo.err.r')
    expect(run('circle', { r: '-3' }).error).toBe('geo.err.r')
  })

  it('المربع: المساحة والمحيط والقطر', () => {
    const out = run('square', { a: '7' })
    expect(res(out, 'geo.area').raw).toBe(49)
    expect(res(out, 'geo.perimeter').raw).toBe(28)
    expect(res(out, 'geo.diag').raw).toBeCloseTo(9.8995, 3)
  })

  it('المستطيل: القيم صحيحة', () => {
    const out = run('rect', { w: '8', h: '5' })
    expect(res(out, 'geo.area').raw).toBe(40)
    expect(res(out, 'geo.perimeter').raw).toBe(26)
    expect(res(out, 'geo.diag').raw).toBeCloseTo(9.434, 3)
  })

  it('المستطيل: قيمة ناقصة', () => {
    expect(run('rect', { w: '8', h: '' }).error).toBe('geo.err.rect')
  })
})

describe('geoFormulas — المثلثات', () => {
  it('مثلث 3-4-5: نصف المحيط والمساحة والنوع', () => {
    const out = run('triangle', { a: '3', b: '4', c: '5' })
    expect(res(out, 'geo.semiperim').raw).toBe(6)
    expect(res(out, 'geo.area').raw).toBeCloseTo(6, 9)
    expect(res(out, 'geo.type').value).toBe('geo.type.right')
    expect(res(out, 'geo.inradius').raw).toBeCloseTo(1, 9)
    expect(res(out, 'geo.circumradius').raw).toBeCloseTo(2.5, 9)
  })

  it('مثلث متساوي الأضلاع', () => {
    expect(res(run('triangle', { a: '7', b: '7', c: '7' }), 'geo.type').value).toBe('geo.type.equi')
  })

  it('مثلث مختلف الأضلاع (هيرون)', () => {
    expect(res(run('triangle', { a: '5', b: '6', c: '7' }), 'geo.area').raw).toBeCloseTo(Math.sqrt(216), 9)
  })

  it('أضلاع لا تكوّن مثلثاً', () => {
    expect(run('triangle', { a: '1', b: '2', c: '10' }).error).toBe('geo.err.tri')
  })

  it('ضلع ناقص', () => {
    expect(run('triangle', { a: '3', b: '4', c: '' }).error).toBe('geo.err.side')
  })

  it('قائم: من الساقين يُحسب الوتر', () => {
    const out = run('right', { a: '3', b: '4', c: '' })
    expect(res(out, 'geo.hyp').raw).toBeCloseTo(5, 9)
    expect(res(out, 'geo.area').raw).toBeCloseTo(6, 9)
    expect(res(out, 'geo.perimeter').raw).toBeCloseTo(12, 9)
  })

  it('قائم: من الوتر وساق', () => {
    expect(res(run('right', { a: '3', b: '', c: '5' }), 'geo.legB').raw).toBeCloseTo(4, 9)
  })

  it('قائم: الوتر ليس الأطول', () => {
    expect(run('right', { a: '4', b: '', c: '3' }).error).toBe('geo.err.hyp')
  })

  it('قائم: أقل من ضلعين', () => {
    expect(run('right', { a: '3', b: '', c: '' }).error).toBe('geo.err.right')
  })

  it('قائم: ثلاثة أضلاع لا تحقق فيثاغورس', () => {
    expect(run('right', { a: '1', b: '2', c: '3' }).error).toBe('geo.err.rightTri')
  })
})

describe('geoFormulas — الأشكال المستوية', () => {
  it('المعين: من القطرين', () => {
    const out = run('rhombus', { d1: '8', d2: '6' })
    expect(res(out, 'geo.area').raw).toBe(24)
    expect(res(out, 'geo.side').raw).toBeCloseTo(5, 9)
    expect(res(out, 'geo.perimeter').raw).toBeCloseTo(20, 9)
  })

  it('متوازي الأضلاع: القاعدة × الارتفاع', () => {
    const out = run('parallelogram', { a: '6', b: '10', h: '4' })
    expect(res(out, 'geo.area').raw).toBe(40)
    expect(res(out, 'geo.perimeter').raw).toBe(32)
  })

  it('شبه المنحرف: المحيط اختياري', () => {
    const base = run('trapezoid', { a: '10', b: '6', h: '4', c: '', d: '' })
    expect(base.results).toHaveLength(2)
    expect(res(base, 'geo.median').raw).toBe(8)
    const full = run('trapezoid', { a: '10', b: '6', h: '4', c: '5', d: '5' })
    expect(res(full, 'geo.area').raw).toBe(32)
    expect(res(full, 'geo.perimeter').raw).toBe(26)
  })

  it('المضلع المنتظم: مساحة وعمود ومحيط', () => {
    const out = run('polygon', { n: '5', s: '4' })
    expect(res(out, 'geo.perimeter').raw).toBe(20)
    expect(res(out, 'geo.area').raw).toBeCloseTo(27.5276, 3)
    expect(res(out, 'geo.apothem').raw).toBeCloseTo(2.7528, 3)
    expect(res(out, 'geo.circumradius').raw).toBeCloseTo(3.4026, 3)
  })

  it('المضلع المنتظم: أقل من 3 أضلاع', () => {
    expect(run('polygon', { n: '2', s: '4' }).error).toBe('geo.err.poly')
    expect(run('prism', { n: '2', s: '4', h: '5' }).error).toBe('geo.err.poly')
  })

  it('القطع الناقص: المساحة والمحيط التقريبي', () => {
    const out = run('ellipse', { a: '8', b: '5' })
    expect(res(out, 'geo.area').raw).toBeCloseTo(125.6637, 3)
    expect(res(out, 'geo.perimeter').raw).toBeCloseTo(41.3863, 3)
  })

  it('القطاع الدائري: القوس والوتر', () => {
    const out = run('sector', { r: '6', deg: '90' })
    expect(res(out, 'geo.area').raw).toBeCloseTo(28.2743, 3)
    expect(res(out, 'geo.arc').raw).toBeCloseTo(9.4248, 3)
    expect(res(out, 'geo.chord').raw).toBeCloseTo(8.4853, 3)
    expect(res(out, 'geo.perimeter').raw).toBeCloseTo(21.4248, 3)
  })

  it('القطاع الدائري: زاوية غير صالحة', () => {
    expect(run('sector', { r: '6', deg: '0' }).error).toBe('geo.err.angle')
    expect(run('sector', { r: '6', deg: '361' }).error).toBe('geo.err.angle')
    expect(run('sector', { r: '', deg: '90' }).error).toBe('geo.err.r')
  })
})

describe('geoFormulas — المجسّمات', () => {
  it('الكرة: الحجم والمساحة', () => {
    const out = run('sphere', { r: '3' })
    expect(res(out, 'geo.volume').raw).toBeCloseTo(113.0973, 3)
    expect(res(out, 'geo.surface').raw).toBeCloseTo(113.0973, 3)
  })

  it('شبه الكرة: الحجم والسطح الكلي', () => {
    const out = run('hemisphere', { r: '3' })
    expect(res(out, 'geo.volume').raw).toBeCloseTo(56.5487, 3)
    expect(res(out, 'geo.surface').raw).toBeCloseTo(84.823, 3)
    expect(res(out, 'geo.diag2').raw).toBe(6)
  })

  it('المكعب: الحجم والسطح والقطران', () => {
    const out = run('cube', { a: '3' })
    expect(res(out, 'geo.volume').raw).toBe(27)
    expect(res(out, 'geo.surface').raw).toBe(54)
    expect(res(out, 'geo.diagSpace').raw).toBeCloseTo(5.1962, 3)
  })

  it('متوازي المستطيلات', () => {
    const out = run('cuboid', { l: '8', w: '5', h: '4' })
    expect(res(out, 'geo.volume').raw).toBe(160)
    expect(res(out, 'geo.surface').raw).toBe(184)
    expect(res(out, 'geo.diagSpace').raw).toBeCloseTo(10.247, 3)
  })

  it('الأسطوانة', () => {
    const out = run('cylinder', { r: '3', h: '7' })
    expect(res(out, 'geo.volume').raw).toBeCloseTo(197.9203, 3)
    expect(res(out, 'geo.lateral').raw).toBeCloseTo(131.9469, 3)
    expect(res(out, 'geo.surface').raw).toBeCloseTo(188.4956, 3)
  })

  it('المخروط: الارتفاع الجانبي والمحيط الجانبي', () => {
    const out = run('cone', { r: '3', h: '4' })
    expect(res(out, 'geo.slant').raw).toBeCloseTo(5, 9)
    expect(res(out, 'geo.volume').raw).toBeCloseTo(37.6991, 3)
    expect(res(out, 'geo.volume').unit).toBe('geo.unit3')
    expect(res(out, 'geo.surface').raw).toBeCloseTo(75.3982, 3)
  })

  it('الهرم: المساحة الجانبية والحرف', () => {
    const out = run('pyramid', { a: '4', h: '6' })
    expect(res(out, 'geo.volume').raw).toBe(32)
    expect(res(out, 'geo.baseArea').raw).toBe(16)
    expect(res(out, 'geo.slant').raw).toBeCloseTo(6.3246, 3)
    expect(res(out, 'geo.edge').raw).toBeCloseTo(6.6332, 3)
  })

  it('المنشور: قاعدة سداسية', () => {
    const out = run('prism', { n: '6', s: '3', h: '5' })
    expect(res(out, 'geo.baseArea').raw).toBeCloseTo(23.3827, 3)
    expect(res(out, 'geo.basePerimeter').raw).toBe(18)
    expect(res(out, 'geo.volume').raw).toBeCloseTo(116.9134, 3)
    expect(res(out, 'geo.surface').raw).toBeCloseTo(136.7654, 3)
  })

  it('المخروط الناقص', () => {
    const out = run('frustum', { r1: '5', r2: '2', h: '4' })
    expect(res(out, 'geo.slant').raw).toBeCloseTo(5, 9)
    expect(res(out, 'geo.volume').raw).toBeCloseTo(163.3628, 3)
    expect(res(out, 'geo.lateral').raw).toBeCloseTo(109.9557, 3)
    expect(res(out, 'geo.surface').raw).toBeCloseTo(201.0619, 3)
  })

  it('الأسطوانة المائلة: الارتفاع الجانبي والإزاحة', () => {
    const out = run('obliqueCylinder', { r: '3', h: '5', tilt: '60' })
    expect(res(out, 'geo.generatrix').raw).toBeCloseTo(5.7735, 3)
    expect(res(out, 'geo.offset').raw).toBeCloseTo(2.8868, 3)
    expect(res(out, 'geo.volume').raw).toBeCloseTo(141.3717, 3)
    expect(res(out, 'geo.lateral').raw).toBeCloseTo(108.8279, 3)
  })

  it('متوازي السطوح المائل: الارتفاع الفعلي والحجم', () => {
    const out = run('obliqueBox', { a: '6', b: '4', c: '5', tilt: '70' })
    expect(res(out, 'geo.vertHeight').raw).toBeCloseTo(4.6985, 3)
    expect(res(out, 'geo.offset').raw).toBeCloseTo(1.7101, 3)
    expect(res(out, 'geo.volume').raw).toBeCloseTo(112.7631, 3)
    expect(res(out, 'geo.lateral').raw).toBeCloseTo(96.3816, 3)
  })

  it('زاوية الميل يجب أن تكون بين 0 و 90', () => {
    expect(run('obliqueCylinder', { r: '3', h: '5', tilt: '90' }).error).toBe('geo.err.tilt')
    expect(run('obliqueCylinder', { r: '3', h: '5', tilt: '0' }).error).toBe('geo.err.tilt')
    expect(run('obliqueBox', { a: '6', b: '4', c: '5', tilt: '95' }).error).toBe('geo.err.tilt')
  })
})

describe('geoFormulas — العرض والملخّص', () => {
  it('gfmt يقرّب لمنزلتين ويستخدم الصيغة الأسّية للقيم المتطرّفة', () => {
    expect(gfmt(1 / 3)).toBe('0.33')
    expect(gfmt(2)).toBe('2')
    expect(gfmt(1234567890123456789)).toBe('1.23456789e18')
    expect(gfmt(1e-12)).toBe('1e-12')
  })

  it('disp يحترم زر التقريب والعناصر النصّية', () => {
    expect(disp({ raw: 5.6789 })).toBe('5.68')
    expect(disp({ raw: 5.6789, rounded: true })).toBe('6')
    expect(disp({ isText: true, value: 'geo.type.right' })).toBe('geo.type.right')
  })

  it('الملخّص يُعاد عند النجاح فقط (يُحفظ في السجلّ)', () => {
    expect(run('cube', { a: '3' }).summary).toBe('a=3')
    expect(run('cube', { a: '' }).summary).toBeUndefined()
    expect(run('cube', { a: '' }).results).toBeUndefined()
  })
})
