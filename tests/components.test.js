// @vitest-environment happy-dom
// اختبارات مكوّنات العرض: تُركّب المكوّن فعليًا وتتحقق من الخَرْج والأحداث الصادرة.
// نحتاج بيئة DOM (localStorage + التلميحات) لذلك happy-dom.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { buildPad } from '../src/lib/calcPad'
import { CATS, buildOps, buildCatLabels } from '../src/lib/calcOps'
import { SHAPES, emptyValues } from '../src/lib/geoShapes'
import { L, setLang } from '../src/composables/i18n'
import { buildSteps } from '../src/lib/calcEngine'
import CalcKeypad from '../src/components/CalcKeypad.vue'
import CalcCheatSheet from '../src/components/CalcCheatSheet.vue'
import CalcOpsPanel from '../src/components/CalcOpsPanel.vue'
import CalcStepsDialog from '../src/components/CalcStepsDialog.vue'
import GeoFigure from '../src/components/GeoFigure.vue'
import GeoPanel from '../src/components/GeoPanel.vue'
import AppNav from '../src/components/AppNav.vue'

beforeEach(() => setLang('ar'))
afterEach(() => { document.body.innerHTML = '' })

describe('CalcKeypad — لوحة الأرقام', () => {
  const mountPad = () => mount(CalcKeypad, { props: { pad: buildPad(L) } })

  it('يرسم الأزرار الثلاثين داخل مجموعة معنونة', () => {
    const w = mountPad()
    expect(w.findAll('.calc-btn')).toHaveLength(30)
    expect(w.find('.calc-buttons').attributes('role')).toBe('group')
    expect(w.find('.calc-buttons').attributes('aria-label')).toBe('لوحة الأرقام')
  })

  it('يرفع press مع الإجراء والقيمة', async () => {
    const w = mountPad()
    await w.findAll('.calc-btn')[4].trigger('click') // الزر '7'
    expect(w.emitted('press')[0]).toEqual(['append', '7'])
  })

  it('يمرّر تلميح قارئ الشاشة من البيانات', () => {
    const w = mountPad()
    const ac = w.findAll('.calc-btn')[0]
    expect(ac.text()).toBe('AC')
    expect(ac.attributes('aria-label')).toBe('مسح الكل (AC)')
    // أزرار الأرقام بلا aria-label (النص كافٍ)
    expect(w.findAll('.calc-btn')[4].attributes('aria-label')).toBeUndefined()
  })
})

describe('CalcCheatSheet — نصائح سريعة', () => {
  it('يعرض أربع بطاقات مع عنوان معنون', () => {
    const w = mount(CalcCheatSheet)
    expect(w.findAll('.cheat')).toHaveLength(4)
    expect(w.find('#cheat-head').text()).toBe('نصائح سريعة')
    expect(w.find('.cheat-sec').attributes('aria-labelledby')).toBe('cheat-head')
    expect(w.findAll('.cheat-icon').map((e) => e.text())).toEqual(['%', 'πx', '∫', '⚠'])
  })

  it('يتبع اللغة فورًا', async () => {
    const w = mount(CalcCheatSheet)
    setLang('en'); await nextTick()
    expect(w.find('#cheat-head').text()).toBe('Quick tips')
    expect(w.findAll('.cheat h3')[1].text()).toBe('Implicit multiplication')
    setLang('ar'); await nextTick()
    expect(w.find('#cheat-head').text()).toBe('نصائح سريعة')
  })
})

