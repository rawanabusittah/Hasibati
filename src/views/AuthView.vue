<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '../composables/i18n'
import { login, register, isEmail, pwIssues, pwStrength } from '../services/auth'

const { L, t, lang } = useI18n()
const route = useRoute()
const router = useRouter()

// الوضع الحالي مبني على المسار: /register يفتح لوحة التسجيل، وأي مسار آخر لوحة الدخول.
const isRegister = computed(() => route.name === 'register')
const dir = computed(() => (lang.value === 'en' ? 'ltr' : 'rtl'))

function go(mode) {
  const toRegister = mode === 'register'
  if (toRegister === isRegister.value) return
  router.push(toRegister ? '/register' : '/login')
}

/* ══════════ تسجيل الدخول ══════════ */
const lEmail = ref('')
const lPassword = ref('')
const lRemember = ref(true)
const lShowPw = ref(false)
const lKind = ref('')
const lText = ref('')
const lBusy = ref(false)
function setL(kind, text) { lKind.value = kind; lText.value = text }

async function onLogin() {
  if (lBusy.value) return
  if (!lEmail.value.trim() || !lPassword.value) { setL('error', t('auth.required')); return }
  if (!isEmail(lEmail.value)) { setL('error', t('auth.emailInvalid')); return }
  lBusy.value = true
  setL('info', t('contact.sending'))
  const res = await login(lEmail.value, lPassword.value)
  lBusy.value = false
  if (res.ok) {
    setL('success', t('auth.ok'))
    setTimeout(() => router.push('/'), 800)
  } else {
    setL('error', t(res.err))
  }
}

/* ══════════ إنشاء حساب ══════════ */
const rName = ref('')
const rEmail = ref('')
const rPassword = ref('')
const rPassword2 = ref('')
const rShowPw = ref(false)
const rShowPw2 = ref(false)
const rKind = ref('')
const rText = ref('')
const rBusy = ref(false)
function setR(kind, text) { rKind.value = kind; rText.value = text }

const strength = computed(() => pwStrength(rPassword.value))
const pwHint = computed(() => {
  if (!rPassword.value) return t('auth.pwHintDefault')
  const issues = pwIssues(rPassword.value)
  return issues.length ? t(issues[0]) : t('auth.pwOk')
})
const hintKind = computed(() => (rPassword.value && pwIssues(rPassword.value).length === 0 ? 'ok' : ''))

async function onRegister() {
  if (rBusy.value) return
  const n = rName.value.trim()
  const e = rEmail.value.trim()
  if (!n || !e || !rPassword.value || !rPassword2.value) { setR('error', t('auth.required')); return }
  if (n.length < 2) { setR('error', t('auth.nameShort')); return }
  if (!isEmail(e)) { setR('error', t('auth.emailInvalid')); return }
  const issues = pwIssues(rPassword.value)
  if (issues.length) { setR('error', t(issues[0])); return }
  if (rPassword.value !== rPassword2.value) { setR('error', t('auth.pwMismatch')); return }

  rBusy.value = true
  setR('info', t('contact.sending'))
  const res = await register(n, e, rPassword.value)
  rBusy.value = false
  if (res.ok) {
    if (res.needsConfirm) {
      setR('success', t('auth.confirmSent'))
    } else {
      setR('success', t('auth.created'))
      setTimeout(() => router.push('/'), 1200)
    }
  } else {
    setR('error', t(res.err))
  }
}
</script>

