<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/i18n'
import { sendResetEmail, updatePassword, isEmail, pwIssues, pwStrength } from '../services/auth'

const { L, t } = useI18n()
const router = useRouter()

const step = ref(1)                       // 1 = البريد · 2 = كلمة المرور الجديدة
const email = ref('')
const newPass = ref('')
const newPass2 = ref('')
const showPw = ref(false)
const showPw2 = ref(false)
const statusKind = ref('')
const statusText = ref('')
const busy = ref(false)

function setStatus(kind, text) { statusKind.value = kind; statusText.value = text }

const strength = computed(() => pwStrength(newPass.value))
const pwHint = computed(() => {
  if (!newPass.value) return t('auth.pwHintDefault')
  const issues = pwIssues(newPass.value)
  return issues.length ? t(issues[0]) : t('auth.pwOk')
})
const hintKind = computed(() => (newPass.value && pwIssues(newPass.value).length === 0 ? 'ok' : ''))
const stepLabel = computed(() => (step.value === 1 ? t('auth.step1') : t('auth.step2')))

// كشف رابط الاستعادة القادم من البريد (Supabase يضيف access_token أو type=recovery)
function detectRecovery() {
  const h = location.hash || ''
  const q = location.search || ''
  return h.includes('access_token') || h.includes('type=recovery') || q.includes('access_token') || q.includes('type=recovery')
}

onMounted(() => {
  if (detectRecovery()) step.value = 2
})

async function sendLink() {
  if (busy.value) return
  if (!email.value.trim()) { setStatus('error', t('auth.required')); return }
  if (!isEmail(email.value)) { setStatus('error', t('auth.emailInvalid')); return }
  busy.value = true
  setStatus('info', t('contact.sending'))
  const res = await sendResetEmail(email.value)
  busy.value = false
  if (res.ok) setStatus('success', t('auth.resetEmailSent'))
  else setStatus('error', t(res.err))
}

async function resetPw() {
  if (busy.value) return
  if (!newPass.value || !newPass2.value) { setStatus('error', t('auth.required')); return }
  const issues = pwIssues(newPass.value)
  if (issues.length) { setStatus('error', t(issues[0])); return }
  if (newPass.value !== newPass2.value) { setStatus('error', t('auth.pwMismatch')); return }
  busy.value = true
  setStatus('info', t('contact.sending'))
  const res = await updatePassword(newPass.value)
  busy.value = false
  if (res.ok) {
    setStatus('success', t('auth.resetOk'))
    setTimeout(() => router.push('/login'), 1500)
  } else {
    setStatus('error', t(res.err))
  }
}

function goBack() { step.value = 1; statusKind.value = ''; statusText.value = '' }
</script>

<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="auth-logo" aria-hidden="true">🔐</div>
      <h1 class="auth-title">{{ L('استعادة كلمة المرور', 'Reset your password') }}</h1>
      <p class="auth-sub">{{ L('خطوتان بسيطات وستعود إلى حسابك.', "Two simple steps and you'll be back in your account.") }}</p>

      <!-- مؤشر الخطوات -->
      <div class="auth-steps" aria-hidden="true">
        <span class="dot" :class="{ on: step === 1 }"></span>
        <span class="dot" :class="{ on: step === 2 }"></span>
        <span class="label">{{ stepLabel }}</span>
      </div>

      <div class="demo-note">
        <span aria-hidden="true">📧</span>
        <span v-html="L('<strong>استعادة حقيقية:</strong> سيرسل Supabase رابط استعادة آمن إلى بريدك الإلكتروني. تحقق من البريد الذي سجّلت به.', '<strong>Real reset:</strong> Supabase will send a secure reset link to your inbox. Check the email you registered with.')"></span>
      </div>

      <!-- الخطوة 1: البريد -->
      <form v-if="step === 1" novalidate @submit.prevent="sendLink">
        <div class="input-group">
          <label for="forgot-email">{{ L('البريد الإلكتروني', 'Email address') }}</label>
          <input type="email" id="forgot-email" v-model="email" placeholder="example@email.com" autocomplete="email" style="direction:ltr; text-align:left;" required />
        </div>
        <button type="submit" class="btn-primary" style="width:100%;" :disabled="busy">{{ L('إرسال رابط الاستعادة', 'Send reset link') }}</button>
        <div class="form-status" :class="statusKind" role="status" aria-live="polite">{{ statusText }}</div>
      </form>

      <!-- الخطوة 2: كلمة المرور الجديدة -->
      <form v-else novalidate @submit.prevent="resetPw">
        <div class="input-group">
          <label>{{ L('تعيين كلمة مرور جديدة', 'Set a new password') }}</label>
          <div class="pw-hint">{{ L('وصلت من رابط البريد — اختر كلمة المرور الجديدة بالأسفل.', 'You arrived from the email link — choose your new password below.') }}</div>
        </div>

        <div class="input-group">
          <label for="forgot-newpass">{{ L('كلمة المرور الجديدة', 'New password') }}</label>
          <div class="pw-field">
            <input :type="showPw ? 'text' : 'password'" id="forgot-newpass" v-model="newPass" placeholder="••••••••" autocomplete="new-password" required />
            <button type="button" class="pw-toggle" :aria-label="L('إظهار كلمة المرور', 'Show password')" @click="showPw = !showPw">👁️</button>
          </div>
          <div class="pw-strength" aria-hidden="true">
            <span v-for="i in 4" :key="i" :class="{ on: i <= strength }"></span>
          </div>
          <div class="pw-hint" :class="hintKind">{{ pwHint }}</div>
        </div>

        <div class="input-group">
          <label for="forgot-newpass2">{{ L('تأكيد كلمة المرور الجديدة', 'Confirm new password') }}</label>
          <div class="pw-field">
            <input :type="showPw2 ? 'text' : 'password'" id="forgot-newpass2" v-model="newPass2" placeholder="••••••••" autocomplete="new-password" required />
            <button type="button" class="pw-toggle" :aria-label="L('إظهار كلمة المرور', 'Show password')" @click="showPw2 = !showPw2">👁️</button>
          </div>
        </div>

        <div style="display:flex; gap:0.6rem; margin-top:0.5rem;">
          <button type="button" class="btn-secondary" style="flex:1;" @click="goBack">{{ L('رجوع', 'Back') }}</button>
          <button type="submit" class="btn-primary" style="flex:2;" :disabled="busy">{{ L('تغيير كلمة المرور', 'Reset password') }}</button>
        </div>
        <div class="form-status" :class="statusKind" role="status" aria-live="polite">{{ statusText }}</div>
      </form>

      <div class="auth-alt">
        <span>{{ L('تذكّرت كلمة المرور؟', 'Remembered your password?') }}</span>
        <router-link to="/login">{{ L('تسجيل الدخول', 'Sign in') }}</router-link>
      </div>
    </div>
  </div>
</template>