describe('GeoFigure — الرسوم التوضيحية', () => {
  it('يرسم شكلاً موصوفًا لكل الأشكال الـ22', () => {
    for (const sh of SHAPES) {
      const w = mount(GeoFigure, { props: { id: sh.id } })
      const svg = w.find('svg')
      expect(svg.exists(), `لا يوجد رسم للشكل ${sh.id}`).toBe(true)
      expect(svg.attributes('role')).toBe('img')
      expect(svg.attributes('aria-label')).toBeTruthy()
      w.unmount()
    }
  })

  it('لا يرسم شيئًا لمعرّف غير معروف', () => {
    const w = mount(GeoFigure, { props: { id: 'non-existent' } })
    expect(w.find('svg').exists()).toBe(false)
  })

  it('يترجم وصف الشكل عند تبديل اللغة', async () => {
    const w = mount(GeoFigure, { props: { id: 'circle' } })
    const ar = w.find('svg').attributes('aria-label')
    setLang('en'); await nextTick()
    const en = w.find('svg').attributes('aria-label')
    expect(en).not.toBe(ar)
    expect(en.toLowerCase()).toContain('circle')
  })
})

describe('GeoPanel — لوحة قياس واحدة', () => {
  const shapeOf = (id) => SHAPES.find((s) => s.id === id)
  const mountPanel = (shape, over = {}) =>
    mount(GeoPanel, { props: { shape, values: emptyValues(shape), error: '', active: true, ...over } })

  it('يعرض الرسم والمعادلة وحقلًا لكل مفتاح ومافعل الخطأ والزر', () => {
    const circle = shapeOf('circle')
    const w = mountPanel(circle)
    expect(w.findComponent(GeoFigure).props('id')).toBe('circle')
    expect(w.find('.formula-bar').text()).toBe(circle.formula)
    expect(w.findAll('.field-row input')).toHaveLength(circle.fields.length)
    for (const f of circle.fields) expect(w.find(`#${circle.id}-${f.key}`).exists()).toBe(true)
    expect(w.find(`#${circle.errorId}`).exists()).toBe(true)
    expect(w.find('.btn-primary').text()).toBe(L(circle.action[0], circle.action[1]))
  })

  it('يحمل سمات الإدخال الصحيحة لكل نمط حقل', () => {
    const polygon = mountPanel(shapeOf('polygon'))
    const n = polygon.find('#polygon-n')
    expect(n.attributes('min')).toBe('3')
    expect(n.attributes('step')).toBe('1')
    expect(n.attributes('inputmode')).toBe('numeric')
    // بقية الحقول: بلا حد أعلى، خطوة حرة، لوحة عشرية
    expect(polygon.find('#polygon-s').attributes('step')).toBe('any')
    expect(polygon.find('#polygon-s').attributes('inputmode')).toBe('decimal')

    const sector = mountPanel(shapeOf('sector'))
    expect(sector.find('#sector-deg').attributes('max')).toBe('360')
  })

  it('يرفع calc من الزر ومن مفتاح Enter داخل الحقل', async () => {
    const w = mountPanel(shapeOf('circle'))
    await w.find('.btn-primary').trigger('click')
    await w.find('#circle-r').trigger('keydown.enter')
    expect(w.emitted('calc')).toHaveLength(2)
  })

  it('يعرض رسالة الخطأ في عنصر تنبيه', () => {
    const circle = shapeOf('circle')
    const w = mountPanel(circle, { error: 'خطأ ما' })
    const box = w.find(`#${circle.errorId}`)
    expect(box.text()).toBe('خطأ ما')
    expect(box.attributes('role')).toBe('alert')
    expect(w.find('#circle-r').attributes('aria-describedby')).toBe(circle.errorId)
  })

  it('يُظهر التلميح للأشكال التي تملكه فقط', () => {
    const hinted = SHAPES.find((s) => s.hint)
    expect(hinted).toBeTruthy()
    expect(mountPanel(hinted).find('.rt-hint').text()).toBe(L(hinted.hint[0], hinted.hint[1]))
    expect(mountPanel(shapeOf('circle')).find('.rt-hint').exists()).toBe(false)
  })

  it('يكتب القيمة داخل كائن القيم المشترك (v-model:values)', async () => {
    const circle = shapeOf('circle')
    const values = reactive(emptyValues(circle))
    const w = mountPanel(circle, { values })
    await w.find('#circle-r').setValue('7')
    // type="number": قد يعيد DOM القيمة رقمية — المهم أن الكائن المشترك حدُّث
    expect(String(values.r)).toBe('7')
    expect(String(w.find('#circle-r').element.value)).toBe('7')
  })
})

