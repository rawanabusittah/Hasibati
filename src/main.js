import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { init as initI18n } from './composables/i18n'
import { init as initTheme } from './composables/theme'

// طبّق الثيم واللغة قبل التركيب لتجنّب وميض الألوان/الاتجاه
initTheme()
initI18n()

createApp(App).use(router).mount('#app')