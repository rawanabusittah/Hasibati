// @vitest-environment happy-dom
// اختبار مسارات المصادقة في الواجهة (src/views/AuthView.vue):
// التحقق قبل الشبكة، وترجمة أخطاء الخدمة، والتوجيه بعد النجاح، وتبديل اللوحتين.
// نستبدل نداءات الشبكة (login/register) فقط، ونُبقي أدوات التحقق الحقيقية
// (isEmail/pwIssues/pwStrength) لنختبر القواعد كما تعمل فعلاً.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'

import AuthView from '../src/views/AuthView.vue'
import { setLang, t, L } from '../src/composables/i18n'

vi.mock('../src/services/auth.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, login: vi.fn(), register: vi.fn() }
})

import { login, register } from '../src/services/auth'

let w, router

async function mountAuth(path) {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/login', name: 'login', component: AuthView },
      { path: '/register', name: 'register', component: AuthView },
      { path: '/forgot', name: 'forgot', component: { template: '<div />' } }
    ]
  })
  await router.push(path)
  await router.isReady()
  w = mount(AuthView, { global: { plugins: [router] } })
  return w
}

const status = (panel) => w.find(`.as-panel-${panel} .form-status`)

async function submitLogin(email, password) {
  await w.find('#login-email').setValue(email)
  await w.find('#login-pass').setValue(password)
  await w.find('.as-panel-login form').trigger('submit')
}

async function submitRegister({ name = 'رونق', email = 'user@example.com', pass = 'Abcdefg1', pass2 = pass }) {
  await w.find('#reg-name').setValue(name)
  await w.find('#reg-email').setValue(email)
  await w.find('#reg-pass').setValue(pass)
  await w.find('#reg-pass2').setValue(pass2)
  await w.find('.as-panel-register form').trigger('submit')
}

beforeEach(() => {
  setLang('ar')
  login.mockReset().mockResolvedValue({ ok: true })
  register.mockReset().mockResolvedValue({ ok: true, needsConfirm: false })
})

