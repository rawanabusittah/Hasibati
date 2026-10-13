<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/i18n'
import { SITE } from '../services/siteConfig'
import { isEn } from '../composables/i18n'

const { L } = useI18n()

const year = new Date().getFullYear()

const ext = computed(() => [
  [SITE.github, 'GitHub'],
  [SITE.linkedin, 'LinkedIn'],
  [SITE.twitter, 'X'],
  [SITE.repo, L('كود المشروع', 'Source code')]
].filter(x => x[0]))

const mark = computed(() => ({
  GitHub: 'GH',
  LinkedIn: 'in',
  X: '𝕏',
  [L('كود المشروع', 'Source code')]: '</>'
}))

const credit = computed(() => {
  const name = isEn.value
    ? SITE.author.nameEn || SITE.author.nameAr
    : SITE.author.nameAr || SITE.author.nameEn
  return name
    ? (isEn.value ? `Designed & built by ${SITE.author.nameEn || name}` : `تصميم وتطوير ${name}`)
    : L('مشروع شخصي مفتوح', 'An open personal project')
})
</script>

<template>
  <footer class="site-footer">
    <div class="ft-row">
      <router-link to="/" class="ft-brand">
        <span class="ic" aria-hidden="true">∑</span>
        <span>{{ L('حاسباتي', 'Hasibati') }}</span>
      </router-link>
      <nav class="ft-links" :aria-label="L('روابط التذييل', 'Footer links')">
        <router-link to="/calculator">{{ L('الآلة الحاسبة', 'Calculator') }}</router-link>
        <router-link to="/numbers">{{ L('الأنظمة الرقمية', 'Number Systems') }}</router-link>
        <router-link to="/geometry">{{ L('الهندسة', 'Geometry') }}</router-link>
        <router-link to="/">{{ L('من نحن', 'About us') }}</router-link>
        <router-link to="/contact">{{ L('تواصل', 'Contact') }}</router-link>
        <router-link to="/menu">{{ L('خريطة الموقع', 'Site map') }}</router-link>
        <router-link to="/login">{{ L('الحساب', 'Account') }}</router-link>
      </nav>
      <div v-if="ext.length" class="ft-ext">
        <a
          v-for="[url, label] in ext"
          :key="label"
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="label"
          :title="label"
        >{{ mark[label] || label }}</a>
      </div>
    </div>
    <div class="ft-bottom">
      <span>© {{ year }} حاسباتي — {{ credit }}</span>
      <span class="ft-note">{{ L('تعمل بالكامل داخل متصفحك', 'Runs entirely in your browser') }}</span>
      <a href="#main" class="ft-top" :aria-label="L('العودة للأعلى','Back to top')">↑</a>
    </div>
  </footer>
</template>