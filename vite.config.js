import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // base نسبي: يعمل على GitHub Pages سواء كان الريبو user.github.io
  // أو user.github.io/repo-اسم — لا حاجة لتغييره عند أي استضافة.
  base: './',
  plugins: [
    vue(),
    // ── PWA: قابل للتثبيت + يعمل دون اتصال ──────────────────────────
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'حاسباتي — أدوات رياضية وعلمية',
        short_name: 'حاسباتي',
        description:
          'آلة حاسبة علمية، تحويل الأنظمة الرقمية، وحسّاب هندسي — أدوات رياضية عربية تعمل دون اتصال.',
        lang: 'ar',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#070a12',
        theme_color: '#070a12',
        categories: ['education', 'utilities', 'productivity'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          { name: 'الآلة الحاسبة', short_name: 'الحاسبة', url: './#/calculator' },
          { name: 'الأنظمة الرقمية', short_name: 'الأنظمة', url: './#/numbers' },
          { name: 'الأشكال الهندسية', short_name: 'الهندسة', url: './#/geometry' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff,woff2}'],
        // صورة المعاينة الاجتماعية تُخدَم لزوّاح المنصّات فقط، فلا داعي
        // لتحميلها مسبقاً داخل تطبيق PWA (توفير ~430KB من التخزين المؤقت).
        globIgnores: ['**/og-image.png'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // خطوط Google: تُخزَّن مؤقتًا لتعمل دون اتصال
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-css',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 900
  }
})
