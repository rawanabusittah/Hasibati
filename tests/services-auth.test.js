// @vitest-environment happy-dom
// اختبارات طبقة المصادقة (src/services/auth.js) بلا أي اتصال شبكي:
// نستبدل إعداد Supabase ومكتبته بعميل وهمي كامل التحكّم، فنمرّ على مسارات
// النجاح والفشل وترجمة الأخطاء وحالة «غير مضبوط» وحالة عدم الإقلاع.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// عميل Supabase وهمي: يعيد ما نضبطه في res، ويسجّل كل نداء
const h = vi.hoisted(() => {
  const calls = { signUp: [], signIn: [], signOut: 0, reset: [], update: [], getSession: 0 }
  const state = { authCb: null }
  const res = {
    signUp: () => ({ data: { user: { id: 'u1', email: 'user@example.com', user_metadata: { name: 'رونق' } }, session: { user: { id: 'u1', email: 'user@example.com', user_metadata: { name: 'رونق' } } } }, error: null }),
    signIn: () => ({ data: { session: { user: { id: 'u1', email: 'user@example.com', user_metadata: { name: 'رونق' } } } }, error: null }),
    signOut: () => ({ error: null }),
    reset: () => ({ error: null }),
    update: () => ({ error: null }),
    getSession: () => ({ data: { session: null } })
  }
  const client = {
    auth: {
      signUp: async (...a) => { calls.signUp.push(a); return res.signUp(...a) },
      signInWithPassword: async (...a) => { calls.signIn.push(a); return res.signIn(...a) },
      signOut: async () => { calls.signOut++; return res.signOut() },
      resetPasswordForEmail: async (...a) => { calls.reset.push(a); return res.reset(...a) },
      updateUser: async (...a) => { calls.update.push(a); return res.update(...a) },
      getSession: async () => { calls.getSession++; return res.getSession() },
      onAuthStateChange: (cb) => { state.authCb = cb; return { data: { subscription: { unsubscribe() {} } } } }
    }
  }
  // إعادة كل شيء إلى الحالة الافتراضية بين الاختبارات
  const reset = () => {
    calls.signUp = []; calls.signIn = []; calls.signOut = 0
    calls.reset = []; calls.update = []; calls.getSession = 0
    res.signUp = () => ({ data: { user: { id: 'u1', email: 'user@example.com', user_metadata: { name: 'رونق' } }, session: { user: { id: 'u1', email: 'user@example.com', user_metadata: { name: 'رونق' } } } }, error: null })
    res.signIn = () => ({ data: { session: { user: { id: 'u1', email: 'user@example.com', user_metadata: { name: 'رونق' } } } }, error: null })
    res.signOut = () => ({ error: null })
    res.reset = () => ({ error: null })
    res.update = () => ({ error: null })
    res.getSession = () => ({ data: { session: null } })
  }
  return { calls, state, res, client, reset }
})

vi.mock('../src/services/supabaseConfig.js', () => ({
  SUPABASE_URL: 'https://demo-project.supabase.co',
  SUPABASE_ANON_KEY: 'anon-public-key-that-is-long-enough-to-pass-check'
}))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => h.client }))

import {
  db, currentUser, isEmail, pwIssues, pwStrength,
  register, login, logout, sendResetEmail, updatePassword, getSession, setName
} from '../src/services/auth.js'

// مهمة ماكرو واحدة تُفرغ كل المهام المعلّقة (العميل الوهمي يعيد وعودًا)
const flush = () => new Promise(r => setTimeout(r, 0))

beforeEach(async () => {
  h.reset()
  setName(null)
  await getSession()
  await flush()
})

afterEach(() => { vi.useRealTimers() })

describe('auth — الإعداد', () => {
  it('ينشئ عميل Supabase عندما تكون المفاتيح سليمة', () => {
    expect(db).toBe(h.client)
  })

  it('يبدأ بلا مستخدم', () => {
    expect(currentUser.value).toBeNull()
  })
})

