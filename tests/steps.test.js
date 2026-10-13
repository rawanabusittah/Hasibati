// اختبارات محرّك خطوات الحل (steps) — ويجب أن تطابق نتيجة MathEngine
import { describe, it, expect } from 'vitest'
import { solveSteps } from '../src/lib/steps.js'
import { MathEngine } from '../src/lib/core.js'

const ME = MathEngine
const deg = { angle: 'deg' }

describe('solveSteps — تطابق النتيجة النهائية مع المحرّك', () => {
  const cases = ['12+8', '2+3*4', '(2+3)*4', '200+10%', '0.1+0.2', '2^3^2', '4!', '√49', 'med(4,8,6)']
  it.each(cases)('«%s»', (src) => {
    const r = solveSteps(src)
    expect(r.ok).toBe(true)
    expect(r.final).toBe(ME.format(ME.evaluate(src)))
  })

  it('المثلثية بالدرجات', () => {
    const r = solveSteps('sin(30)', deg)
    expect(r.ok).toBe(true)
    expect(r.final).toBe('0.5')
  })
})

describe('solveSteps — شكل الخطوات', () => {
  it('يعيد خطوات مرتّبة بمقاطع ونتائج', () => {
    const r = solveSteps('12+8')
    expect(r.ok).toBe(true)
    expect(Array.isArray(r.steps)).toBe(true)
    expect(r.steps.length).toBeGreaterThan(0)
    for (const s of r.steps) {
      expect(s).toHaveProperty('sub')
      expect(s).toHaveProperty('res')
      expect(s).toHaveProperty('kind')
    }
  })

  it('يتعامل مع نداء دالة إحصائية كخطوة واحدة', () => {
    const r = solveSteps('med(4,8,6)')
    expect(r.ok).toBe(true)
    expect(r.final).toBe('6')
  })
})

describe('solveSteps — الأخطاء', () => {
  it('يمرّر رمز الخطأ من المحرّك', () => {
    expect(solveSteps('1/0').ok).toBe(false)
    expect(solveSteps('1/0').error).toBe('div0')
    expect(solveSteps('2+').error).toBe('syntax')
    expect(solveSteps('ln(0)').error).toBe('domain')
  })
})
