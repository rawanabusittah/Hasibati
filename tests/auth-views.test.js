// @vitest-environment happy-dom
// اختبار صفحة استعادة كلمة المرور: مؤشّر قوة كلمة المرور.
// جذر الخلل السابق تعارض آليتين مختلفتين: الصفحة كانت تضيف صنف on على كل خانة،
// بينما يربط CSS الألوان بصنف الحاوية s1..s4 (نفس آلية صفحة التسجيل) فلا يضيء المؤشّر أبدًا.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import ForgotView from '../src/views/ForgotView.vue'
import { setLang } from '../src/composables/i18n'
import { pwStrength } from '../src/services/auth'

let w

function mountForgot() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/forgot', component: ForgotView },
      { path: '/login', component: { template: '<div />' } }
    ]
  })
  return mount(ForgotView, { global: { plugins: [router] } })
}

beforeEach(() => {
  setLang('ar')
  // رابط يستعيد من البريد (نفس كشف detectRecovery) → تُفتح الخطوة الثانية مباشرة
  window.location.hash = '#type=recovery'
  w = mountForgot()
})

afterEach(() => {
  w.unmount()
  window.location.hash = ''
  document.body.innerHTML = ''
})

describe('ForgotView — مؤشّر قوة كلمة المرور', () => {
  it('يعرض أربع خانات ويضع صنف القوة s0..s4 على الحاوية', async () => {
    expect(w.findAll('.pw-strength span')).toHaveLength(4)
    expect(w.find('.pw-strength').classes()).toContain('s0')

    const pass = w.find('#forgot-newpass')
    await pass.setValue('Abcdefg1') // قوة 2: طول ≥ 8 + حروف وأرقام
    expect(pwStrength('Abcdefg1')).toBe(2)
    expect(w.find('.pw-strength').classes()).toContain('s2')

    await pass.setValue('Abcdefg1234567!') // قوة 4: + طول ≥ 12 + رمز خاص
    expect(pwStrength('Abcdefg1234567!')).toBe(4)
    expect(w.find('.pw-strength').classes()).toContain('s4')
  })

  it('يضيف صنف ok إلى التلميح عندما تخلو الكلمة من المشكلات', async () => {
    const hint = () => w.find('.pw-hint.ok')
    expect(hint().exists()).toBe(false)
    await w.find('#forgot-newpass').setValue('Abcdefg1')
    expect(hint().exists()).toBe(true)
  })

  it('CSS يربط ألوان الخانات بصنف الحاوية s1..s4 (عقد بين العلامة والتنسيق)', () => {
    // بدون هذه القواعد يبقى المؤشّر أبيض مهما كانت القوة — وهو الخلل الأصلي
    const css = readFileSync(resolve(process.cwd(), 'src/assets/css/style.css'), 'utf8')
    for (const n of [1, 2, 3, 4]) expect(css).toContain(`.pw-strength.s${n} span`)
  })
})
