// اختبارات محرّك الحساب الأساسي (MathEngine)
import { describe, it, expect } from 'vitest'
import { MathEngine } from '../src/lib/core.js'

const ME = MathEngine
const ev = (s, o) => ME.evaluate(s, o)
const deg = { angle: 'deg' }
const codeOf = (s, o) => { try { ev(s, o); return null } catch (e) { return e.code } }

describe('MathEngine — الحساب الأساسي', () => {
  it('العمليات الأربع وأولوية العمليات', () => {
    expect(ev('12+8')).toBe(20)
    expect(ev('50-18')).toBe(32)
    expect(ev('7×6')).toBe(42)
    expect(ev('84÷4')).toBe(21)
    expect(ev('2+3*4')).toBe(14)
    expect(ev('(2+3)*4')).toBe(20)
  })

  it('الأسس والجذور والمضروب والإشارة', () => {
    expect(ev('2^10')).toBe(1024)
    expect(ev('2^3^2')).toBe(512)      // يمين-الارتباط
    expect(ev('-2^2')).toBe(-4)
    expect(ev('(-2)^2')).toBe(4)
    expect(ev('√49')).toBe(7)
    expect(ev('4!')).toBe(24)
    expect(ev('5!')).toBe(120)
  })

  it('دقة الفاصلة العائمة: 0.1 + 0.2 = 0.3', () => {
    expect(ev('0.1+0.2')).toBe(0.3)
  })

  it('النسبة المئوية الذكية', () => {
    expect(ev('200+10%')).toBe(220)
    expect(ev('200-10%')).toBe(180)
    expect(ev('50%')).toBe(0.5)
  })

  it('الضرب الضمني والثوابت', () => {
    expect(ev('2(3+4)')).toBe(14)
    expect(ev('3π')).toBeCloseTo(3 * Math.PI, 10)
    expect(ev('e')).toBeCloseTo(Math.E, 10)
  })
})

describe('MathEngine — الدوال', () => {
  it('المثلثية بالدرجات والراديان', () => {
    expect(ev('sin(30)', deg)).toBe(0.5)
    expect(ev('cos(60)', deg)).toBe(0.5)
    expect(ev('tan(45)', deg)).toBeCloseTo(1, 10)
    expect(ev('asin(0.5)', deg)).toBe(30)
    expect(ev('atan(1)', deg)).toBe(45)
  })

  it('اللوغاريتمات والأُسّ', () => {
    expect(ev('ln(e)')).toBe(1)
    expect(ev('log(100)')).toBe(2)
    expect(ev('log2(8)')).toBe(3)
    expect(ev('logb(8,2)')).toBe(3)
    expect(ev('exp(0)')).toBe(1)
  })

  it('الدوال متعددة الوسائط', () => {
    expect(ev('mod(17,5)')).toBe(2)
    expect(ev('gcd(12,18)')).toBe(6)
    expect(ev('lcm(4,6)')).toBe(12)
    expect(ev('nCr(5,2)')).toBe(10)
    expect(ev('nPr(5,2)')).toBe(20)
    expect(ev('abs(-9)')).toBe(9)
    expect(ev('round(3.6)')).toBe(4)
    expect(ev('floor(3.9)')).toBe(3)
    expect(ev('ceil(3.1)')).toBe(4)
    expect(ev('cbrt(27)')).toBe(3)
    expect(ev('root(8,3)')).toBe(2)
    expect(ev('max(3,9,5)')).toBe(9)
    expect(ev('min(3,9,5)')).toBe(3)
    expect(ev('avg(2,4,6)')).toBe(4)
  })
})

