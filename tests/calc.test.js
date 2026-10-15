// اختبارات محرّك الآلة الحاسبة (calcEngine) وبيانات لوحة الأرقام (calcPad).
// المنطق نقي: يستقبل النص + السياق ({ angle, cxMode }) ويعيد نتيجة موصوفة،
// لذلك لا يحتاج تركيب أي مكوّن Vue.
import { describe, it, expect } from 'vitest'
import {
  STATS_FNS, isComplexExpr, looksLikeEquation, d2, shortNum,
  errText, medOfL, statMeasures, ineqSolutionText, cxEvaluate,
  cxResultText, evaluate, exampleResult, buildSteps
} from '../src/lib/calcEngine.js'
import { buildPad } from '../src/lib/calcPad.js'

// مترجم مزيّف: يعيد المفتاح نفسه ليتسنّى مقارنة مفاتيح الأخطاء
const t = (k) => k

describe('calcEngine — دوال مساعدة', () => {
  it('isComplexExpr يلتقط الوحدة التخيلية والجذر السالب فقط', () => {
    expect(isComplexExpr('3+2i')).toBe(true)
    expect(isComplexExpr('i^10')).toBe(true)
    expect(isComplexExpr('sqrt(-4)')).toBe(true)
    expect(isComplexExpr('√-9')).toBe(true)
    expect(isComplexExpr('12+8')).toBe(false)
    expect(isComplexExpr('int(x^2,0,3)')).toBe(false) // حرف i داخل اسم دالة
  })

  it('looksLikeEquation يلتقط x أو الأس أو علامة يساوي', () => {
    expect(looksLikeEquation('x^2-2x+5=0')).toBe(true)
    expect(looksLikeEquation('3^x=81')).toBe(true)
    expect(looksLikeEquation('12+8')).toBe(false)
    expect(looksLikeEquation('5!')).toBe(false)
  })

  it('d2 يقرّب لمنزلتين وshortNum لأربع منازل', () => {
    expect(d2(53.130102)).toBe('53.13')
    expect(d2(45)).toBe('45')
    expect(shortNum(1.41421356)).toBe('1.4142')
    expect(shortNum(2)).toBe('2')
  })

  it('errText يترجم الرموز ويفرّق بين multi في المتراجحات والمعادلات', () => {
    expect(errText('div0', t)).toBe('calc.err.div0')
    expect(errText('domain', t)).toBe('calc.err.domain')
    expect(errText('multi', t, 'solve')).toBe('calc.cx.multi')
    expect(errText('multi', t, 'ineq')).toBe('calc.ineq.multi')
    expect(errText('nonlin', t)).toBe('calc.ineq.nonlin')
    expect(errText('deg', t)).toBe('calc.cx.deg')
    expect(errText('mode', t)).toBe('calc.stats.nomode')
    expect(errText('غير-معروف', t)).toBe('calc.err.syntax')
  })

  it('يحتوي STATS_FNS على الدوال الإحصائية المعروفة', () => {
    for (const fn of ['avg', 'med', 'mode', 'std', 'q1', 'q3', 'iqr', 'max', 'min', 'gmean', 'hmean']) {
      expect(STATS_FNS.has(fn)).toBe(true)
    }
    expect(STATS_FNS.has('sin')).toBe(false)
  })
})

describe('calcEngine — الإحصاء الوصفي', () => {
  it('medOfL يعمل للعدد الفردي والزوجي', () => {
    expect(medOfL([1, 2, 3])).toBe(2)
    expect(medOfL([1, 2, 3, 4])).toBe(2.5)
  })

  it('statMeasures يحسب كل المقاييس لمجموعة فردية', () => {
    const m = statMeasures([4, 8, 6])
    expect(m.n).toBe(3)
    expect(m.sum).toBe(18)
    expect(m.mean).toBe(6)
    expect(m.median).toBe(6)
    expect(m.q1).toBe(5)
    expect(m.q3).toBe(7)
    expect(m.iqr).toBe(2)
    expect(m.varPop).toBeCloseTo(8 / 3)
    expect(m.varSam).toBe(4)
    expect(m.stdev).toBeCloseTo(Math.sqrt(8 / 3))
    expect(m.sstd).toBe(2)
    expect(m.range).toBe(4)
    expect(m.midrange).toBe(6)
    expect(m.midhinge).toBe(6)
    expect(m.min).toBe(4)
    expect(m.max).toBe(8)
    expect(m.modes).toEqual([]) // لا منوال: كل قيمة متكررة مرة واحدة
    expect(m.gmean).toBeCloseTo(Math.cbrt(192))
    expect(m.hmean).toBeCloseTo(3 / (1 / 4 + 1 / 6 + 1 / 8))
  })

  it('statMeasures يحدد المنوال ويترك المتوسطين الهندسي والتوافقي للقيم غير الموجبة', () => {
    expect(statMeasures([1, 2, 2, 3]).modes).toEqual([2])
    expect(statMeasures([0, 2]).gmean).toBeNull()
    expect(statMeasures([0, 2]).hmean).toBeNull()
    expect(statMeasures([2]).sstd).toBeNull() // عينة بحجم 1
  })

  it('ineqSolutionText يترجم حالتَي الكل/لا حل', () => {
    expect(ineqSolutionText({ special: 'all' }, t)).toBe('calc.ineq.all')
    expect(ineqSolutionText({ special: 'none' }, t)).toBe('calc.ineq.none')
    expect(ineqSolutionText({ special: null, solution: 'x < 3' }, t)).toBe('x < 3')
  })
})

