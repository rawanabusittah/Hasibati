// اختبارات محلّل المتراجحات الخطية (ineq)
import { describe, it, expect } from 'vitest'
import { solveInequality, isInequality } from '../src/lib/ineq.js'

describe('isInequality', () => {
  it('يكتشف رموز المتراجحات', () => {
    expect(isInequality('3-2(1-x)≤2')).toBe(true)
    expect(isInequality('8x<=-32')).toBe(true)
    expect(isInequality('x > 5')).toBe(true)
    expect(isInequality('12+8')).toBe(false)
    expect(isInequality('x^2+1=0')).toBe(false)
  })
})

describe('solveInequality — الحل الخطي', () => {
  it('يحل 8x ≤ -32', () => {
    const r = solveInequality('8x<=-32')
    expect(r.ok).toBe(true)
    expect(r.solution).toBe('x ≤ −4')
  })

  it('يحل -x < -x + 7(x-2)', () => {
    const r = solveInequality('-x<-x+7(x-2)')
    expect(r.ok).toBe(true)
    expect(r.solution).toBe('x > 2')
  })

  it('يقلب الاتجاه عند القسمة على عدد سالب', () => {
    const r = solveInequality('-2x >= 6')
    expect(r.ok).toBe(true)
    expect(r.solution).toBe('x ≤ −3')
  })

  it('يحل 3 - 2(1-x) ≤ 2', () => {
    const r = solveInequality('3-2(1-x)≤2')
    expect(r.ok).toBe(true)
    expect(r.solution).toBe('x ≤ 1/2')
  })

  it('يوفّر خطوات مرتبة', () => {
    const r = solveInequality('8x<=-32')
    expect(Array.isArray(r.steps)).toBe(true)
    expect(r.steps.length).toBeGreaterThan(0)
    expect(r.special).toBe(null)
  })
})

describe('solveInequality — الحالات الخاصة والأخطاء', () => {
  it('متراجحة صحيحة دائماً → جميع الأعداد', () => {
    const r = solveInequality('3<=5')
    expect(r.ok).toBe(true)
    expect(r.special).toBe('all')
  })

  it('متراجحة خاطئة دائماً → لا حل', () => {
    const r = solveInequality('2>5')
    expect(r.ok).toBe(true)
    expect(r.special).toBe('none')
  })

  it('يرفض غير الخطية', () => {
    expect(solveInequality('x^2<4').error).toBe('nonlin')
  })

  it('يرفض متراجحتين في تعبير واحد', () => {
    expect(solveInequality('x<1<2').error).toBe('multi')
  })

  it('يرفض تعبيراً بلا متراجحة', () => {
    expect(solveInequality('12+8').error).toBe('syntax')
  })
})