<template>
  <div class="as-wrap">
    <!-- حركة خلفية خفيفة -->
    <div class="as-bg" aria-hidden="true"><span></span><span></span><span></span></div>

    <!-- مبدّل الجوّال: يظهر فقط على الشاشات الصغيرة -->
    <div class="as-tabs" role="tablist">
      <button type="button" role="tab" :aria-selected="!isRegister" :class="{ active: !isRegister }" @click="go('login')">
        {{ L('تسجيل الدخول', 'Sign in') }}
      </button>
      <button type="button" role="tab" :aria-selected="isRegister" :class="{ active: isRegister }" @click="go('register')">
        {{ L('إنشاء حساب', 'Sign up') }}
      </button>
    </div>

    <div class="as-shell" :dir="dir" :class="{ 'is-register': isRegister }">
      <div class="as-stage">
        <div class="as-forms">
          <!-- لوحة تسجيل الدخول -->
          <section class="as-panel as-panel-login" :inert="isRegister || null">
            <div class="as-content">
              <h1 class="as-title">{{ L('تسجيل الدخول', 'Sign in') }}</h1>
              <p class="as-sub">{{ L('أدخل بياناتك للوصول إلى نتائجك المحفوظة.', 'Enter your details to reach your saved results.') }}</p>

              <form novalidate @submit.prevent="onLogin">
                <div class="input-group">
                  <label for="login-email">{{ L('البريد الإلكتروني', 'Email address') }}</label>
                  <input type="email" id="login-email" v-model="lEmail" placeholder="example@email.com" autocomplete="email" style="direction:ltr; text-align:left;" required />
                </div>

                <div class="input-group">
                  <label for="login-pass">{{ L('كلمة المرور', 'Password') }}</label>
                  <div class="pw-field">
                    <input :type="lShowPw ? 'text' : 'password'" id="login-pass" v-model="lPassword" placeholder="••••••••" autocomplete="current-password" required />
                    <button type="button" class="pw-toggle" :aria-label="L('إظهار كلمة المرور', 'Show password')" @click="lShowPw = !lShowPw">👁️</button>
                  </div>
                </div>

                <div class="auth-links">
                  <label style="display:flex; align-items:center; gap:0.4rem; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" id="login-remember" v-model="lRemember" checked style="accent-color:var(--accent); width:16px; height:16px;" />
                    <span>{{ L('تذكّرني', 'Keep me signed in') }}</span>
                  </label>
                  <router-link to="/forgot" class="hot">{{ L('نسيت كلمة المرور؟', 'Forgot password?') }}</router-link>
                </div>

                <button type="submit" class="btn-primary as-submit" :disabled="lBusy">{{ L('تسجيل الدخول', 'Sign in') }}</button>

                <div class="form-status" :class="lKind" role="status" aria-live="polite">{{ lText }}</div>
              </form>

              <div class="auth-alt as-alt-switch">
                <span>{{ L('ليس لديك حساب؟', "Don't have an account?") }}</span>
                <button type="button" class="as-link" @click="go('register')">{{ L('أنشئ واحداً الآن', 'Create one now') }}</button>
              </div>
            </div>
          </section>

          <!-- لوحة إنشاء الحساب -->
          <section class="as-panel as-panel-register" :inert="!isRegister || null">
            <div class="as-content">
              <h1 class="as-title">{{ L('إنشاء حساب جديد', 'Create account') }}</h1>
              <p class="as-sub">{{ L('مجاني وفوري — يعمل على جميع أجهزتك.', 'Free and instant — works on all your devices.') }}</p>

              <form novalidate @submit.prevent="onRegister">
                <div class="input-group">
                  <label for="reg-name">{{ L('الاسم الكامل', 'Full name') }}</label>
                  <input type="text" id="reg-name" v-model="rName" :placeholder="L('أدخل اسمك', 'Enter your name')" autocomplete="name" required />
                </div>

                <div class="input-group">
                  <label for="reg-email">{{ L('البريد الإلكتروني', 'Email address') }}</label>
                  <input type="email" id="reg-email" v-model="rEmail" placeholder="example@email.com" autocomplete="email" style="direction:ltr; text-align:left;" required />
                </div>

                <div class="input-group">
                  <label for="reg-pass">{{ L('كلمة المرور', 'Password') }}</label>
                  <div class="pw-field">
                    <input :type="rShowPw ? 'text' : 'password'" id="reg-pass" v-model="rPassword" placeholder="••••••••" autocomplete="new-password" required />
                    <button type="button" class="pw-toggle" :aria-label="L('إظهار كلمة المرور', 'Show password')" @click="rShowPw = !rShowPw">👁️</button>
                  </div>
                  <div class="pw-strength" :class="'s' + strength" aria-hidden="true">
                    <span v-for="i in 4" :key="i"></span>
                  </div>
                  <div class="pw-hint" :class="hintKind">{{ pwHint }}</div>
                </div>

                <div class="input-group">
                  <label for="reg-pass2">{{ L('تأكيد كلمة المرور', 'Confirm password') }}</label>
                  <div class="pw-field">
                    <input :type="rShowPw2 ? 'text' : 'password'" id="reg-pass2" v-model="rPassword2" placeholder="••••••••" autocomplete="new-password" required />
                    <button type="button" class="pw-toggle" :aria-label="L('إظهار كلمة المرور', 'Show password')" @click="rShowPw2 = !rShowPw2">👁️</button>
                  </div>
                </div>

                <button type="submit" class="btn-primary as-submit" :disabled="rBusy">{{ L('إنشاء الحساب', 'Create account') }}</button>

                <div class="form-status" :class="rKind" role="status" aria-live="polite">{{ rText }}</div>
              </form>

              <div class="auth-alt as-alt-switch">
                <span>{{ L('لديك حساب بالفعل؟', 'Already have an account?') }}</span>
                <button type="button" class="as-link" @click="go('login')">{{ L('تسجيل الدخول', 'Sign in') }}</button>
              </div>
            </div>
          </section>
        </div>

        <!-- اللوحة الجانبية المتحركة (المربّع الثاني) -->
        <div class="as-overlay">
          <div class="as-overlay-inner">
            <div class="as-overlay-panel as-overlay-signin">
              <div class="as-content">
                <h2 class="as-ov-title as-ov-badge">{{ L('مرحباً بعودتك!', 'Welcome back!') }}</h2>
                <p class="as-ov-text">{{ L('لديك حساب بالفعل؟ سجّل الدخول لمتابعة نتائجك المحفوظة.', 'Already registered? Sign in to continue with your saved results.') }}</p>
                <button type="button" class="as-ghost-btn" @click="go('login')">{{ L('تسجيل الدخول', 'Sign in') }}</button>
              </div>
            </div>

            <div class="as-overlay-panel as-overlay-signup">
              <div class="as-content">
                <h2 class="as-ov-title as-ov-badge">{{ L('مرحباً بك!', 'Hello, friend!') }}</h2>
                <p class="as-ov-text">{{ L('أنشئ حساباً مجانياً واحفظ كل نتائجك على جميع أجهزتك.', 'Create a free account and keep all your results on every device.') }}</p>
                <button type="button" class="as-ghost-btn" @click="go('register')">{{ L('إنشاء حساب جديد', 'Create account') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.as-wrap {
  position: relative;
  max-width: 940px;
  margin: 0 auto;
  padding: 2.6rem clamp(1rem, 4vw, 2rem) 4rem;
}

/* ══════════ حركة الخلفية ══════════ */
.as-bg {
  position: absolute;
  inset: -6% -4%;
  z-index: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  pointer-events: none;
}
.as-bg span {
  position: absolute;
  width: clamp(160px, 34vw, 300px);
  aspect-ratio: 1;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0.3;
}
.as-bg span:nth-child(1) {
  background: var(--accent);
  top: -6%;
  inset-inline-start: -4%;
  animation: as-drift-a 16s ease-in-out infinite;
}
.as-bg span:nth-child(2) {
  background: var(--accent-2);
  bottom: -10%;
  inset-inline-end: -6%;
  animation: as-drift-b 19s ease-in-out infinite;
}
.as-bg span:nth-child(3) {
  background: var(--hl);
  top: 42%;
  inset-inline-start: 46%;
  opacity: 0.2;
  animation: as-drift-c 22s ease-in-out infinite;
}
@keyframes as-drift-a {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(18%, 20%) scale(1.12); }
}
@keyframes as-drift-b {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-16%, -18%) scale(1.1); }
}
@keyframes as-drift-c {
  0%, 100% { transform: translate(0, 0) scale(0.9); }
  50% { transform: translate(-20%, 14%) scale(1.15); }
}