afterEach(() => {
  w.unmount()
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('AuthView — تسجيل الدخول', () => {
  it('يرفض النموذج الفارغ قبل أي نداء شبكي', async () => {
    await mountAuth('/login')
    await w.find('.as-panel-login form').trigger('submit')

    expect(status('login').text()).toBe(t('auth.required'))
    expect(status('login').classes()).toContain('error')
    expect(login).not.toHaveBeenCalled()
  })

  it('يرفض بريدًا غير صالح قبل الشبكة', async () => {
    await mountAuth('/login')
    await submitLogin('not-an-email', 'Abcdefg1')

    expect(status('login').text()).toBe(t('auth.emailInvalid'))
    expect(login).not.toHaveBeenCalled()
  })

  it('يعرض خطأ بيانات الدخول مترجمًا', async () => {
    login.mockResolvedValue({ ok: false, err: 'auth.wrong' })
    await mountAuth('/login')
    await submitLogin('user@example.com', 'wrong-pass')

    expect(status('login').text()).toBe(t('auth.wrong'))
    expect(status('login').classes()).toContain('error')
    expect(w.find('#login-pass').element.value).toBe('wrong-pass') // تبقى الكلمة في الحقل
  })

  it('يعرض خطأ الشبكة برسالة مستقلة', async () => {
    login.mockResolvedValue({ ok: false, err: 'auth.network' })
    await mountAuth('/login')
    await submitLogin('user@example.com', 'Abcdefg1')

    expect(status('login').text()).toBe(t('auth.network'))
    expect(status('login').text()).not.toBe(t('auth.wrong'))
  })

  it('ينجح، يعرض الرسالة، ثم يوجّه إلى الرئيسية', async () => {
    vi.useFakeTimers()
    await mountAuth('/login')

    // الواجهة تمرّر البريد كما هو (تُبقي حالة الأحرف) والتطبيع مسؤولية الخدمة
    // — وهو مغطّى في tests/services-auth.test.js
    await submitLogin('User@Example.com', 'Abcdefg1')
    expect(login).toHaveBeenCalledWith('User@Example.com', 'Abcdefg1')
    expect(status('login').text()).toBe(t('auth.ok'))
    expect(status('login').classes()).toContain('success')

    expect(router.currentRoute.value.path).toBe('/login')
    await vi.advanceTimersByTimeAsync(800)
    expect(router.currentRoute.value.path).toBe('/')
  })
})

describe('AuthView — إنشاء حساب', () => {
  it('يرفض الحقول الناقصة', async () => {
    await mountAuth('/register')
    await w.find('.as-panel-register form').trigger('submit')

    expect(status('register').text()).toBe(t('auth.required'))
    expect(register).not.toHaveBeenCalled()
  })

  it('يرفض الاسم القصير جدًا', async () => {
    await mountAuth('/register')
    await submitRegister({ name: 'ن' })

    expect(status('register').text()).toBe(t('auth.nameShort'))
    expect(register).not.toHaveBeenCalled()
  })

  it('يرفض البريد غير الصالح', async () => {
    await mountAuth('/register')
    await submitRegister({ email: 'bad-email' })

    expect(status('register').text()).toBe(t('auth.emailInvalid'))
    expect(register).not.toHaveBeenCalled()
  })

  it('يرفض كلمة المرور القصيرة', async () => {
    await mountAuth('/register')
    await submitRegister({ pass: 'Ab1' })

    expect(status('register').text()).toBe(t('auth.pwShort'))
    expect(register).not.toHaveBeenCalled()
  })

  it('يرفض كلمة المرور الخالية من الأرقام', async () => {
    await mountAuth('/register')
    await submitRegister({ pass: 'abcdefgh' })

    expect(status('register').text()).toBe(t('auth.pwWeak'))
    expect(register).not.toHaveBeenCalled()
  })

  it('يرفض عدم تطابق الكلمتين', async () => {
    await mountAuth('/register')
    await submitRegister({ pass: 'Abcdefg1', pass2: 'Abcdefg2' })

    expect(status('register').text()).toBe(t('auth.pwMismatch'))
    expect(register).not.toHaveBeenCalled()
  })

  it('يطلب تأكيد البريد عندما يُعيد الخادم needsConfirm', async () => {
    register.mockResolvedValue({ ok: true, needsConfirm: true })
    await mountAuth('/register')
    await submitRegister({})

    expect(register).toHaveBeenCalledWith('رونق', 'user@example.com', 'Abcdefg1')
    expect(status('register').text()).toBe(t('auth.confirmSent'))
    expect(status('register').classes()).toContain('success')
  })

  it('ينجح ثم يوجّه إلى الرئيسية', async () => {
    vi.useFakeTimers()
    await mountAuth('/register')
    await submitRegister({})

    expect(status('register').text()).toBe(t('auth.created'))
    await vi.advanceTimersByTimeAsync(1200)
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('يعرض خطأ الخدمة (حساب موجود) مترجمًا', async () => {
    register.mockResolvedValue({ ok: false, err: 'auth.exists' })
    await mountAuth('/register')
    await submitRegister({})

    expect(status('register').text()).toBe(t('auth.exists'))
    expect(status('register').classes()).toContain('error')
  })

  it('يحدّث مؤشّر القوة والتلميح أثناء الكتابة', async () => {
    await mountAuth('/register')
    expect(w.find('.as-panel-register .pw-strength').classes()).toContain('s0')

    await w.find('#reg-pass').setValue('Abcdefg1') // قوة 2
    expect(w.find('.as-panel-register .pw-strength').classes()).toContain('s2')
    expect(w.find('.as-panel-register .pw-hint.ok').exists()).toBe(true)

    await w.find('#reg-pass').setValue('abc') // قصيرة
    expect(w.find('.as-panel-register .pw-hint').text()).toBe(t('auth.pwShort'))
    expect(w.find('.as-panel-register .pw-hint.ok').exists()).toBe(false)
  })
})

describe('AuthView — تبديل اللوحتين', () => {
  it('ينتقل من الدخول إلى التسجيل عبر رابط التبديل', async () => {
    await mountAuth('/login')
    await w.find('.as-panel-login .as-link').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('register')
    expect(w.find('.as-tabs button[aria-selected="true"]').text()).toBe(L('إنشاء حساب', 'Sign up'))
  })

  it('ينتقل من التسجيل إلى الدخول عبر رابط التبديل', async () => {
    await mountAuth('/register')
    await w.find('.as-panel-register .as-link').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('login')
    expect(w.find('.as-tabs button[aria-selected="true"]').text()).toBe(L('تسجيل الدخول', 'Sign in'))
  })
})