describe('calcEngine — الأعداد المركبة', () => {
  it('cxEvaluate يحسب تعبيراً مركباً', () => {
    const r = cxEvaluate('(3+2i)+(5-i)')
    expect(r.ok).toBe(true)
    expect(r.data.mode).toBe('eval')
    expect(r.data.z.re).toBe(8)
    expect(r.data.z.im).toBe(1)
    expect(r.data.p.r).toBeCloseTo(Math.sqrt(65))
  })

  it('cxEvaluate في وضع القطبية يعيد المقياس والزاوية', () => {
    const r = cxEvaluate('1+i', 'polar')
    expect(r.ok).toBe(true)
    expect(r.data.p.deg).toBeCloseTo(45)
  })

  it('cxEvaluate في وضع الحل يحل معادلة من الدرجة الثانية', () => {
    const r = cxEvaluate('x^2-2x+5=0', 'solve')
    expect(r.ok).toBe(true)
    expect(r.data.mode).toBe('solve')
    expect(r.data.degree).toBe(2)
    expect(r.data.roots).toHaveLength(2)
    expect(r.data.special).toBeNull()
  })

  it('cxEvaluate يعيد { ok:false, error } للإدخال غير الصالح', () => {
    const r = cxEvaluate('oops+')
    expect(r.ok).toBe(false)
    expect(typeof r.error).toBe('string')
  })

  it('cxResultText يصوغ النتيجة حسب الوضع', () => {
    expect(cxResultText({ mode: 'eval', z: { re: 8, im: 1 } }, t)).toBe('8 + i')
    expect(cxResultText({ mode: 'polar', p: { r: 1.41421356, deg: 45 } }, t)).toBe('1.4142 ∠ 45°')
    expect(cxResultText({ mode: 'degree', p: { r: 1, deg: 53.130102 } }, t)).toBe('53.13°')
    expect(cxResultText({ mode: 'solve', special: 'all', roots: [] }, t)).toBe('calc.ineq.all')
    expect(cxResultText({ mode: 'solve', special: 'none', roots: [] }, t)).toBe('calc.ineq.none')
    expect(cxResultText({ mode: 'solve', special: null, roots: [{ re: 1, im: 2 }, { re: 1, im: -2 }] }, t))
      .toBe('1 + 2i ، 1 − 2i')
  })
})

describe('calcEngine — التقييم العام', () => {
  it('يعيد { value } للعمليات العادية', () => {
    expect(evaluate('12+8')).toEqual({ value: 20 })
    expect(evaluate('2π * 3').value).toBeCloseTo(6 * Math.PI)
  })

  it('يحترم وحدة الزوايا', () => {
    expect(evaluate('sin(30)', { angle: 'deg' }).value).toBeCloseTo(0.5, 10)
    expect(evaluate('sin(30)', { angle: 'rad' }).value).toBeCloseTo(Math.sin(30), 10)
  })

  it('يعيد { error } لأخطاء الحساب', () => {
    expect(evaluate('1/0')).toEqual({ error: 'div0' })
    expect(evaluate('((')).toEqual({ error: 'syntax' })
  })

  it('يوجّه التعبيرات المركبة إلى { cx }', () => {
    const r = evaluate('3+4i')
    expect(r.cx.mode).toBe('eval')
    expect(r.cx.z.re).toBe(3)
    expect(r.cx.z.im).toBe(4)
  })

  it('يحل المعادلات في وضع solve', () => {
    const r = evaluate('x^2-2x+5=0', { cxMode: 'solve' })
    expect(r.cx.mode).toBe('solve')
    expect(r.cx.roots).toHaveLength(2)
  })

  it('يوجّه المتراجحات إلى { ineq }', () => {
    const r = evaluate('3-2(1-x)≤2')
    expect(r.ineq).toBeTruthy()
    expect(typeof r.ineq.solution).toBe('string')
  })

  it('في وضع polar يُعرض العدد الحقيقي بصيغة قطبية', () => {
    const r = evaluate('12+8', { cxMode: 'polar' })
    expect(r.cx.mode).toBe('polar')
    expect(cxResultText(r.cx, t)).toBe('20 ∠ 0°')
  })

  it('يرجع للتقويم العادي إن رفض محلّل الأعداد المركبة التعبير', () => {
    // sin ليست ضمن دوال المحلل المركب، فيُستخدم محرّك الرياضيات العادي
    const r = evaluate('sin(30)', { cxMode: 'polar' })
    expect(r.value).toBeCloseTo(0.5, 10)
  })
})

