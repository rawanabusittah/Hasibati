// اختبارات محرّك الأعداد المركبة (complex)
import { describe, it, expect } from 'vitest'
import {
  evaluateComplex, polarOf, solveEquation, fmt, cz, deg360, degSigned
} from '../src/lib/complex.js'

const ev = s => evaluateComplex(s)
const codeOf = s => { try { ev(s); return null } catch (e) { return e.code } }
const near = (a, b) => Math.abs(a - b) < 1e-9
const hasRoot = (roots, re, im) => roots.some(r => near(r.re, re) && near(r.im, im))

describe('evaluateComplex — الحساب', () => {
  it('الجمع والطرح', () => {
    expect(ev('(3+2i)+(5-i)')).toEqual({ re: 8, im: 1 })
    expect(ev('(3+2i)-(5-i)')).toEqual({ re: -2, im: 3 })
  })

  it('الضرب والقسمة', () => {
    expect(ev('(2+3i)*(4-i)')).toEqual({ re: 11, im: 10 })
    expect(ev('1/(1+i)')).toEqual({ re: 0.5, im: -0.5 })
  })

  it('الأسس والقوى المعروفة', () => {
    expect(ev('i^2')).toEqual({ re: -1, im: 0 })
    expect(ev('i^4')).toEqual({ re: 1, im: 0 })
    expect(ev('(1+i)^2')).toEqual({ re: 0, im: 2 })
  })

  it('الضرب الضمني والثوابت', () => {
    expect(ev('2i')).toEqual({ re: 0, im: 2 })
    expect(ev('i(1+2i)')).toEqual({ re: -2, im: 1 })
  })

  it('القيمة المطلقة والدوال', () => {
    expect(ev('|3+4i|')).toEqual({ re: 5, im: 0 })
    expect(ev('conj(3+4i)')).toEqual({ re: 3, im: -4 })
    expect(ev('re(5-2i)')).toEqual({ re: 5, im: 0 })
    expect(ev('im(5-2i)')).toEqual({ re: -2, im: 0 })
    expect(ev('sqrt(-9)')).toEqual({ re: 0, im: 3 })
    expect(ev('√(-9)')).toEqual({ re: 0, im: 3 })
  })

  it('arg يرجع الزاوية بالراديان', () => {
    const a = ev('arg(i)')
    expect(a.im).toBe(0)
    expect(a.re).toBeCloseTo(Math.PI / 2, 10)
  })

  it('الأخطاء', () => {
    expect(codeOf('1/0')).toBe('div0')
    expect(codeOf('ln(0)')).toBe('domain')
    expect(codeOf('(1+')).toBe('syntax')
  })
})

describe('polarOf — الصورة القطبية', () => {
  it('1+i → r=√2 ، θ=45°', () => {
    const p = polarOf({ re: 1, im: 1 })
    expect(p.r).toBeCloseTo(Math.SQRT2, 10)
    expect(p.rad).toBeCloseTo(Math.PI / 4, 10)
    expect(p.deg).toBeCloseTo(45, 10)
  })

  it('-2+2i → θ=135°  ·  3-4i → r=5 ، θ≈-53.13°', () => {
    expect(polarOf({ re: -2, im: 2 }).deg).toBeCloseTo(135, 10)
    const p = polarOf({ re: 3, im: -4 })
    expect(p.r).toBeCloseTo(5, 10)
    expect(p.deg).toBeCloseTo(-53.13010235415598, 8)
  })
})

describe('درجات الزاوية', () => {
  it('deg360 يضبط ضمن [0،360)', () => {
    expect(deg360(-90)).toBe(270)
    expect(deg360(450)).toBe(90)
  })
  it('degSigned يضبط ضمن (−180،180]', () => {
    expect(degSigned(-90)).toBe(-90)
    expect(degSigned(270)).toBe(-90)
    expect(degSigned(45)).toBe(45)
  })
})

describe('solveEquation — جميع الحلول المركبة', () => {
  it('x^2 + 1 = 0 → ±i', () => {
    const r = solveEquation('x^2+1=0')
    expect(r.ok).toBe(true)
    expect(r.degree).toBe(2)
    expect(hasRoot(r.roots, 0, 1)).toBe(true)
    expect(hasRoot(r.roots, 0, -1)).toBe(true)
  })

  it('x^2 - 2x + 5 = 0 → 1 ± 2i', () => {
    const r = solveEquation('x^2-2x+5=0')
    expect(hasRoot(r.roots, 1, 2)).toBe(true)
    expect(hasRoot(r.roots, 1, -2)).toBe(true)
  })

  it('معادلة خطية', () => {
    const r = solveEquation('2x+4=0')
    expect(r.degree).toBe(1)
    expect(r.roots[0].re).toBeCloseTo(-2, 10)
    expect(r.roots[0].im).toBe(0)
  })

  it('x² = k سالبة', () => {
    const r = solveEquation('x^2=-9')
    expect(hasRoot(r.roots, 0, 3)).toBe(true)
    expect(hasRoot(r.roots, 0, -3)).toBe(true)
  })

  it('xⁿ = k ذات درجة عالية (جذور الوحدة)', () => {
    const r3 = solveEquation('x^3=8')
    expect(r3.degree).toBe(3)
    expect(r3.roots.length).toBe(3)
    expect(hasRoot(r3.roots, 2, 0)).toBe(true)

    const r4 = solveEquation('x^4=16')
    expect(r4.roots.length).toBe(4)
    expect(hasRoot(r4.roots, 2, 0)).toBe(true)
    expect(hasRoot(r4.roots, 0, 2)).toBe(true)
    expect(hasRoot(r4.roots, -2, 0)).toBe(true)
    expect(hasRoot(r4.roots, 0, -2)).toBe(true)
  })

  it('هوية وتناقض', () => {
    expect(solveEquation('5=5').special).toBe('all')
    expect(solveEquation('1=2').special).toBe('none')
  })

  it('الأخطاء', () => {
    expect(solveEquation('x^3+x=0').error).toBe('deg')
    expect(solveEquation('x^2+1=0=2').error).toBe('multi')
    expect(solveEquation('').error).toBe('syntax')
  })
})

describe('fmt — عرض العدد المركب', () => {
  it('يصيغ الأجزاء الحقيقية والتخيلية', () => {
    expect(fmt({ re: 3, im: 4 })).toBe('3 + 4i')
    expect(fmt({ re: 0, im: 1 })).toBe('i')
    expect(fmt({ re: 0, im: -1 })).toBe('−i')
    expect(fmt({ re: 5, im: 0 })).toBe('5')
    expect(fmt({ re: 1, im: -1 })).toBe('1 − i')
  })
  it('cz يوفر العمليات الأساسية', () => {
    expect(cz.mul({ re: 0, im: 1 }, { re: 0, im: 1 })).toEqual({ re: -1, im: 0 })
    expect(cz.conj({ re: 2, im: 3 })).toEqual({ re: 2, im: -3 })
  })
})