/* ══════════ المبدّل (يظهر على الجوّال فقط) ══════════ */
.as-tabs {
  position: relative;
  z-index: 1;
  display: none;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.as-tabs button {
  flex: 1;
  min-height: 46px;
  font: inherit;
  font-weight: 800;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 2px solid var(--line);
  border-radius: 10px;
  box-shadow: 2px 2px 0 var(--shadow-ink);
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition), background var(--transition), color var(--transition);
}
.as-tabs button.active {
  background: var(--hl);
  color: #0d1633;
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--shadow-ink);
}

/* ══════════ الإطار ══════════ */
.as-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 560px;
  overflow: hidden;
  background: var(--bg-card);
  border: 2px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: 6px 6px 0 var(--shadow-ink);
  transition: height 0.65s cubic-bezier(0.66, 0, 0.34, 1);
}
.as-shell.is-register { height: 792px; }

.as-stage { position: absolute; inset: 0; }

/* ══════════ اللوحات (النماذج) ══════════ */
.as-forms { position: absolute; inset: 0; }

.as-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1.4rem clamp(1.3rem, 3vw, 2.6rem);
  overflow-y: auto;
  background: var(--bg-card);
  transition: transform 0.65s cubic-bezier(0.66, 0, 0.34, 1), opacity 0.4s ease;
}
.as-panel-login { z-index: 2; }
.as-panel-register { z-index: 1; opacity: 0; }

.as-shell.is-register .as-panel-login { transform: translateX(100%); }
.as-shell.is-register .as-panel-register { transform: translateX(100%); opacity: 1; z-index: 3; }

.as-content { margin: auto 0; width: 100%; }

.as-title {
  font-size: clamp(1.25rem, 3.6vw, 1.6rem);
  font-weight: 900;
  color: var(--text-primary);
  margin-bottom: 0.3rem;
}
.as-sub {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
}
.as-content :deep(.input-group) { margin-bottom: 0.9rem; }
.as-submit { width: 100%; margin-top: 0.9rem; }
.as-alt-switch { justify-content: center; text-align: center; margin-top: 1rem; }
.as-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-weight: 700;
  color: var(--accent);
  cursor: pointer;
  text-decoration: none;
}
.as-link:hover { text-decoration: underline; }

