<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/i18n'
import { register, isEmail, pwIssues, pwStrength } from '../services/auth'

const { L, t } = useI18n()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const password2 = ref('')
const showPw = ref(false)
const showPw2 = ref(false)
const statusKind = ref('')
const statusText = ref('')
const busy = ref(false)

function setStatus(kind, text) { statusKind.value = kind; statusText.value = text }

const strength = computed(() => pwStrength(password.value))
const pwHint = computed(() => {
  if (!password.value) return t('auth.pwHintDefault')
  const issues = pwIssues(password.value)
  return issues.length ? t(issues[0]) : t('auth.pwOk')
})
const hintKind = computed(() => (password.value && pwIssues(password.value).length === 0 ? 'ok' : ''))

async function onSubmit() {
  if (busy.value) return
  const n = name.value.trim()
  const e = email.value.trim()
  if (!n || !e || !password.value || !password2.value) { setStatus('error', t('auth.required')); return }
  if (n.length < 2) { setStatus('error', t('auth.nameShort')); return }
  if (!isEmail(e)) { setStatus('error', t('auth.emailInvalid')); return }
  const issues = pwIssues(password.value)
  if (issues.length) { setStatus('error', t(issues[0])); return }
  if (password.value !== password2.value) { setStatus('error', t('auth.pwMismatch')); return }

  busy.value = true
  setStatus('info', t('contact.sending'))
  const res = await register(n, e, password.value)
  busy.value = false
  if (res.ok) {
    if (res.needsConfirm) {
      setStatus('success', t('auth.confirmSent'))
    } else {
      setStatus('success', t('auth.created'))
      setTimeout(() => router.push('/'), 1200)
    }
  } else {
    setStatus('error', t(res.err))
  }
}
</script>

<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="auth-logo" aria-hidden="true">✨</div>
      <h1 class="auth-title">{{ L('إنشاء حساب جديد', 'Create a new account') }}</h1>
      <p class="auth-sub">{{ L('مجاني وفوري — يعمل على جميع أجهزتك.', 'Free and instant — works on all your devices.') }}</p>

      <div class="demo-note">
        <span aria-hidden="true">⚠️</span>
        <span v-html="L('<strong>قاعدة بيانات حقيقية:</strong> يُنشأ حسابك في قاعدة بيانات Supabase المشفرة ويعمل على جميع أجهزتك.', '<strong>Real database:</strong> your account is created in Supabase\'s encrypted database and works on every device.')"></span>
      </div>

      <form novalidate @submit.prevent="onSubmit">
        <div class="input-group">
          <label for="reg-name">{{ L('الاسم الكامل', 'Full name') }}</label>
          <input type="text" id="reg-name" v-model="name" :placeholder="L('أدخل اسمك', 'Enter your name')" autocomplete="name" required />
        </div>

        <div class="input-group">
          <label for="reg-email">{{ L('البريد الإلكتروني', 'Email address') }}</label>
          <input type="email" id="reg-email" v-model="email" placeholder="example@email.com" autocomplete="email" style="direction:ltr; text-align:left;" required />
        </div>

        <div class="input-group">
          <label for="reg-pass">{{ L('كلمة المرور', 'Password') }}</label>
          <div class="pw-field">
            <input :type="showPw ? 'text' : 'password'" id="reg-pass" v-model="password" placeholder="••••••••" autocomplete="new-password" required />
            <button type="button" class="pw-toggle" :aria-label="L('إظهار كلمة المرور', 'Show password')" @click="showPw = !showPw">👁️</button>
          </div>
          <div class="pw-strength" aria-hidden="true">
            <span v-for="i in 4" :key="i" :class="{ on: i <= strength }"></span>
          </div>
          <div class="pw-hint" :class="hintKind">{{ pwHint }}</div>
        </div>

        <div class="input-group">
          <label for="reg-pass2">{{ L('تأكيد كلمة المرور', 'Confirm password') }}</label>
          <div class="pw-field">
            <input :type="showPw2 ? 'text' : 'password'" id="reg-pass2" v-model="password2" placeholder="••••••••" autocomplete="new-password" required />
            <button type="button" class="pw-toggle" :aria-label="L('إظهار كلمة المرور', 'Show password')" @click="showPw2 = !showPw2">👁️</button>
          </div>
        </div>

        <button type="submit" class="btn-primary" style="width:100%; margin-top:0.5rem;" :disabled="busy">{{ L('إنشاء الحساب', 'Create account') }}</button>

        <div class="form-status" :class="statusKind" role="status" aria-live="polite">{{ statusText }}</div>
      </form>

      <div class="auth-alt">
        <span>{{ L('لديك حساب بالفعل؟', 'Already have an account?') }}</span>
        <router-link to="/login">{{ L('تسجيل الدخول', 'Sign in') }}</router-link>
      </div>
    </div>
  </div>
</template>