describe('CalcOpsPanel — لوحة العمليات', () => {
  const ops = buildOps(L)
  const props = {
    cats: CATS,
    visibleCats: CATS.filter((c) => c !== 'history'),
    catLabels: buildCatLabels(L),
    ops,
    activeCat: 'arith',
    openKeys: [],
    history: [],
    exampleResult: vi.fn(() => 'EX')
  }
  const mountOps = (over = {}) => mount(CalcOpsPanel, { props: { ...props, ...over } })

  it('يعرض تبويبًا لكل قسم بترتيب CATS', () => {
    const w = mountOps()
    expect(w.findAll('.ops-tab')).toHaveLength(CATS.length)
    expect(w.findAll('.ops-tab').map((b) => b.attributes('aria-selected'))).toEqual(
      CATS.map((c) => String(c === 'arith'))
    )
    expect(w.findAll('.ops-list')).toHaveLength(CATS.length - 1) // بلا history
  })

  it('يرفع update:activeCat عند النقر على تبويب', async () => {
    const w = mountOps()
    await w.findAll('.ops-tab')[2].trigger('click')
    expect(w.emitted('update:activeCat')[0]).toEqual(['trig'])
  })

  it('يفتح العملية ويرفع toggle بالمفتاح cat:op', async () => {
    const w = mountOps()
    await w.find('.ops-list[data-cat="arith"] .ops-head').trigger('click')
    expect(w.emitted('toggle')[0]).toEqual(['arith:+'])
  })

  it('يعرض حالة الفتح من openKeys ويستخدم دالة النتيجة المحقونة', () => {
    const w = mountOps({ openKeys: ['arith:+'] })
    const item = w.find('.ops-list[data-cat="arith"] .ops-item')
    expect(item.classes()).toContain('open')
    expect(item.find('.ops-head').attributes('aria-expanded')).toBe('true')
    expect(item.find('.ops-panel').attributes('hidden')).toBeUndefined()
    expect(item.find('.ex-res').text()).toBe('EX')
    expect(props.exampleResult).toHaveBeenCalledWith('12+8', undefined)
  })

  it('يرفع insert بالعملية كاملة وtry بالمثال ووضعه', async () => {
    const w = mountOps({ openKeys: ['arith:+'] })
    const acts = w.find('.ops-list[data-cat="arith"] .ops-item').findAll('.ops-act')
    await acts[0].trigger('click')
    await acts[1].trigger('click')
    expect(w.emitted('insert')[0][0]).toMatchObject({ v: '+' })
    expect(w.emitted('try')[0]).toEqual(['12+8', undefined])
  })

  it('يعرض السجل ويرفع أحداثه', async () => {
    const history = [{ e: '2+2', r: '4' }]
    const w = mountOps({ activeCat: 'history', history })
    expect(w.findAll('.history-item')).toHaveLength(1)
    expect(w.find('.history-item').text()).toContain('2+2')
    await w.find('.history-item').trigger('click')
    await w.find('.history-clear').trigger('click')
    expect(w.emitted('use-history')[0][0]).toEqual(history[0])
    expect(w.emitted('clear-history')).toHaveLength(1)
  })

  it('يعرض رسالة السجل الفارغ', () => {
    const w = mountOps({ activeCat: 'history' })
    expect(w.find('.history-empty').text()).toBe('لا توجد عمليات بعد')
  })
})

