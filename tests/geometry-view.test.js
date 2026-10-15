// @vitest-environment happy-dom
// اختبار تكامل لصفحة الهندسة: شريط الأشكال ← اللوحات ← الحساب ← النتائج ← اللغة.
// تستبدل طبقة قاعدة البيانات بخطاف حتى لا يخرج أي نداء شبكة أثناء الاختبار.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock('../src/services/cloud.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, saveTool: vi.fn() }
})

import GeometryView from '../src/views/GeometryView.vue'
import { saveTool } from '../src/services/cloud'
import { setLang, t } from '../src/composables/i18n'
import { SHAPES } from '../src/lib/geoShapes'

let w
const tabs = () => w.findAll('.geo-tab')
const tab = (label) => tabs().find((b) => b.text().trim() === label)
const activePanel = () => w.find('.geo-panel.active')
const activeRes = () => w.find('.geo-res.active')
const calcBtn = () => w.find('.geo-panel.active .btn-primary')
const field = (id) => w.find('#' + id)

beforeEach(() => {
  setLang('ar')
  localStorage.clear()
  saveTool.mockClear()
  w = mount(GeometryView, { attachTo: document.body })
})

afterEach(() => {
  w.unmount()
  document.body.innerHTML = ''
})

describe('GeometryView — التكامل', () => {
  it('يعرض العنوان و22 شكلاً مع لوحة ونتيجة لكل شكل', () => {
    expect(SHAPES).toHaveLength(22)
    expect(w.find('.section-title').text().trim()).toBe('حساب الأشكال الهندسية')
    expect(tabs()).toHaveLength(22)
    expect(w.findAll('.geo-panel')).toHaveLength(22)
    expect(w.findAll('.geo-res')).toHaveLength(22)
    expect(w.findAll('.geo-tab')).toHaveLength(SHAPES.length)
    expect(w.find('.shape-bar').attributes('aria-label')).toBe('الأشكال الهندسية')
  })

  it('زر المزيد خارج شريط الأشكال (أول السطر) ويبدّل الطيّ', () => {
    expect(w.find('.shape-zone > .geo-more').exists()).toBe(true)
    expect(w.find('.shape-bar .geo-more').exists()).toBe(false)

    expect(w.find('.shape-bar').classes()).toContain('is-collapsed')
    expect(w.find('.geo-more').text().trim()).toBe('المزيد ▼')
    expect(w.find('.geo-more').attributes('aria-expanded')).toBe('false')

    w.find('.geo-more').trigger('click')
    return nextTick().then(() => {
      expect(w.find('.shape-bar').classes()).not.toContain('is-collapsed')
      expect(w.find('.geo-more').text().trim()).toBe('أقل ▲')
      expect(w.find('.geo-more').attributes('aria-expanded')).toBe('true')
    })
  })

  it('لوحة واحدة نشطة ونتيجتها فقط', () => {
    expect(w.findAll('.geo-panel.active')).toHaveLength(1)
    expect(activePanel().attributes('id')).toBe('circle-panel')
    expect(activePanel().attributes('aria-label')).toBe('حساب الدائرة')
    expect(w.findAll('.geo-res.active')).toHaveLength(1)
    expect(activeRes().attributes('data-res-for')).toBe('circle-panel')
    expect(w.find('.geo-tab.active').text().trim()).toBe('الدائرة')
    expect(w.find('.geo-tab.active').attributes('aria-selected')).toBe('true')
    expect(w.find('#circle-r').exists()).toBe(true)
  })

  it('النقر على شكل ينقل اللوحة النشطة والنتيجة معه', async () => {
    await tab('المستطيل').trigger('click')
    expect(w.findAll('.geo-panel.active')).toHaveLength(1)
    expect(activePanel().attributes('id')).toBe('rect-panel')
    expect(activePanel().attributes('aria-label')).toBe('حساب المستطيل')
    expect(activeRes().attributes('data-res-for')).toBe('rect-panel')
    expect(w.find('.geo-tab.active').text().trim()).toBe('المستطيل')
    expect(field('rect-w').exists()).toBe(true)
  })

  it('يحسب الدائرة ويعرض النتائج مع المعادلة ويحفظها', async () => {
    // قبل الحساب: حالة الانتظار
    expect(activeRes().find('.res-empty').text().trim()).toBe('اكتب نصف القطر وستظهر النتائج هنا.')
    expect(activeRes().find('.res-empty').text().trim()).toBe(t('geo.empty.circle'))
    expect(activeRes().find('.geo-result-item').exists()).toBe(false)

    await field('circle-r').setValue('3')
    await calcBtn().trigger('click')

    expect(activeRes().findAll('.geo-result-item')).toHaveLength(3)
    expect(activeRes().find('.geo-label').text().trim()).toBe('المساحة')
    expect(activeRes().find('.geo-val').text()).toContain('28.27')
    expect(activeRes().find('.geo-val').text()).toContain('وحدة²')
    expect(activeRes().find('.geo-formula').text().trim()).toBe('A = π × r²')
    expect(activeRes().find('.res-empty').exists()).toBe(false)
    expect(activePanel().find('.error-msg').text().trim()).toBe('')
    expect(saveTool).toHaveBeenCalledWith('geometry', 'circle', 'r=3')
  })

  it('زر التقريب يبدّل العرض بين الكسور والأعداد الصحيحة', async () => {
    await field('circle-r').setValue('3')
    await calcBtn().trigger('click')

    const round = () => activeRes().find('.geo-round')
    expect(round().attributes('aria-pressed')).toBe('false')
    expect(round().text().trim()).toBe('≈ تقريب')
    expect(activeRes().find('.geo-val').text()).toContain('28.27')

    await round().trigger('click')
    expect(round().attributes('aria-pressed')).toBe('true')
    expect(round().text().trim()).toBe('↩ إرجاع الكسور')
    expect(activeRes().find('.geo-val').text()).toContain('28')
    expect(activeRes().find('.geo-val').text()).not.toContain('28.27')

    await round().trigger('click')
    expect(activeRes().find('.geo-val').text()).toContain('28.27')
  })

  it('يعرض خطأ التحقق ويرجع اللوحة إلى حالة الانتظار', async () => {
    await field('circle-r').setValue('-2')
    await calcBtn().trigger('click')

    expect(activePanel().find('.error-msg').text().trim()).toBe('الرجاء إدخال نصف قطر صحيح أكبر من صفر')
    expect(activePanel().find('.error-msg').text().trim()).toBe(t('geo.err.r'))
    expect(activePanel().find('.error-msg').attributes('role')).toBe('alert')
    expect(activeRes().find('.geo-result-item').exists()).toBe(false)
    expect(activeRes().find('.res-empty').text().trim()).toBe(t('geo.empty.circle'))
    expect(saveTool).not.toHaveBeenCalled()
  })

  it('مفتاح Enter داخل الحقل يحسب دون زر', async () => {
    await field('circle-r').setValue('2')
    await field('circle-r').trigger('keydown.enter')
    expect(activeRes().findAll('.geo-result-item')).toHaveLength(3)
    expect(activeRes().find('.geo-val').text()).toContain('12.57')
  })

  it('يحسب المثلث ويصنّفه مع عرض الحقول الصحيحة', async () => {
    await tab('المثلث').trigger('click')
    expect(field('triangle-a').attributes('inputmode')).toBe('decimal')
    expect(field('triangle-a').attributes('aria-describedby')).toBe('tri-error')

    await field('triangle-a').setValue('3')
    await field('triangle-b').setValue('4')
    await field('triangle-c').setValue('5')
    await calcBtn().trigger('click')

    expect(activeRes().findAll('.geo-result-item')).toHaveLength(6)
    expect(activeRes().text()).toContain('قائم الزاوية')
    expect(activeRes().text()).toContain('P = a + b + c')
    expect(saveTool).toHaveBeenCalledWith('geometry', 'triangle', 'a=3, b=4, c=5')
  })

  it('أضلاع لا تكوّن مثلثاً تعرض رسالة الخطأ', async () => {
    await tab('المثلث').trigger('click')
    await field('triangle-a').setValue('1')
    await field('triangle-b').setValue('2')
    await field('triangle-c').setValue('5')
    await calcBtn().trigger('click')

    expect(activePanel().find('.error-msg').text().trim()).toBe(t('geo.err.tri'))
    expect(activeRes().find('.geo-result-item').exists()).toBe(false)
    expect(saveTool).not.toHaveBeenCalled()
  })

  it('حقل عدد الأضلاع خطوة صحيحة وعدد صحيح', async () => {
    await tab('المضلع المنتظم').trigger('click')

    const n = field('polygon-n')
    expect(n.attributes('min')).toBe('3')
    expect(n.attributes('step')).toBe('1')
    expect(n.attributes('inputmode')).toBe('numeric')

    await n.setValue('5')
    await field('polygon-s').setValue('2')
    await calcBtn().trigger('click')
    expect(activeRes().find('.geo-result-item').exists()).toBe(true)
  })

  it('يتبع اللغة في التبويب واللوحة والنتيجة', async () => {
    setLang('en')
    await nextTick()

    expect(w.find('.section-title').text().trim()).toBe('Geometry Calculator')
    expect(tab('Circle').text().trim()).toBe('Circle')
    expect(activePanel().attributes('aria-label')).toBe('Circle calculator')
    expect(activeRes().find('.res-empty').text().trim()).toBe('Type the radius and the results appear here.')
    expect(w.find('.geo-more').text().trim()).toBe('More ▼')
    expect(calcBtn().text().trim()).toBe('Calculate circle')

    setLang('ar')
    await nextTick()
    expect(w.find('.section-title').text().trim()).toBe('حساب الأشكال الهندسية')
    expect(w.find('.geo-more').text().trim()).toBe('المزيد ▼')
  })

  it('كل الأشكال الـ22 تعرض اللوحات الحقول وزر الحساب', () => {
    for (const sh of SHAPES) {
      const panel = w.find('#' + sh.id + '-panel')
      expect(panel.exists(), `لوحة ${sh.id} مفقودة`).toBe(true)
      expect(panel.find('.btn-primary').exists(), `زر ${sh.id} مفقود`).toBe(true)
      for (const f of sh.fields) {
        expect(panel.find(`#${sh.id}-${f.key}`).exists(), `حقل ${sh.id}.${f.key} مفقود`).toBe(true)
      }
      expect(panel.find(`#${sh.errorId}`).exists(), `مربع خطأ ${sh.id} مفقود`).toBe(true)
      expect(w.find(`[data-res-for="${sh.id}-panel"]`).exists(), `نتيجة ${sh.id} مفقودة`).toBe(true)
    }
  })
})
