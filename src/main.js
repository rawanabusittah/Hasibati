import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { init as initI18n } from './composables/i18n'
import { init as initTheme } from './composables/theme'

// ── الأنماط: الترتيب أدناه = ترتيب طبقات الـ cascade، فلا تُعِد ترتيبه ──
// (Vite يجمعها في ملف واحد مُبصَّم باسم يحمل hash ⇒ لا مشكلة كاش قديم)
import './assets/css/style.css' //      1) الأساس: المتغيّرات + reset + RTL
import './assets/css/theme.css' //      2) الثيم الفاتح/الغامق
import './assets/css/calc-ops.css' //   3) تخطيط صفحتَي الحاسبة والهندسة والنتائج
import './assets/css/components.css' // 4) مكوّنات الموقع المشتركة
import './assets/css/design.css' //     5) طبقة اللمسة الأخيرة (تُبطل ما قبلها)

// طبّق الثيم واللغة قبل التركيب لتجنّب وميض الألوان/الاتجاه
initTheme()
initI18n()

createApp(App).use(router).mount('#app')