describe('CalcStepsDialog — نافذة الخطوات', () => {
  // Teleport يُستبدل بعرض مضمّن حتى نتمكن من الفحص عبر الغلاف
  const mountDialog = (propsOver = {}) =>
    mount(CalcStepsDialog, {
      props: { show: true, payload: null, error: '', ...propsOver },
      global: { stubs: { teleport: true } }
    })

  it('لا يعرض شيئًا حين show=false', () => {
    const w = mountDialog({ show: false })
    expect(w.find('.steps-card').exists()).toBe(false)
  })

  it('يعرض خطوات عملية عادية مع النتيجة النهائية', () => {
    const { data } = buildSteps('12+8')
    const w = mountDialog({ payload: data })
    const card = w.find('.steps-card')
    expect(card.attributes('role')).toBe('dialog')
    expect(card.text()).toContain('الحل بالخطوات')
    expect(card.text()).toContain('12+8')
    expect(card.text()).toContain('20')
    expect(card.text()).toContain('النتيجة النهائية')
  })

  it('يعرض التقرير الإحصائي بكل مقاييسه', () => {
    const { data } = buildSteps('med(4,8,6)')
    const w = mountDialog({ payload: data })
    const text = w.find('.steps-card').text()
    for (const label of ['الوسيط', 'المتوسط', 'الربيع Q1', 'الربيع Q3', 'لا يوجد منوال']) {
      expect(text).toContain(label)
    }
  })

  it('يعرض حل المتراجحة', () => {
    const { data } = buildSteps('3-2(1-x)≤2')
    const w = mountDialog({ payload: data })
    expect(w.find('.steps-card').text()).toContain('3-2(1-x)≤2')
  })

  it('يترجم مفتاح الخطأ ويعرض نص الفراغ', () => {
    const bad = mountDialog({ error: 'calc.err.div0' })
    expect(bad.find('.steps-msg').text()).toBe('لا يمكن القسمة على صفر')
    expect(bad.find('.steps-msg').attributes('role')).toBe('alert')

    const empty = mountDialog({ error: 'empty' })
    expect(empty.find('.steps-msg').text()).toBe('أدخل عملية صحيحة أولاً لعرض خطوات حلها.')
  })

  it('يرفع close من الزر ومن خلفية النافذة', async () => {
    const w = mountDialog()
    await w.find('.steps-close').trigger('click')
    await w.find('.steps-overlay').trigger('click')
    expect(w.emitted('close')).toHaveLength(2)
  })
})

describe('AppNav — شريط التنقل', () => {
  async function mountNav() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: ['/', '/calculator', '/numbers', '/geometry', '/contact', '/login'].map((path) => ({
        path,
        name: path === '/' ? 'home' : path.slice(1),
        component: { template: '<div/>' }
      }))
    })
    await router.push('/')
    await router.isReady()
    return mount(AppNav, { global: { plugins: [router] } })
  }

  it('يعرض العلامة والروابط الخمسة', async () => {
    const w = await mountNav()
    expect(w.find('.navbar-brand').text()).toContain('حاسباتي')
    expect(w.findAll('.navbar-links li')).toHaveLength(5)
    expect(w.find('.navbar').attributes('aria-label')).toBe('التنقل الرئيسي')
  })

  it('يبدّل اللغة ويحدّث اتجاه الصفحة', async () => {
    const w = await mountNav()
    expect(w.find('.lang-toggle').text()).toBe('EN')
    expect(document.documentElement.dir).toBe('rtl')

    await w.find('.lang-toggle').trigger('click')
    await nextTick()
    expect(w.find('.lang-toggle').text()).toBe('عربي')
    expect(document.documentElement.dir).toBe('ltr')
    expect(w.find('.navbar-brand').text()).toContain('Hasibati')

    await w.find('.lang-toggle').trigger('click')
    await nextTick()
    expect(document.documentElement.dir).toBe('rtl')
  })

  it('يفتح قائمة الجوال ويحدّث aria-expanded', async () => {
    const w = await mountNav()
    const toggle = w.find('.menu-toggle')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(w.find('.menu-toggle').attributes('aria-expanded')).toBe('true')
    expect(w.find('#navbar-menu').classes()).toContain('open')
  })
})
