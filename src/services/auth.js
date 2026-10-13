// ============================================================
// auth — نظام حسابات فعلي عبر Supabase (قاعدة بيانات Postgres)
// • إنشاء حساب · تسجيل الدخول · استعادة كلمة المرور عبر بريد حقيقي
// • جلسة + حالة المستخدم في شريط التنقل (حالة تفاعلية Vue)
// • بدون مفاتيح Supabase تعمل كل العمليات برسالة «غير مضبوط» دون أخطاء
// ============================================================
import { ref, computed } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig'
import { t } from '../composables/i18n'

const configured =
  /^https:\/\/.+/.test(SUPABASE_URL) &&
  SUPABASE_ANON_KEY.length > 40 &&
  !SUPABASE_ANON_KEY.includes('YOUR-')

export const db = configured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

// ── حالة تفاعلية ──
const session = ref(null)
let profileName = null // اسم العرض من جدول profiles

export const currentUser = computed(() => {
  const s = session.value
  if (!s) return null
  return {
    id: s.user.id,
    name: profileName ||
      (s.user.user_metadata && (s.user.user_metadata.name || s.user.user_metadata.full_name)) ||
      s.user.email,
    email: s.user.email
  }
})

// ── أدوات تحقق ──
export const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim())

export function pwIssues(pw) {
  const issues = []
  if (pw.length < 8) issues.push('auth.pwShort')
  if (!/[A-Za-z\u0621-\u064A]/.test(pw) || !/\d/.test(pw)) issues.push('auth.pwWeak')
  return issues
}

// قوة كلمة المرور 0..4 (للمؤشر البصري)
export function pwStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Za-z\u0621-\u064A]/.test(pw) && /\d/.test(pw)) score++
  if (/[^A-Za-z0-9\u0621-\u064A]/.test(pw)) score++
  if (!pw) score = 0
  return Math.min(score, 4)
}

// ── ترجمة أخطاء Supabase إلى رسائل ثنائية ──
function mapAuthError(err) {
  if (!err) return 'auth.failed'
  const code = err.code || err.status || ''
  const msg = (err.message || '').toLowerCase()
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'auth.network'
  if (code === 'invalid_credentials' || msg.includes('invalid login')) return 'auth.wrong'
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'auth.notConfirmed'
  if (code === 'user_already_exists' || msg.includes('already registered')) return 'auth.exists'
  if (code === 'weak_password' || msg.includes('password should be')) return 'auth.pwWeak'
  if (code === 'over_email_send_rate_limit' || code === 'rate_limit_exceeded' || msg.includes('rate limit')) return 'auth.rateLimited'
  if (code === 'same_password') return 'auth.samePw'
  if (msg.includes('user not found')) return 'auth.wrong'
  return 'auth.failed'
}

const noConfig = () => ({ ok: false, err: 'auth.notConfigured' })

// ── العمليات ──
export async function register(name, email, password) {
  if (!db) return noConfig()
  email = email.trim().toLowerCase()
  try {
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim(), full_name: name.trim() } }
    })
    if (error) return { ok: false, err: mapAuthError(error) }
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { ok: false, err: 'auth.exists' }
    }
    session.value = data.session
    return { ok: true, needsConfirm: !data.session }
  } catch {
    return { ok: false, err: 'auth.network' }
  }
}

export async function login(email, password) {
  if (!db) return noConfig()
  email = email.trim().toLowerCase()
  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, err: mapAuthError(error) }
    session.value = data.session
    return { ok: true }
  } catch {
    return { ok: false, err: 'auth.network' }
  }
}

export async function logout() {
  if (!db) return
  try { await db.auth.signOut() } catch { /* تجاهل */ }
  session.value = null
}

export async function sendResetEmail(email) {
  if (!db) return noConfig()
  email = email.trim().toLowerCase()
  try {
    const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: window.location.href })
    if (error) return { ok: false, err: mapAuthError(error) }
    return { ok: true }
  } catch {
    return { ok: false, err: 'auth.network' }
  }
}

export async function updatePassword(newPassword) {
  if (!db) return noConfig()
  try {
    let s = (await db.auth.getSession()).data.session
    if (!s) {
      await new Promise(r => setTimeout(r, 600))
      s = (await db.auth.getSession()).data.session
    }
    if (!s) return { ok: false, err: 'auth.recoveryExpired' }
    const { error } = await db.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, err: mapAuthError(error) }
    return { ok: true }
  } catch {
    return { ok: false, err: 'auth.network' }
  }
}

export function setName(name) {
  profileName = (name && String(name).trim()) || null
}

export async function getSession() {
  if (!db) return null
  try {
    const { data } = await db.auth.getSession()
    session.value = data.session || null
    return session.value
  } catch { return null }
}

// ── التشغيل عند الإقلاع ──
getSession()
if (db) {
  db.auth.onAuthStateChange((_event, s) => {
    session.value = s
    document.dispatchEvent(new CustomEvent('hp:authchange', { detail: { event: _event } }))
  })
}

// وَصلة «t» باللغة الحية (تُستخدم في رسائل الحالة المولّدة)
export { t as authT }