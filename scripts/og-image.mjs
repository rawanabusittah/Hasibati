// ============================================================
// og-image.mjs — يولّد صورة المعاينة الاجتماعية public/og-image.png
//
//   npm run og
//
// المقاس 1200×630 (معيار og:image)، وتُنسخ إلى dist/ تلقائياً
// لأنها داخل public/. تعتمد على Playwright (نفس أداة اللقطات).
// ============================================================
import { mkdirSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'public', 'og-image.png')
const WIDTH = 1200
const HEIGHT = 630

// نفس لوحة الألوان الداكنة في src/assets/css/design.css
const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    font-family: 'Cairo', 'Noto Kufi Arabic', sans-serif;
    color: #eef4ff;
    background:
      radial-gradient(900px 520px at 88% -12%, rgba(143,184,255,.30), transparent 62%),
      radial-gradient(760px 460px at 2% 112%, rgba(183,155,255,.24), transparent 62%),
      linear-gradient(150deg, #070a12 0%, #0a1a3a 48%, #0f2350 100%);
  }
  /* شبكة خفيفة كخلفية الموقع */
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(143,184,255,.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(143,184,255,.075) 1px, transparent 1px);
    background-size: 46px 46px;
    -webkit-mask-image: radial-gradient(circle at 50% 38%, #000 30%, transparent 72%);
    mask-image: radial-gradient(circle at 50% 38%, #000 30%, transparent 72%);
  }
  .frame {
    position: absolute; inset: 26px; border-radius: 26px;
    border: 1.5px solid #274a8c;
    box-shadow: inset 0 0 90px rgba(143,184,255,.06);
  }
  .content {
    position: absolute; inset: 0;
    padding: 0 78px; display: flex; flex-direction: column; justify-content: center;
  }
  .row { display: flex; align-items: center; gap: 30px; }
  .badge {
    width: 132px; height: 132px; flex: none; border-radius: 30px;
    display: grid; place-items: center;
    background: linear-gradient(150deg, #ffe14d, #ffa44c);
    color: #0a1a3a;
    font: 600 66px/1 'IBM Plex Mono', monospace;
    box-shadow: 0 0 70px rgba(255,225,77,.25);
  }
  h1 { font-size: 116px; font-weight: 900; line-height: .98; letter-spacing: -1px; }
  .tag { margin-top: 12px; font-size: 34px; font-weight: 700; color: #bccaf0; }
  .chips { display: flex; gap: 16px; margin-top: 44px; }
  .chip {
    font-size: 26px; font-weight: 700; padding: 13px 26px; border-radius: 999px;
    background: rgba(17,43,94,.75); border: 1.5px solid #274a8c; color: #eef4ff;
  }
  .chip b { font-weight: 900; }
  .c1 { border-color: #8fb8ff; } .c1 b { color: #8fb8ff; }
  .c2 { border-color: #4fd8a8; } .c2 b { color: #4fd8a8; }
  .c3 { border-color: #ffa45c; } .c3 b { color: #ffa45c; }
  .expr {
    margin-top: 36px; direction: ltr; text-align: right;
    font: 500 27px/1 'IBM Plex Mono', monospace; color: #ffa45c;
  }
  .meta { margin-top: 26px; font-size: 24px; font-weight: 700; color: #9bb0dd; }
  .dot { color: #5a82d8; }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="frame"></div>
  <div class="content">
    <div class="row">
      <div class="badge">∑</div>
      <div>
        <h1>حاسباتي</h1>
        <div class="tag">أدوات رياضية وعلمية — تعمل في متصفحك</div>
      </div>
    </div>
    <div class="chips">
      <span class="chip c1"><b>آلة حاسبة</b> علمية</span>
      <span class="chip">الأنظمة <b>الرقمية</b></span>
      <span class="chip">٢٢ شكلاً <b>هندسياً</b></span>
    </div>
    <div class="tag" style="margin-top:30px" dir="ltr">
      <span style="font:600 27px/1 'IBM Plex Mono',monospace;color:#ffa45c">2π · sin(30°) + 5! = 123.4159…</span>
    </div>
    <div class="tag" style="margin-top:22px;font-size:24px;color:#9bb0dd">
      283 اختباراً ناجحاً <span class="dot">·</span> PWA قابل للتثبيت <span class="dot">·</span> عربي / English
    </div>
  </div>
</body>
</html>`

async function main() {
  mkdirSync(dirname(OUT), { recursive: true })
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1
    })
    await page.setContent(html, { waitUntil: 'load' })
    // انتظر تحميل الخطوط كي لا تُصوَّر بخط احتياطي
    await page.evaluate(() => document.fonts.ready).catch(() => {})
    await page.waitForTimeout(400)

    // حماية من الفائض: الصورة يجب أن تكون 1200×630 بالضبط بلا تمرير
    const box = await page.evaluate(() => {
      const d = document.documentElement
      return { w: d.scrollWidth, h: d.scrollHeight }
    })
    if (box.w > WIDTH || box.h > HEIGHT) {
      console.warn(`⚠ تحذير: المحتوى أكبر من الإطار (${box.w}×${box.h}) — عدّل المقاسات في القالب.`)
    }

    await page.screenshot({ path: OUT })
    const { size } = statSync(OUT)
    console.log(`✓ ${OUT} (${WIDTH}×${HEIGHT}, ${(size / 1024).toFixed(0)} KB)`)
  } finally {
    await browser.close()
  }
}

main().catch((e) => {
  console.error('✖ ' + (e && e.message ? e.message : e))
  process.exit(1)
})
