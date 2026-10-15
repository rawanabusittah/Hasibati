#!/usr/bin/env node
// ============================================================
// screenshots — يولّد لقطات README في docs/screenshots آليًا
//
//   npm run shots              # يبني المشروع ثم يصوّر
//   npm run shots -- --no-build  # يصوّر dist الحالي بلا إعادة بناء
//
// مرة واحدة فقط قبل أول استخدام:
//   npx playwright install chromium
//
// الفكرة: نخدم نسخة الإنتاج عبر `vite preview`، ثم نفتح سياقاً
// معزولاً لكل لقطة نضبط فيه اللغة والثيم قبل تحميل التطبيق
// (عبر localStorage)، فنحصل على صور متطابقة في كل تشغيل.
// ============================================================
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'docs', 'screenshots')
const PORT = Number(process.env.SHOTS_PORT || 4178)
const BASE = `http://127.0.0.1:${PORT}/`
const VIEWPORT = { width: 1000, height: 750 }
const SCALE = 1.5 // أبعاد الصورة 1500×1125 — حِدّة جيدة بحجم معقول

const viteBin = resolve(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
const skipBuild = process.argv.includes('--no-build')

// ── اللقطات: كل واحدة بسياقها (لغة/ثيم) وتفاعلها ──
// ملاحظة: الأقسام تظهر بترتيب الكود في src/lib/calcOps.js
const SHOTS = [
  { file: '01-home-ar-dark.png', lang: 'ar', theme: 'dark', hash: '#/', wait: '.hero-math' },

  { file: '02-home-en-light.png', lang: 'en', theme: 'light', hash: '#/', wait: '.hero-math' },

  {
    file: '03-calculator.png', lang: 'ar', theme: 'dark', hash: '#/calculator',
    wait: '.bar-input',
    async run(page) {
      await page.fill('.bar-input', '2π × sin(30) + 5!')
      await page.waitForFunction(() => /\d/.test(document.querySelector('.bar-result')?.textContent || ''))
    }
  },

  {
    file: '04-statistics.png', lang: 'ar', theme: 'dark', hash: '#/calculator',
    wait: '.bar-steps',
    async run(page) {
      // دالة إحصائية صريحة ⇒ تقرير كامل داخل نافذة الخطوات
      await page.fill('.bar-input', 'med(4,8,6,10,12,7)')
      await page.click('.bar-steps')
      await page.waitForSelector('.steps-card .cx-grid .cx-cell')
    }
  },

  {
    file: '05-complex-polar.png', lang: 'ar', theme: 'dark', hash: '#/calculator',
    wait: '.ops-tab',
    async run(page) {
      await page.locator('.ops-tab', { hasText: 'أعداد مركبة' }).click()
      // الثانية في قسم «أعداد مركبة» = «تحويل إلى القطبية» (x: 1+i)
      const item = page.locator('.ops-list[data-cat="complex"] .ops-item').nth(1)
      await item.locator('.ops-head').click()
      await item.locator('.ops-act').nth(1).click() // «جرّب المثال»
      await page.waitForFunction(() => (document.querySelector('.bar-result')?.textContent || '').includes('∠'))
    }
  },

  {
    file: '06-numbers.png', lang: 'ar', theme: 'dark', hash: '#/numbers',
    wait: '.num-input',
    async run(page) {
      await page.fill('.num-input', '255')
      await page.waitForSelector('.num-info')
    }
  },

  {
    file: '07-geometry.png', lang: 'ar', theme: 'dark', hash: '#/geometry',
    wait: '.geo-panel.active',
    async run(page) {
      const inputs = page.locator('.geo-panel.active input[type="number"]')
      const n = await inputs.count()
      for (let i = 0; i < n; i++) await inputs.nth(i).fill('5')
      await page.locator('.geo-panel.active .btn-primary').click()
      await page.waitForSelector('.geo-res.active .geo-result-item')
    }
  },

  {
    file: '08-auth.png', lang: 'ar', theme: 'dark', hash: '#/login',
    wait: '.as-panel-login'
  }
]

// ── أدوات ──
let server = null

function build() {
  console.log('▸ بناء نسخة الإنتاج…')
  const r = spawnSync(process.execPath, [viteBin, 'build'], { cwd: ROOT, stdio: 'inherit' })
  if (r.status !== 0) {
    console.error('✖ فشل البناء — توقّف توليد اللقطات')
    process.exit(1)
  }
}

function startServer() {
  server = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore'
  })
  server.on('error', (e) => { console.error('✖ تعذّر تشغيل خادم المعاينة:', e.message); process.exit(1) })
}

async function waitForServer(tries = 150) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(BASE)
      if (res.ok) return
    } catch { /* لم يجهز بعد */ }
    await new Promise(r => setTimeout(r, 200))
  }
  throw new Error(`خادم المعاينة لم يستجب على ${BASE} — هل المنفذ ${PORT} مشغول؟`)
}

function stopServer() {
  if (server && !server.killed) server.kill()
}

// ── التصوير ──
async function capture(browser, shot) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    reducedMotion: 'reduce',
    colorScheme: shot.theme,
    locale: shot.lang === 'en' ? 'en-US' : 'ar-EG'
  })

  // اللغة والثيم قبل تحميل أي سكربت (نفس مفاتيح localStorage في التطبيق)
  await context.addInitScript(([lang, theme]) => {
    try {
      localStorage.setItem('hp_lang', lang)
      localStorage.setItem('hp_theme', theme)
    } catch { /* تجاهل */ }
  }, [shot.lang, shot.theme])

  const page = await context.newPage()
  await page.goto(BASE + shot.hash, { waitUntil: 'load' })
  await page.waitForSelector('#main')
  if (shot.wait) await page.waitForSelector(shot.wait, { timeout: 20000 })
  if (shot.run) await shot.run(page)

  // إثبات الهوية البصرية: نُجمّد الانتقالات ليكون الناتج متطابقًا كل مرة
  await page.screenshot({
    path: resolve(OUT, shot.file),
    animations: 'disabled'
  })
  await context.close()
  console.log(`  ✓ ${shot.file}`)
}

async function main() {
  if (!skipBuild) build()
  mkdirSync(OUT, { recursive: true })

  startServer()
  let browser = null
  try {
    await waitForServer()
    browser = await chromium.launch()
    console.log(`▸ تصوير ${SHOTS.length} لقطات من نسخة الإنتاج…`)
    for (const shot of SHOTS) await capture(browser, shot)
    console.log(`✓ تمّ تحديث ${SHOTS.length} صورة في docs/screenshots`)
  } finally {
    if (browser) await browser.close()
    stopServer()
  }
}

main().catch((e) => {
  stopServer()
  console.error('✖ ' + (e && e.message ? e.message : e))
  process.exit(1)
})
