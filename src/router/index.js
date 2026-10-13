import { createRouter, createWebHashHistory } from 'vue-router'
import { lang, L } from '../composables/i18n'

// ملاحظة: استخدمنا createWebHashHistory ليعمل التطبيق على أي استضافة
// ثابتة (GitHub Pages، فتح index.html محلياً) دون الحاجة لإعداد fallback.

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: ['حاسباتي — أدوات رياضية وعلمية', 'Hasibati — Math & Science Tools'] }
  },
  {
    path: '/calculator',
    name: 'calculator',
    component: () => import('../views/CalculatorView.vue'),
    meta: { title: ['الآلة الحاسبة العلمية — حاسباتي', 'Scientific Calculator — Hasibati'] }
  },
  {
    path: '/numbers',
    name: 'numbers',
    component: () => import('../views/NumbersView.vue'),
    meta: { title: ['تحويل الأنظمة الرقمية — حاسباتي', 'Number Systems Converter — Hasibati'] }
  },
  {
    path: '/geometry',
    name: 'geometry',
    component: () => import('../views/GeometryView.vue'),
    meta: { title: ['حساب الأشكال الهندسية — حاسباتي', 'Geometry Calculator — Hasibati'] }
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('../views/ContactView.vue'),
    meta: { title: ['تواصل — حاسباتي', 'Contact — Hasibati'] }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: ['تسجيل الدخول — حاسباتي', 'Sign in — Hasibati'] }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { title: ['إنشاء حساب جديد — حاسباتي', 'Create account — Hasibati'] }
  },
  {
    path: '/forgot',
    name: 'forgot',
    component: () => import('../views/ForgotView.vue'),
    meta: { title: ['نسيت كلمة المرور — حاسباتي', 'Forgot password — Hasibati'] }
  },
  {
    path: '/menu',
    name: 'menu',
    component: () => import('../views/MenuView.vue'),
    meta: { title: ['القائمة الرئيسية — حاسباتي', 'Site Menu — Hasibati'] }
  },
  {
    path: '/services',
    name: 'services',
    component: () => import('../views/ServicesView.vue'),
    meta: { title: ['كل الأدوات — حاسباتي', 'All Tools — Hasibati'] }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.meta && to.meta.scrollTo) return { el: to.meta.scrollTo, top: 80 }
    return { top: 0 }
  }
})

router.afterEach((to) => {
  const pair = to.meta && to.meta.title
  document.title = Array.isArray(pair) ? (lang.value === 'en' ? pair[1] : pair[0]) : pair || 'حاسباتي'
  // في الحالة الإنجليزية نطبق القيم الإنجليزي تلقائياً عبر الحالة
  document.documentElement.lang = lang.value
})

export default router