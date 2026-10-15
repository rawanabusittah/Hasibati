// @vitest-environment happy-dom
// اختبار تكامل لصفحة الآلة الحاسبة كاملة:
// الكتابة ← النتيجة ← اللوحات ← نافذة الخطوات ← السجل المحلي ← اللغة.
// تستبدل طبقة قاعدة البيانات بخطاف حتى لا يخرج أي نداء شبكة أثناء الاختبار.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('../src/services/cloud.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, saveTool: vi.fn() }
})

import CalculatorView from '../src/views/CalculatorView.vue'
import { saveTool } from '../src/services/cloud'
import { setLang, t } from '../src/composables/i18n'

const LS_HIST = 'hp_calc_history'
const LS_ANG = 'hp_angle'

// نافذة الخطوات تُرسَل عبر Teleport إلى body — نعوّضها بعرض مضمّن داخل الغلاف
const MOUNT = { attachTo: document.body, global: { stubs: { teleport: true } } }

let w
const input = () => w.find('.bar-input')
const btns = () => w.findAll('.calc-btn')
const press = (label) => btns().find((b) => b.text().trim() === label)

// VTU يبني مفتاحاً بأحرف صغيرة (key: 'enter')، والمواصفة الحقيقية ترسل 'Enter'
const pressEnter = async () => {
  input().element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  await nextTick()
}

beforeEach(() => {
  setLang('ar')
  localStorage.clear()
  saveTool.mockClear()
  w = mount(CalculatorView, MOUNT)
})

afterEach(() => {
  w.unmount()
  document.body.innerHTML = ''
})

