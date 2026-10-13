<script setup>
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppNav from './components/AppNav.vue'
import AppFooter from './components/AppFooter.vue'
import { useI18n } from './composables/i18n'
import { setupScrollProgress } from './composables/theme'

const { L, lang } = useI18n()
const router = useRouter()

// حدّث عنوان الصفحة عندما تتغيّر اللغة دون تنقّل
watch(lang, () => {
  const pair = router.currentRoute.value.meta && router.currentRoute.value.meta.title
  document.title = Array.isArray(pair) ? (lang.value === 'en' ? pair[1] : pair[0]) : pair || 'حاسباتي'
})

onMounted(() => {
  setupScrollProgress()
})
</script>

<template>
  <a class="skip-link" href="#main">{{ L('تخطي إلى المحتوى', 'Skip to content') }}</a>
  <AppNav />
  <main id="main" class="page-wrapper page-enter" :class="{ 'page-fit': $route.meta && $route.meta.fit }">
    <router-view v-slot="{ Component }">
      <transition name="route-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  <AppFooter />
</template>

<style>
/* انتقال هادئ بين الصفحات داخل التطبيق (لا يؤثر على تصميم الموقع) */
.route-fade-enter-active,
.route-fade-leave-active {
  transition: opacity 0.18s ease;
}
.route-fade-enter-from,
.route-fade-leave-to {
  opacity: 0;
}
</style>