describe('calcEngine — نتيجة أمثلة العمليات', () => {
  it('يُرجع النتيجة نصًّا للعمليات العادية', () => {
    expect(exampleResult('12+8')).toBe('20')
    expect(exampleResult('3+4i')).toBe('3 + 4i')
  })

  it('يُرجع شرطة للإدخال غير الصالح', () => {
    expect(exampleResult('bad(')).toBe('—')
  })

  it('يتبع وضع العملية (m) لا الوضع الحالي فقط', () => {
    expect(exampleResult('1+i', 'polar')).toContain('∠')
    expect(exampleResult('x^2-2x+5=0', 'solve')).toContain('i')
    // نتيجة مثال المتراجحة هي نص حلّها نفسه
    expect(exampleResult('3-2(1-x)≤2')).toBe(evaluate('3-2(1-x)≤2').ineq.solution)
  })
})

describe('calcEngine — بناء خطوات الحل', () => {
  it('يعيد خطأ empty لفراغ الإدخال', () => {
    expect(buildSteps('')).toEqual({ data: null, error: 'empty' })
    expect(buildSteps('   ')).toEqual({ data: null, error: 'empty' })
  })

  it('يبني خطوات عملية عادية بلا type خاص', () => {
    const r = buildSteps('12+8')
    expect(r.error).toBe('')
    expect(r.data.original).toBe('12+8')
    expect(r.data.final).toBe('20')
    expect(Array.isArray(r.data.steps)).toBe(true)
    expect(r.data.type).toBeUndefined() // المسار العام في النافذة
  })

  it('يوسم المتراجحة بـ type=ineq ويعيد الحل', () => {
    const r = buildSteps('3-2(1-x)≤2')
    expect(r.error).toBe('')
    expect(r.data.type).toBe('ineq')
    expect(typeof r.data.solution).toBe('string')
  })

  it('يبني تقريراً إحصائياً كاملاً للاستدعاء الإحصائي', () => {
    const r = buildSteps('med(4,8,6)')
    expect(r.error).toBe('')
    expect(r.data.type).toBe('stats')
    expect(r.data.fn).toBe('med')
    expect(r.data.final).toBe(6)
    expect(r.data.m.median).toBe(6)
  })

  it('يوسم التعبير المركب بـ type=complex', () => {
    const r = buildSteps('i^10')
    expect(r.error).toBe('')
    expect(r.data.type).toBe('complex')
    expect(r.data.cx.mode).toBe('eval')
  })

  it('يحل المعادلة المركبة داخل نافذة الخطوات', () => {
    const r = buildSteps('x^2-2x+5=0', { cxMode: 'solve' })
    expect(r.error).toBe('')
    expect(r.data.type).toBe('complex')
    expect(r.data.cx.mode).toBe('solve')
    expect(r.data.cx.roots).toHaveLength(2)
  })

  it('يعيد مفاتيح أخطاء قابلة للترجمة', () => {
    expect(buildSteps('1/0').error).toBe('calc.err.div0')
    expect(buildSteps('((').error).toBe('calc.err.syntax')
    expect(buildSteps('x<1<2').error).toBe('calc.ineq.multi')
  })
})

describe('calcPad — لوحة الأرقام', () => {
  const pad = buildPad(t)

  it('تحتوي 30 زراً بترتيب يبدأ بـ AC وينتهي بـ =', () => {
    expect(pad).toHaveLength(30)
    expect(pad[0]).toMatchObject({ act: 'clear', label: 'AC' })
    expect(pad[29]).toMatchObject({ act: 'equals', label: '=' })
  })

  it('كل زر مكتمل التعريف وكل إدراج له قيمة', () => {
    for (const b of pad) {
      expect(typeof b.act).toBe('string')
      expect(typeof b.label).toBe('string')
      expect(b.label.length).toBeGreaterThan(0)
      if (b.act === 'append') expect(typeof b.val).toBe('string')
    }
  })

  it('تحتوي الأرقام والعمليات والإشارات المطلوبة', () => {
    const labels = pad.map((b) => b.label)
    for (const l of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '÷', '×', '−', '+', 'π', 'i', '≤', '≥', '<', '>', '⌫', '±']) {
      expect(labels).toContain(l)
    }
  })

  it('تلميحات قارئ الشاشة ثنائية اللغة حين تُوجد', () => {
    const ac = pad[0]
    expect(Array.isArray(ac.aria)).toBe(true)
    expect(ac.aria).toHaveLength(1) // L المزيّف يعيد مفتاحاً واحداً
  })
})