describe('auth — register', () => {
  it('ينجح ويضبط الجلسة واسم العرض من الميتاداتا', async () => {
    const r = await register(' رونق ', 'USER@Example.com', 'Abcdefg1')
    expect(r).toEqual({ ok: true, needsConfirm: false })
    expect(h.calls.signUp[0][0]).toMatchObject({
      email: 'user@example.com',
      password: 'Abcdefg1',
      options: { data: { name: 'رونق', full_name: 'رونق' } }
    })
    expect(currentUser.value).toMatchObject({ id: 'u1', name: 'رونق', email: 'user@example.com' })
  })

  it('يرجّح الاسم القادم من جدول profiles على الميتاداتا', async () => {
    // الاسم يُحسم لحظة تحديث الجلسة (كما يفعل refreshAll: حلّل الملف ثم اسم المستخدم)
    h.res.getSession = () => ({ data: { session: { user: { id: 'u1', email: 'user@example.com', user_metadata: { name: 'رونق' } } } } })

    setName('الاسم من الملف')
    await getSession()
    expect(currentUser.value.name).toBe('الاسم من الملف')

    setName('   ') // فراغ ⇒ رجوع إلى الميتاداتا
    await getSession()
    expect(currentUser.value.name).toBe('رونق')
  })

  it('يعيد needsConfirm=true عندما يُطلب تأكيد البريد (بلا جلسة)', async () => {
    h.res.signUp = () => ({ data: { user: { id: 'u2', email: 'new@example.com' }, session: null }, error: null })
    expect(await register('جديد', 'new@example.com', 'Abcdefg1')).toEqual({ ok: true, needsConfirm: true })
    expect(currentUser.value).toBeNull()
  })

  it('يكشف الحساب المسجّل مسبقًا من قائمة identities الفارغة', async () => {
    h.res.signUp = () => ({ data: { user: { identities: [] }, session: null }, error: null })
    expect(await register('مكرر', 'dup@example.com', 'Abcdefg1')).toEqual({ ok: false, err: 'auth.exists' })
  })

  it('يترجم أخطاء Supabase المعروفة', async () => {
    const cases = [
      [{ code: 'user_already_exists' }, 'auth.exists'],
      [{ message: 'Failed to fetch' }, 'auth.network'],
      [{ code: 'weak_password' }, 'auth.pwWeak'],
      [{ code: 'over_email_send_rate_limit' }, 'auth.rateLimited'],
      [{ message: 'something odd' }, 'auth.failed']
    ]
    for (const [error, expected] of cases) {
      h.res.signUp = () => ({ data: null, error })
      expect(await register('ن', 'a@b.com', 'Abcdefg1')).toEqual({ ok: false, err: expected })
    }
  })

  it('يعيد auth.network إذا رمى العميل استثناءً', async () => {
    h.res.signUp = () => { throw new Error('boom') }
    expect(await register('ن', 'a@b.com', 'Abcdefg1')).toEqual({ ok: false, err: 'auth.network' })
  })
})

describe('auth — login', () => {
  it('ينجح ويضبط الجلسة', async () => {
    expect(await login(' User@Example.com ', 'Abcdefg1')).toEqual({ ok: true })
    expect(h.calls.signIn[0][0]).toEqual({ email: 'user@example.com', password: 'Abcdefg1' })
    expect(currentUser.value.id).toBe('u1')
  })

  it('يترجم بيانات الدخول الخاطئة والبريد غير المؤكد', async () => {
    h.res.signIn = () => ({ data: null, error: { code: 'invalid_credentials' } })
    expect(await login('a@b.com', 'x')).toEqual({ ok: false, err: 'auth.wrong' })

    h.res.signIn = () => ({ data: null, error: { code: 'email_not_confirmed' } })
    expect(await login('a@b.com', 'x')).toEqual({ ok: false, err: 'auth.notConfirmed' })

    h.res.signIn = () => ({ data: null, error: { message: 'User not found' } })
    expect(await login('a@b.com', 'x')).toEqual({ ok: false, err: 'auth.wrong' })
  })

  it('يعيد auth.network عند انقطاع الشبكة', async () => {
    h.res.signIn = () => { throw new Error('offline') }
    expect(await login('a@b.com', 'x')).toEqual({ ok: false, err: 'auth.network' })
  })

  it('لا يضبط الجلسة عند الفشل', async () => {
    h.res.signIn = () => ({ data: null, error: { code: 'invalid_credentials' } })
    await login('a@b.com', 'x')
    expect(currentUser.value).toBeNull()
  })
})

describe('auth — logout و getSession', () => {
  it('يخرج ويصفّر الجلسة', async () => {
    await login('a@b.com', 'x')
    expect(currentUser.value).not.toBeNull()
    await logout()
    expect(h.calls.signOut).toBe(1)
    expect(currentUser.value).toBeNull()
  })

  it('يقرأ الجلسة عند الإقلاع ويضبط المستخدم', async () => {
    h.res.getSession = () => ({ data: { session: { user: { id: 'u9', email: 'boot@example.com' } } } })
    const s = await getSession()
    expect(s.user.id).toBe('u9')
    expect(currentUser.value).toMatchObject({ id: 'u9', name: 'boot@example.com' })
  })

  it('يتجاهل انفجار قراءة الجلسة', async () => {
    h.res.getSession = () => { throw new Error('boom') }
    expect(await getSession()).toBeNull()
  })
})

