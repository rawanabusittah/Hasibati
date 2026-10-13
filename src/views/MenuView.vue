<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/i18n'

const { L } = useI18n()
const router = useRouter()

function goAbout() {
  if (router.currentRoute.value.path === '/') {
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
  } else {
    router.push('/')
    setTimeout(() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }), 80)
  }
}
</script>

<template>
  <div class="section">
    <!-- رأس -->
    <header style="text-align:center; margin-bottom:2.5rem;">
      <div class="hero-badge">{{ L('🗺️ خريطة الموقع', '🗺️ Site map') }}</div>
      <h1 class="section-title" style="text-align:center; margin-top:0.75rem;">{{ L('القائمة الرئيسية', 'Site Menu') }}</h1>
      <p class="section-sub" style="text-align:center; margin-bottom:0;">{{ L('جميع صفحات الموقع في مكان واحد', 'All site pages in one place') }}</p>
    </header>

    <!-- قسم الخدمات الأساسية -->
    <div class="menu-section-title">{{ L('🛠️ الخدمات الأساسية', '🛠️ Core services') }}</div>
    <div class="main-menu-grid">
      <router-link to="/calculator" class="menu-item">
        <div class="menu-item-icon card-icon blue" aria-hidden="true" style="width:46px;height:46px;font-size:1.3rem;margin-bottom:0;">🔬</div>
        <div class="menu-item-text">
          <strong>{{ L('الآلة الحاسبة العلمية', 'Scientific Calculator') }}</strong>
          <span>{{ L('عمليات رياضية كاملة', 'Full math operations') }}</span>
        </div>
      </router-link>

      <router-link to="/numbers" class="menu-item">
        <div class="menu-item-icon card-icon purple" aria-hidden="true" style="width:46px;height:46px;font-size:1.3rem;margin-bottom:0;">⚙️</div>
        <div class="menu-item-text">
          <strong>{{ L('الأنظمة الرقمية', 'Number Systems') }}</strong>
          <span>Binary / Hex / Octal</span>
        </div>
      </router-link>

      <router-link to="/geometry" class="menu-item">
        <div class="menu-item-icon card-icon green" aria-hidden="true" style="width:46px;height:46px;font-size:1.3rem;margin-bottom:0;">📐</div>
        <div class="menu-item-text">
          <strong>{{ L('الأشكال الهندسية', 'Geometry Shapes') }}</strong>
          <span>{{ L('مساحة ومحيط وقطر', 'Area, perimeter and diagonal') }}</span>
        </div>
      </router-link>
    </div>

    <!-- قسم الصفحات العامة -->
    <div class="menu-section-title">{{ L('📄 صفحات الموقع', '📄 Site pages') }}</div>
    <div class="main-menu-grid">
      <router-link to="/" class="menu-item">
        <div class="menu-item-icon" aria-hidden="true" style="background:rgba(79,156,249,0.15);">🏠</div>
        <div class="menu-item-text">
          <strong>{{ L('الصفحة الرئيسية', 'Home page') }}</strong>
          <span>{{ L('نظرة عامة على الموقع', 'Overview of the site') }}</span>
        </div>
      </router-link>

      <router-link to="/services" class="menu-item">
        <div class="menu-item-icon" aria-hidden="true" style="background:rgba(52,211,153,0.15);">📋</div>
        <div class="menu-item-text">
          <strong>{{ L('صفحة الخدمات', 'Services page') }}</strong>
          <span>{{ L('وصف مفصل لكل خدمة', 'Detailed description of each service') }}</span>
        </div>
      </router-link>

      <a href="#about" class="menu-item" @click.prevent="goAbout">
        <div class="menu-item-icon" aria-hidden="true" style="background:rgba(167,139,250,0.15);">ℹ️</div>
        <div class="menu-item-text">
          <strong>{{ L('من نحن', 'About us') }}</strong>
          <span>{{ L('تعرف على الموقع', 'Learn about the site') }}</span>
        </div>
      </a>

      <router-link to="/contact" class="menu-item">
        <div class="menu-item-icon" aria-hidden="true" style="background:rgba(251,146,60,0.15);">✉️</div>
        <div class="menu-item-text">
          <strong>{{ L('تواصل معنا', 'Contact us') }}</strong>
          <span>{{ L('نموذج الرسائل والتواصل', 'Message and contact form') }}</span>
        </div>
      </router-link>

      <router-link to="/menu" class="menu-item" aria-current="page" style="border-color:var(--border-glow);">
        <div class="menu-item-icon" aria-hidden="true" style="background:rgba(79,156,249,0.2);">🗺️</div>
        <div class="menu-item-text">
          <strong>{{ L('القائمة الرئيسية', 'Site menu') }}</strong>
          <span>{{ L('أنت هنا الآن', 'You are here now') }}</span>
        </div>
      </router-link>
    </div>

    <!-- قسم الحساب -->
    <div class="menu-section-title">{{ L('👤 الحساب', '👤 Account') }}</div>
    <div class="main-menu-grid">
      <router-link to="/login" class="menu-item">
        <div class="menu-item-icon" aria-hidden="true" style="background:rgba(79,156,249,0.15);">🔑</div>
        <div class="menu-item-text">
          <strong>{{ L('تسجيل الدخول', 'Sign in') }}</strong>
          <span>{{ L('ادخل إلى حسابك', 'Access your account') }}</span>
        </div>
      </router-link>

      <router-link to="/register" class="menu-item">
        <div class="menu-item-icon" aria-hidden="true" style="background:rgba(52,211,153,0.15);">✨</div>
        <div class="menu-item-text">
          <strong>{{ L('إنشاء حساب جديد', 'Create account') }}</strong>
          <span>{{ L('تسجيل مجاني وفوري', 'Free and instant registration') }}</span>
        </div>
      </router-link>

      <router-link to="/forgot" class="menu-item">
        <div class="menu-item-icon" aria-hidden="true" style="background:rgba(251,146,60,0.15);">🔐</div>
        <div class="menu-item-text">
          <strong>{{ L('نسيت كلمة المرور', 'Forgot password') }}</strong>
          <span>{{ L('استعد الوصول برمز تحقق', 'Recover access via code') }}</span>
        </div>
      </router-link>
    </div>

    <!-- قسم التعليمات السريعة -->
    <div class="menu-section-title" style="margin-top:2.5rem;">{{ L('💡 تلميحات الاستخدام', '💡 Quick tips') }}</div>
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:1rem;">
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; transition:all var(--transition);">
        <div style="font-size:1.2rem; margin-bottom:0.5rem;">⌨️</div>
        <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.3rem;">{{ L('الآلة الحاسبة', 'Calculator') }}</div>
        <div style="font-size:0.83rem; color:var(--text-secondary);">{{ L('تدعم الكتابة من لوحة المفاتيح — اضغط Enter لعرض النتيجة و Esc للمسح.', 'Supports keyboard input — press Enter for the result and Esc to clear.') }}</div>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; transition:all var(--transition);">
        <div style="font-size:1.2rem; margin-bottom:0.5rem;">↩️</div>
        <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.3rem;">{{ L('جميع الأدوات', 'All tools') }}</div>
        <div style="font-size:0.83rem; color:var(--text-secondary);">{{ L('اضغط Enter بعد إدخال القيمة في أي حقل للحصول على النتيجة فوراً دون النقر على الزر.', 'Press Enter after entering a value in any field to get the result instantly without clicking the button.') }}</div>
      </div>
      <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; transition:all var(--transition);">
        <div style="font-size:1.2rem; margin-bottom:0.5rem;">📱</div>
        <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.3rem;">{{ L('الموبايل', 'Mobile') }}</div>
        <div style="font-size:0.83rem; color:var(--text-secondary);">{{ L('الموقع متجاوب بالكامل ويعمل على جميع أحجام الشاشات دون أي مشاكل.', 'The site is fully responsive and works on all screen sizes without any issues.') }}</div>
      </div>
    </div>
  </div>
</template>