describe('CalculatorView — التكامل', () => {
  it('يعرض العنوان ونتيجة صفر ووحدة الزوايا الافتراضية', () => {
    expect(w.find('.section-title').text().trim()).toBe('الآلة الحاسبة العلمية')
    expect(w.find('.bar-result').text().trim()).toBe('0')
    expect(w.find('.bar-result').classes()).not.toContain('is-error')
    expect(w.find('.bar-mode').text().trim()).toBe('DEG')
    expect(w.find('.bar-mode').attributes('aria-pressed')).toBe('true')
    expect(w.find('.calc-buttons').attributes('aria-label')).toBe('لوحة الأرقام')
    expect(w.findAll('.cheat')).toHaveLength(4)
  })

  it('يحسب مباشرة أثناء الكتابة', async () => {
    await input().setValue('12+8')
    expect(input().element.value).toBe('12+8')
    expect(w.find('.bar-result').text().trim()).toBe('20')
    expect(w.find('.bar-result').classes()).not.toContain('is-error')
  })

  it('يعرض رسالة خطأ مترجمة بدل نتيجة خاطئة', async () => {
    await input().setValue('1/0')
    expect(w.find('.bar-result').text().trim()).toBe('لا يمكن القسمة على صفر')
    expect(w.find('.bar-result').text().trim()).toBe(t('calc.err.div0'))
    expect(w.find('.bar-result').classes()).toContain('is-error')
  })

  it('يبدل وحدة الزوايا ويحفظها ويعيد الحساب', async () => {
    await input().setValue('sin(30)')
    expect(w.find('.bar-result').text().trim()).toBe('0.5')

    await w.find('.bar-mode').trigger('click')
    expect(w.find('.bar-mode').text().trim()).toBe('RAD')
    expect(w.find('.bar-mode').attributes('aria-pressed')).toBe('false')
    expect(localStorage.getItem(LS_ANG)).toBe('rad')
    expect(w.find('.bar-result').text().trim()).not.toBe('0.5')
  })

  it('يُدرج من لوحة الأرقام ويحسب أثناء الضغط', async () => {
    await press('7').trigger('click')
    expect(input().element.value).toBe('7')
    expect(w.find('.bar-result').text().trim()).toBe('7')

    await press('+').trigger('click')
    await press('3').trigger('click')
    expect(input().element.value).toBe('7+3')
    expect(w.find('.bar-result').text().trim()).toBe('10')
  })

  it('زر ⌫ يحذف آخر حرف و AC يمسح الشريط والنتيجة', async () => {
    await press('1').trigger('click')
    await press('2').trigger('click')
    await press('+').trigger('click')
    expect(input().element.value).toBe('12+')

    await press('⌫').trigger('click')
    expect(input().element.value).toBe('12')

    await press('AC').trigger('click')
    expect(input().element.value).toBe('')
    expect(w.find('.bar-result').text().trim()).toBe('0')
  })

  it('يضغط = داخل الشريط فيسجل في السجل المحلي وفي الخدمة', async () => {
    await input().setValue('12+8')
    await pressEnter()

    expect(JSON.parse(localStorage.getItem(LS_HIST))).toEqual([{ e: '12+8', r: '20' }])
    expect(saveTool).toHaveBeenCalledWith('calculator', '12+8', '20')
    expect(w.findAll('.history-item')).toHaveLength(1)
    expect(w.find('.h-expr').text().trim()).toBe('12+8')
    expect(w.find('.h-res').text().trim()).toBe('20')
  })

  it('زر = من شريط الاختصارات يسجّل أيضاً', async () => {
    await input().setValue('7×6')
    // زر «=» في اللوحة ينفّذ =record وليس =eval
    await press('=').trigger('click')
    expect(JSON.parse(localStorage.getItem(LS_HIST))).toEqual([{ e: '7×6', r: '42' }])
    expect(saveTool).toHaveBeenCalledWith('calculator', '7×6', '42')
  })

  it('لا يسجّل عملية فيها خطأ', async () => {
    await input().setValue('1/0')
    await pressEnter()
    expect(localStorage.getItem(LS_HIST)).toBeNull()
    expect(saveTool).not.toHaveBeenCalled()
  })

  it('يفتح نافذة الخطوات ويعرض الخطوات ثم يغلقها من الزر', async () => {
    await input().setValue('12+8')
    await w.find('.bar-steps').trigger('click')

    const card = w.find('.steps-card')
    expect(card.exists()).toBe(true)
    expect(card.attributes('role')).toBe('dialog')
    expect(card.text()).toContain('الحل بالخطوات')
    expect(card.text()).toContain('12+8')
    expect(card.text()).toContain('20')
    expect(card.text()).toContain('النتيجة النهائية')

    await w.find('.steps-close').trigger('click')
    expect(w.find('.steps-card').exists()).toBe(false)
  })

  it('يفتح الخطوات بفراغ فيطلب تعبيراً صحيحاً', async () => {
    await w.find('.bar-steps').trigger('click')
    expect(w.find('.steps-msg').text().trim()).toBe('أدخل عملية صحيحة أولاً لعرض خطوات حلها.')
    expect(w.find('.steps-msg').text().trim()).toBe(t('calc.steps.empty'))
    await w.find('.steps-close').trigger('click')
    expect(w.find('.steps-card').exists()).toBe(false)
  })

  it('زر «جرّب المثال» يملأ الشريط ويسجّل النتيجة', async () => {
    const item = () => w.find('.ops-list[data-cat="arith"] .ops-item')
    await item().find('.ops-head').trigger('click')
    expect(item().find('.ops-head').attributes('aria-expanded')).toBe('true')
    expect(item().find('.ops-panel').attributes('hidden')).toBeUndefined()

    await item().findAll('.ops-act')[1].trigger('click')
    expect(input().element.value).toBe('12+8')
    expect(w.find('.bar-result').text().trim()).toBe('20')
    expect(item().find('.ex-res').text().trim()).toBe('20')
    expect(JSON.parse(localStorage.getItem(LS_HIST))).toEqual([{ e: '12+8', r: '20' }])
    expect(saveTool).toHaveBeenCalledWith('calculator', '12+8', '20')
  })

  it('زر «إدخال» يضيف صيغة العملية إلى الشريط', async () => {
    const item = () => w.find('.ops-list[data-cat="arith"] .ops-item')
    await item().find('.ops-head').trigger('click')
    await item().findAll('.ops-act')[0].trigger('click')
    expect(input().element.value).toBe('+')
    expect(w.find('.bar-result').text().trim()).toBe('تعبير غير صالح')
  })

  it('مثال قطبي يفعّل وضع الأعداد المركبة ويعرض r ∠ θ', async () => {
    const polar = () => w.find('.ops-list[data-cat="complex"] .ops-item:nth-child(2)')
    await polar().find('.ops-head').trigger('click')
    await polar().findAll('.ops-act')[1].trigger('click')

    expect(input().element.value).toBe('1+i')
    expect(w.find('.bar-result').text().trim()).toBe('1.4142 ∠ 45°')
  })

  it('تبويب السجل يعرض آخر ما سُجّل ويميّزه من اللوحات المفتوحة', async () => {
    await input().setValue('12+8')
    await pressEnter()

    const tabs = w.findAll('.ops-tab')
    await tabs[tabs.length - 1].trigger('click') // تبويب السجل
    expect(w.find('.ops-history').attributes('hidden')).toBeUndefined()

    await w.find('.history-clear').trigger('click')
    expect(w.findAll('.history-item')).toHaveLength(0)
    expect(w.find('.history-empty').text().trim()).toBe('لا توجد عمليات بعد')
    expect(JSON.parse(localStorage.getItem(LS_HIST))).toEqual([])
  })

  it('يستعيد السجل المحفوظ عند الإقلاع', () => {
    w.unmount()
    localStorage.setItem(LS_HIST, JSON.stringify([{ e: '2+2', r: '4' }]))
    w = mount(CalculatorView, MOUNT)

    expect(w.findAll('.history-item')).toHaveLength(1)
    expect(w.find('.h-expr').text().trim()).toBe('2+2')
    expect(w.find('.h-res').text().trim()).toBe('4')
  })

  it('يتبع اللغة في كل نصوص الصفحة', async () => {
    expect(w.find('.section-sub').text()).toContain('اكتب عمليتك')

    setLang('en')
    await nextTick()
    expect(w.find('.section-title').text().trim()).toBe('Scientific Calculator')
    expect(input().attributes('aria-label')).toBe('Expression')
    expect(w.find('.bar-steps').text().trim()).toBe('Show steps')
    expect(w.find('#cheat-head').text().trim()).toBe('Quick tips')
    expect(w.find('.calc-buttons').attributes('aria-label')).toBe('Number pad')

    setLang('ar')
    await nextTick()
    expect(w.find('.section-title').text().trim()).toBe('الآلة الحاسبة العلمية')
    expect(w.find('.bar-steps').text().trim()).toBe('استعرض الخطوات')
  })
})
