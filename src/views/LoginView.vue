<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/i18n'
import { login, isEmail } from '../services/auth'

const { L, t } = useI18n()
const router = useRouter()

const email = ref('')
const password = ref('')
const remember = ref(true)
const showPw = ref(false)
const statusKind = ref('')
const statusText = ref('')
const busy = ref(false)

function setStatus(kind, text) { statusKind.value = kind; statusText.value = text }

async function onSubmit() {
  if (busy.value) return
  if (!email.value.trim() || !password.value) { setStatus('error', t('auth.required')); return }
  if (!isEmail(email.value)) { setStatus('error', t('auth.emailInvalid')); return }
  busy.value = true
  setStatus('info', t('contact.sending'))
  const res = await login(email.value, password.value)
  busy.value = false
  if (res.ok) {
    setStatus('success', t('auth.ok'))
    setTimeout(() => router.push('/'), 800)
  } else {
    setStatus('error', t(res.err))
  }
}
</script>

<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="auth-logo" aria-hidden="true">🔐</div>
      <h1 class="auth-title">{{ L('مرحباً بعودتك', 'Welcome back') }}</h1>
      <p class="auth-sub">{{ L('سجّل الدخول إلى حسابك في حاسباتي للاستمرار في جلستك.', 'Sign in to your Hasibati account to keep your session.') }}</p>

      <div class="demo-note">
        <span aria-hidden="true">⚠️</span>
        <span v-html="L('<strong>حساب آمن:</strong> يُحفظ حسابك في قاعدة بيانات Supabase المشفرة — لا تشارك كلمة مرورك مع أحد.', '<strong>Secure account:</strong> your account is stored in Supabase\'s encrypted database — never share your password.')"></span>
      </div>

      <form novalidate @submit.prevent="onSubmit">
        <div class="input-group">
          <label for="login-email">{{ L('البريد الإلكتروني', 'Email address') }}</label>
          <input type="email" id="login-email" v-model="email" placeholder="example@email.com" autocomplete="email" style="direction:ltr; text-align:left;" required />
        </div>

        <div class="input-group">
          <label for="login-pass">{{ L('كلمة المرور', 'Password') }}</label>
          <div class="pw-field">
            <input :type="showPw ? 'text' : 'password'" id="login-pass" v-model="password" placeholder="••••••••" autocomplete="current-password" required />
            <button type="button" class="pw-toggle" :aria-label="L('إظهار كلمة المرور', 'Show password')" @click="showPw = !showPw">👁️</button>
          </div>
        </div>

        <div class="auth-links">
          <label style="display:flex; align-items:center; gap:0.4rem; color:var(--text-secondary); cursor:pointer;">
            <input type="checkbox" id="login-remember" v-model="remember" checked style="accent-color:var(--accent); width:16px; height:16px;" />
            <span>{{ L('تذكّرني', 'Keep me signed in') }}</span>
          </label>
          <router-link to="/forgot" class="hot">{{ L('نسيت كلمة المرور؟', 'Forgot password?') }}</router-link>
        </div>

        <button type="submit" class="btn-primary" style="width:100%; margin-top:1.1rem;" :disabled="busy">{{ L('تسجيل الدخول', 'Sign in') }}</button>

        <div class="form-status" :class="statusKind" role="status" aria-live="polite">{{ statusText }}</div>
      </form>

      <div class="auth-alt">
        <span>{{ L('ليس لديك حساب؟', "Don't have an account?") }}</span>
        <router-link to="/register">{{ L('أنشئ واحداً الآن', 'Create one now') }}</router-link>
      </div>
    </div>
  </div>
</template>