/* ══════════ اللوحة الجانبية المتحركة ══════════ */
.as-overlay {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  z-index: 5;
  transition: transform 0.65s cubic-bezier(0.66, 0, 0.34, 1);
}
.as-overlay-inner {
  position: relative;
  left: -100%;
  width: 200%;
  height: 100%;
  background: var(--btn-bg);
  background-image:
    linear-gradient(color-mix(in srgb, var(--btn-fg) 16%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--btn-fg) 16%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
  transition: transform 0.65s cubic-bezier(0.66, 0, 0.34, 1);
}
.as-overlay-panel {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.65s cubic-bezier(0.66, 0, 0.34, 1);
}
.as-overlay-signin { left: 0; transform: translateX(-20%); }
.as-overlay-signup { left: 50%; transform: translateX(0); }

.as-overlay .as-content {
  margin: auto 0;
  padding: clamp(1.3rem, 3vw, 2.2rem);
  text-align: center;
  color: var(--btn-fg);
}
.as-shell.is-register .as-overlay { transform: translateX(-100%); }
.as-shell.is-register .as-overlay-inner { transform: translateX(50%); }
.as-shell.is-register .as-overlay-signin { transform: translateX(0); }
.as-shell.is-register .as-overlay-signup { transform: translateX(20%); }

.as-ov-badge {
  display: inline-block;
  font-size: clamp(1.05rem, 3.1vw, 1.35rem);
  font-weight: 900;
  color: #0d1633;
  background: var(--hl);
  border: 2px solid var(--line);
  border-radius: 14px;
  padding: 0.55rem 1.15rem;
  box-shadow: 3px 3px 0 var(--shadow-ink);
  margin-bottom: 1rem;
}
.as-ov-title { font-size: clamp(1.2rem, 3.4vw, 1.5rem); font-weight: 900; margin-bottom: 0.5rem; }
.as-ov-text { font-size: 0.9rem; line-height: 1.8; margin-bottom: 1.4rem; opacity: 0.95; }

.as-ghost-btn {
  min-height: 46px;
  padding: 0 1.6rem;
  font: inherit;
  font-weight: 800;
  color: var(--btn-fg);
  background: transparent;
  border: 2px solid var(--btn-fg);
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition), color var(--transition), transform var(--transition);
}
.as-ghost-btn:hover { background: var(--btn-fg); color: var(--btn-bg); transform: translateY(-1px); }

/* ══════════ الاتجاه من اليمين إلى اليسار (العربية) ══════════
   نُعكس كل المواضع الأفقية والإزاحات يدوياً (بدل قلب المسرح) لضمان
   أن تظهر اللوحة الجانبية داخل نافذتها بشكل صحيح. */
.as-shell[dir="rtl"] .as-panel-login,
.as-shell[dir="rtl"] .as-panel-register { left: auto; right: 0; }
.as-shell[dir="rtl"].is-register .as-panel-login,
.as-shell[dir="rtl"].is-register .as-panel-register { transform: translateX(-100%); }

.as-shell[dir="rtl"] .as-overlay { left: auto; right: 50%; }
.as-shell[dir="rtl"] .as-overlay-inner { left: auto; right: -100%; }
.as-shell[dir="rtl"].is-register .as-overlay { transform: translateX(100%); }
.as-shell[dir="rtl"].is-register .as-overlay-inner { transform: translateX(-50%); }

.as-shell[dir="rtl"] .as-overlay-signin { left: auto; right: 0; transform: translateX(20%); }
.as-shell[dir="rtl"].is-register .as-overlay-signin { transform: translateX(0); }
.as-shell[dir="rtl"] .as-overlay-signup { left: auto; right: 50%; transform: translateX(0); }
.as-shell[dir="rtl"].is-register .as-overlay-signup { transform: translateX(-20%); }

/* ══════════ استجابة الجوّال ══════════ */
@media (max-width: 780px) {
  .as-tabs { display: flex; }
  .as-shell { height: auto; min-height: 0; box-shadow: 4px 4px 0 var(--shadow-ink); }
  .as-shell.is-register { height: auto; }
  .as-stage { position: relative; inset: auto; }
  .as-forms { position: relative; inset: auto; }
  .as-panel {
    position: relative;
    left: auto;
    right: auto;
    width: 100%;
    height: auto;
    opacity: 1;
    transform: none !important;
    overflow: visible;
    display: none;
    padding: 1.6rem clamp(1.1rem, 4vw, 1.6rem);
  }
  .as-panel-login { display: flex; }
  .as-shell.is-register .as-panel-login { display: none; }
  .as-shell.is-register .as-panel-register { display: flex; }
  .as-overlay { display: none; }
  .as-alt-switch { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .as-panel,
  .as-overlay,
  .as-overlay-inner,
  .as-overlay-panel { transition: none !important; }
  .as-bg span { animation: none !important; }
}
</style>