describe('MathEngine — الأخطاء', () => {
  it('القسمة على صفر', () => {
    expect(codeOf('1/0')).toBe('div0')
    expect(codeOf('mod(5,0)')).toBe('div0')
  })
  it('خارج نطاق التعريف', () => {
    expect(codeOf('ln(0)')).toBe('domain')
    expect(codeOf('√(-4)')).toBe('domain')
    expect(codeOf('log(-1)')).toBe('domain')
    expect(codeOf('tan(90)', deg)).toBe('domain')
  })
  it('خطأ صياغة', () => {
    expect(codeOf('2+')).toBe('syntax')
    expect(codeOf('sin()')).toBe('syntax')
    expect(codeOf('')).toBe('syntax')
  })
})

describe('MathEngine — الإحصاء الوصفي', () => {
  it('المتوسط والوسيط والمنوال', () => {
    expect(ev('avg(2,4,6)')).toBe(4)
    expect(ev('med(4,8,6)')).toBe(6)
    expect(ev('med(2,4,6,8)')).toBe(5)
    expect(ev('mode(2,3,3,4)')).toBe(3)
    expect(ev('mode(1,1,2,2,3)')).toBe(1) // أصغر الأمناط عند التعادل
  })

  it('«لا يوجد منوال» عند تفرّد كل القيم', () => {
    expect(codeOf('mode(1,2,3)')).toBe('mode')
  })

  it('الانحراف المعياري والتباين (مجتمع/عينة)', () => {
    expect(ev('std(2,4,6)')).toBeCloseTo(Math.sqrt(8 / 3), 10)
    expect(ev('sstd(2,4,6)')).toBeCloseTo(2, 10)
    expect(ev('var(2,4,6)')).toBeCloseTo(8 / 3, 10)
    expect(ev('svar(2,4,6)')).toBeCloseTo(4, 10)
  })

  it('الربعات بطريقة Tukey والمدى الربيعي', () => {
    expect(ev('q1(1,2,3,4,5)')).toBe(2)
    expect(ev('q3(1,2,3,4,5)')).toBe(4)
    expect(ev('iqr(1,2,3,4,5)')).toBe(2)
    expect(ev('q1(1,2,3,4)')).toBe(1.5)
    expect(ev('q3(1,2,3,4)')).toBe(3.5)
    expect(ev('mhinge(1,2,3,4,5)')).toBe(3)
  })

  it('المدى والمتوسطات والمتتاليات الحسابية', () => {
    expect(ev('range(1,2,3,4,5)')).toBe(4)
    expect(ev('midrange(1,2,3,4,5)')).toBe(3)
    expect(ev('gmean(2,8)')).toBe(4)
    expect(ev('hmean(2,6)')).toBe(3)
    expect(ev('a10(3,2)')).toBe(21)
    expect(ev('nth(3,2,10)')).toBe(21)
    expect(codeOf('gmean(-2,8)')).toBe('domain')
  })
})

describe('MathEngine — التفاضل والتكامل الخطوة الواحدة', () => {
  it('المشتقة عددياً', () => {
    expect(ev('diff(x^2, 3)')).toBeCloseTo(6, 6)
    expect(ev('diff(x^3, 2)')).toBeCloseTo(12, 4)
  })
  it('التكامل المحدود', () => {
    expect(ev('int(x, 0, 4)')).toBeCloseTo(8, 6)
    expect(ev('int(x^2, 0, 3)')).toBeCloseTo(9, 4)
  })
  it('المجموع والجداء', () => {
    expect(ev('sum(x, 1, 10)')).toBe(55)
    expect(ev('prod(x, 1, 5)')).toBe(120)
  })
})

describe('MathEngine — العرض (format)', () => {
  it('12 خانة معنوية وصيغة علمية للأطراف', () => {
    expect(ME.format(0)).toBe('0')
    expect(ME.format(0.1 + 0.2)).toBe('0.3')
    expect(ME.format(1 / 3)).toBe('0.333333333333')
    expect(ME.format(1e20)).toMatch(/e/)
  })
  it('يصدّر قائمة أسماء الدوال', () => {
    expect(ME.names).toContain('sin')
    expect(ME.names).toContain('med')
    expect(ME.names).toContain('mode')
  })
})
