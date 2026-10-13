<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../composables/i18n'
import { useTheme } from '../composables/theme'
import { currentUser, logout } from '../services/auth'
import { useRouter } from 'vue-router'

const { L, isEn, toggleLang } = useI18n()
const { theme, toggleTheme } = useTheme()
const router = useRouter()

const menuOpen = ref(false)
const user = currentUser

const langBtn = computed(() => (isEn.value ? 'عربي' : 'EN'))
const themeBtn = computed(() => (theme.value === 'light' ? '🌙' : '☀️'))
const themeLabel = computed(() =>
  theme.value === 'light'
    ? L('التبديل إلى الوضع الليلي', 'Switch to night mode')
    : L('التبديل إلى الوضع النهاري', 'Switch to day mode')
)

async function doLogout() {
  await logout()
  const name = router.currentRoute.value.name || ''
  if (['login', 'register', 'forgot'].includes(name)) router.push('/')
}

function goAbout() {
  if (router.currentRoute.value.path === '/') {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
  } else {
    router.push('/')
    setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 80)
  }
  menuOpen.value = false
}
</script>

<template>
  <nav class="navbar" :aria-label="L('التنقل الرئيسي', 'Main navigation')">
    <router-link to="/" class="navbar-brand">
      <div class="brand-icon" aria-hidden="true">∑</div>
      <span>{{ L('حاسباتي', 'Hasibati') }}</span>
    </router-link>

    <ul class="navbar-links" :class="{ open: menuOpen }" id="navbar-menu">
      <li><router-link to="/calculator" active-class="active" @click="menuOpen = false">{{ L('الآلة الحاسبة', 'Calculator') }}</router-link></li>
      <li><router-link to="/numbers" active-class="active" @click="menuOpen = false">{{ L('الأنظمة الرقمية', 'Number Systems') }}</router-link></li>
      <li><router-link to="/geometry" active-class="active" @click="menuOpen = false">{{ L('الهندسة', 'Geometry') }}</router-link></li>
      <li><a href="#about" @click.prevent="goAbout">{{ L('من نحن', 'About us') }}</a></li>
      <li><router-link to="/contact" active-class="active" @click="menuOpen = false">{{ L('تواصل', 'Contact') }}</router-link></li>
    </ul>

    <div class="nav-actions">
      <div class="nav-user">
        <template v-if="user">
          <span class="nav-user-chip">
            <span class="nav-user-avatar" aria-hidden="true">{{ (user.name || '?').trim().charAt(0).toUpperCase() }}</span>
            <span class="nav-user-name">{{ user.name }}</span>
          </span>
          <button
            type="button"
            class="nav-logout"
            :title="L('اضغط للخروج من حسابك', 'Click to log out of your account')"
            @click="doLogout"
          >{{ L('تسجيل الخروج', 'Log out') }}</button>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-login-btn">
            <span aria-hidden="true">👤</span>
            <span>{{ L('تسجيل الدخول', 'Sign in') }}</span>
          </router-link>
        </template>
      </div>

      <button class="theme-toggle" type="button" :aria-label="themeLabel" @click="toggleTheme">{{ themeBtn }}</button>
      <button class="lang-toggle" type="button" @click="toggleLang">{{ langBtn }}</button>
      <button
        class="menu-toggle"
        type="button"
        :aria-label="L('فتح القائمة', 'Open menu')"
        :aria-expanded="String(menuOpen)"
        aria-controls="navbar-menu"
        @click="menuOpen = !menuOpen"
      >☰</button>
    </div>
  </nav>
</template>