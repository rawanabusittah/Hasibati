<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../composables/i18n'
import { SITE } from '../services/siteConfig'
import { saveContact } from '../services/cloud'

const { L, t } = useI18n()

const name = ref('')
const email = ref('')
const msg = ref('')
const statusKind = ref('')
const statusText = ref('')

const setStatus = (kind, text) => { statusKind.value = kind; statusText.value = text }

const channels = computed(() => {
  const entries = []
  if (SITE.email) entries.push({ icon: '✉️', label: L('بريد إلكتروني', 'Email'), value: SITE.email, href: 'mailto:' + SITE.email, external: false })
  if (SITE.github) entries.push({ icon: '🗂️', label: 'GitHub', value: SITE.github, href: /^https?:\/\//.test(SITE.github) ? SITE.github : 'https://github.com/' + SITE.github, external: true })
  if (SITE.linkedin) entries.push({ icon: '👥', label: 'LinkedIn', value: SITE.linkedin, href: /^https?:\/\//.test(SITE.linkedin) ? SITE.linkedin : 'https://www.linkedin.com/in/' + SITE.linkedin, external: true })
  if (SITE.twitter) entries.push({ icon: '💬', label: L('منصة X', 'X (Twitter)'), value: SITE.twitter, href: /^https?:\/\//.test(SITE.twitter) ? SITE.twitter : 'https://x.com/' + SITE.twitter, external: true })
  return entries
})

async function onSubmit() {
  const n = name.value.trim()
  const e = email.value.trim()
  const m = msg.value.trim()
  if (!n || !e || !m) { setStatus('error', t('contact.fill')); return }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { setStatus('error', t('contact.email')); return }
  setStatus('info', t('contact.sending'))

  // 1) قاعدة البيانات (Supabase) إن كانت مضبوطة
  try {
    const res = await saveContact(n, e, m)
    if (res && res.tried) {
      setStatus(res.ok ? 'success' : 'error', res.ok ? t('contact.done') : t('contact.failed'))
      if (res.ok) { name.value = ''; email.value = ''; msg.value = '' }
      return
    }
  } catch (err) { /* نكمل للخطوات التالية */ }

  // 2) نموذج خارجي (Formspree)
  if (SITE.formEndpoint) {
    try {
      const resp = await fetch(SITE.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: n, email: e, message: m })
      })
      if (resp.ok) { setStatus('success', t('contact.done')); name.value = ''; email.value = ''; msg.value = '' }
      else setStatus('error', t('contact.failed'))
    } catch (err) { setStatus('error', t('contact.failed')) }
    return
  }

  // 3) تطبيق البريد — الرسالة تُرسل إلى SITE.email
  if (SITE.email) {
    const subject = L('رسالة من ' + n + ' — حاسباتي', 'Message from ' + n + ' — Hasibati')
    window.location.href = 'mailto:' + SITE.email +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(m + '\n\n— ' + n + '\n' + e)
    setStatus('info', t('contact.mailto'))
    return
  }

  setStatus('error', t('contact.notConfigured'))
}
</script>

<template>
  <div class="section ct-wrap">
    <header class="page-head">
      <h1 class="section-title">{{ L('لنتواصل', 'Get in touch') }}</h1>
      <p class="section-sub">{{ L('وجدت خطأً أو لديك فكرة أو ترغب في التعاون؟ يسعدني أن أسمع منك.', "Found a bug, have an idea, or want to collaborate? I'd love to hear from you.") }}</p>
    </header>

    <!-- تنبيه إذا لم تُضف بيانات التواصل بعد -->
    <template v-if="!channels.length">
      <div class="contact-empty ct-empty">
        <span v-html="L('لم تُضَف بيانات التواصل بعد. عبّئ ملف <code>site-config.js</code> وستظهر هنا تلقائياً.', 'Contact details haven\'t been added yet. Fill in <code>site-config.js</code> and they will appear here automatically.')"></span>
      </div>
    </template>

    <div class="ct-grid">
      <!-- النموذج — بطاقة بمظهر بطاقة تسجيل الدخول -->
      <section class="ct-card ct-form-card" aria-labelledby="ct-form-h">
        <h2 id="ct-form-h" class="ct-h">{{ L('أرسل رسالة', 'Send a message') }}</h2>
        <form novalidate @submit.prevent="onSubmit">
          <div class="field-row ct-two">
            <div class="input-group">
              <label for="contact-name">{{ L('الاسم الكامل', 'Full name') }} <span class="req" aria-hidden="true">*</span></label>
              <input type="text" id="contact-name" v-model="name" :placeholder="L('أدخل اسمك', 'Enter your name')" autocomplete="name" required />
            </div>
            <div class="input-group">
              <label for="contact-email">{{ L('بريدك الإلكتروني', 'Your email') }} <span class="req" aria-hidden="true">*</span></label>
              <input type="email" id="contact-email" v-model="email" placeholder="example@email.com" autocomplete="email" style="direction:ltr; text-align:left;" required />
            </div>
          </div>
          <div class="input-group">
            <label for="contact-msg">{{ L('الرسالة', 'Message') }} <span class="req" aria-hidden="true">*</span></label>
            <textarea id="contact-msg" v-model="msg" rows="4" :placeholder="L('اكتب رسالتك هنا...', 'Write your message here...')" required></textarea>
          </div>
          <button type="submit" class="btn-primary">{{ t('contact.send') }}</button>
          <p v-if="SITE.email" class="ct-mail-line">
            <a class="ct-mail" :href="'mailto:' + SITE.email" :aria-label="L('راسلني على ' + SITE.email, 'Email me at ' + SITE.email)">{{ SITE.email }}</a>
          </p>
          <div class="form-status" :class="statusKind" role="status" aria-live="polite">{{ statusText }}</div>
        </form>
      </section>

      <!-- بطاقة الأسئلة الشائعة -->
      <aside class="ct-side">
        <section class="ct-card" aria-labelledby="ct-faq-h">
          <h2 id="ct-faq-h" class="ct-h">{{ L('❓ إجابات سريعة', '❓ Quick answers') }}</h2>
          <details class="ct-faq"><summary>{{ L('هل هو مجاني؟', 'Is it free?') }}</summary><p>{{ L('نعم، بالكامل.', 'Yes, completely.') }}</p></details>
          <details class="ct-faq"><summary>{{ L('هل تحتاج الأدوات حساباً؟', 'Do the tools need an account?') }}</summary><p>{{ L('لا، الحساب اختياري.', 'No. Accounts are optional.') }}</p></details>
          <details class="ct-faq"><summary>{{ L('هل يُرسَل ما أكتبه إلى أي مكان؟', 'Is my input sent anywhere?') }}</summary><p>{{ L('لا — الحسابات تجري في متصفحك.', 'No — calculations run in your browser.') }}</p></details>
          <details class="ct-faq"><summary>{{ L('هل تعمل دون إنترنت؟', 'Does it work offline?') }}</summary><p>{{ L('تعمل الأدوات، لكن الخطوط تُحمَّل من Google Fonts.', 'The tools work, but fonts are loaded from Google Fonts.') }}</p></details>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
/* بطاقات التواصل بمظهر بطاقة تسجيل الدخول، بلون غير الأزرق (البرتقالي)
   لأن الأزرق مخصّص لصفحة الدخول. */
.ct-card {
  --ct-accent: var(--accent-4);
  border-radius: var(--radius-lg);
  box-shadow: 6px 6px 0 var(--shadow-ink);
  overflow: hidden;
}
.ct-card::before { height: 8px; background: var(--ct-accent); }
.ct-h { border-inline-start-color: var(--ct-accent); }

/* الحقول تأخذ لون القسم عند التركيز */
.ct-card .input-group input:focus,
.ct-card .input-group textarea:focus {
  border-color: var(--ct-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ct-accent) 22%, transparent), 3px 3px 0 var(--shadow-ink);
}

/* زر الإرسال بلون القسم بدل الأزرق */
.ct-form-card .btn-primary {
  background: var(--ct-accent);
  border-color: color-mix(in srgb, var(--ct-accent) 70%, #000);
  color: var(--btn-fg);
}
.ct-form-card .btn-primary:hover { filter: brightness(1.06); }

.ct-mail { color: var(--ct-accent); }
.ct-faq summary:hover,
.ct-faq[open] summary::after { color: var(--ct-accent); }
</style>