describe('auth — sendResetEmail', () => {
  it('يرسل الرابط مع إعادة التوجيه إلى الصفحة الحالية', async () => {
    expect(await sendResetEmail(' User@Example.com ')).toEqual({ ok: true })
    expect(h.calls.reset[0]).toEqual(['user@example.com', { redirectTo: window.location.href }])
  })

  it('يترجم خطأ الحد الأقصى للرسائل', async () => {
    h.res.reset = () => ({ error: { code: 'over_email_send_rate_limit' } })
    expect(await sendResetEmail('a@b.com')).toEqual({ ok: false, err: 'auth.rateLimited' })
  })
})

describe('auth — updatePassword', () => {
  it('يحدّث كلمة المرور عند وجود جلسة استعادة', async () => {
    h.res.getSession = () => ({ data: { session: { user: { id: 'u1', email: 'user@example.com', user_metadata: { name: 'رونق' } } } } })
    expect(await updatePassword('Abcdefg1!')).toEqual({ ok: true })
    expect(h.calls.update[0]).toEqual([{ password: 'Abcdefg1!' }])
  })

  it('يعيد recoveryExpired إذا لم تصل جلسة الاستعادة', async () => {
    vi.useFakeTimers()
    const p = updatePassword('Abcdefg1!')
    await vi.advanceTimersByTimeAsync(600)
    expect(await p).toEqual({ ok: false, err: 'auth.recoveryExpired' })
    expect(h.calls.update).toHaveLength(0)
  })

  it('يترجم كلمة المرور الضعيفة', async () => {
    h.res.getSession = () => ({ data: { session: { user: { id: 'u1', email: 'user@example.com', user_metadata: { name: 'رونق' } } } } })
    h.res.update = () => ({ error: { code: 'weak_password' } })
    expect(await updatePassword('123')).toEqual({ ok: false, err: 'auth.pwWeak' })
  })
})

describe('auth — حالة المصادقة الحيّة', () => {
  it('يحدّث المستخدم ويُطلق حدث hp:authchange', async () => {
    const seen = []
    const spy = (e) => seen.push(e.detail.event)
    document.addEventListener('hp:authchange', spy)

    expect(h.state.authCb).toBeTypeOf('function')
    h.state.authCb('SIGNED_IN', { user: { id: 'u7', email: 'live@example.com' } })
    expect(seen).toEqual(['SIGNED_IN'])
    expect(currentUser.value).toMatchObject({ id: 'u7', email: 'live@example.com' })

    h.state.authCb('SIGNED_OUT', null)
    expect(seen).toEqual(['SIGNED_IN', 'SIGNED_OUT'])
    expect(currentUser.value).toBeNull()
    document.removeEventListener('hp:authchange', spy)
  })
})

describe('auth — أدوات التحقق', () => {
  it('isEmail يميّز البريد الصالح', () => {
    expect(isEmail('user@example.com')).toBe(true)
    expect(isEmail(' user@example.co.uk ')).toBe(true)
    expect(isEmail('user@example')).toBe(false)
    expect(isEmail('user example.com')).toBe(false)
    expect(isEmail('')).toBe(false)
  })

  it('pwIssues يرصد القِصر وغياب الأرقام أو الحروف', () => {
    expect(pwIssues('short')).toEqual(['auth.pwShort', 'auth.pwWeak'])
    expect(pwIssues('12345678')).toEqual(['auth.pwWeak'])
    expect(pwIssues('Abcdefg1')).toEqual([])
  })

  it('pwStrength يعطي 0..4', () => {
    expect(pwStrength('')).toBe(0)
    expect(pwStrength('abc')).toBe(0)
    expect(pwStrength('Abcdefg1')).toBe(2)
    expect(pwStrength('Abcdefg1234567!')).toBe(4)
  })
})

describe('auth — بلا مفاتيح Supabase', () => {
  it('لا يبني عميلًا ويردّ auth.notConfigured من كل عملية', async () => {
    vi.resetModules()
    vi.doMock('../src/services/supabaseConfig.js', () => ({ SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }))
    const a = await import('../src/services/auth.js')

    expect(a.db).toBeNull()
    expect(await a.register('ن', 'a@b.com', 'Abcdefg1')).toEqual({ ok: false, err: 'auth.notConfigured' })
    expect(await a.login('a@b.com', 'x')).toEqual({ ok: false, err: 'auth.notConfigured' })
    expect(await a.sendResetEmail('a@b.com')).toEqual({ ok: false, err: 'auth.notConfigured' })
    expect(await a.updatePassword('Abcdefg1')).toEqual({ ok: false, err: 'auth.notConfigured' })
    expect(await a.getSession()).toBeNull()
    await expect(a.logout()).resolves.toBeUndefined()
    expect(a.currentUser.value).toBeNull()
    // العميل الوهمي لم يُستدعَ إطلاقًا
    expect(h.calls.signUp).toHaveLength(0)
  })
})
