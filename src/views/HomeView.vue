<script setup>
import { onMounted, onBeforeUnmount, markRaw } from 'vue'
import SheetSolver from '../components/SheetSolver.vue'
import { L } from '../composables/i18n'

// حركات الصفحة الرئيسية كما كانت: بطاقات «لماذا» بالتتابع + عدّ الأرقام
let ioCards = null
let ioFacts = null

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
  const cards = document.querySelectorAll('.why-card')
  cards.forEach((c, i) => {
    c.classList.add('rv')
    c.style.setProperty('--d', i * 0.12 + 's')
  })
  ioCards = new IntersectionObserver((es) => {
    es.forEach((en) => {
      if (!en.isIntersecting) return
      en.target.classList.add('in')
      ioCards.unobserve(en.target)
      setTimeout(() => en.target.classList.remove('rv', 'in'), 900)
    })
  }, { threshold: 0.2 })
  cards.forEach((c) => ioCards.observe(c))

  const facts = document.querySelectorAll('.fact b')
  if (!facts.length) return
  const targets = [...facts].map((b) => parseInt(b.textContent, 10))
  facts.forEach((b) => { b.textContent = '0' })
  ioFacts = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return
    ioFacts.disconnect()
    const t0 = performance.now()
    ;(function step(now) {
      const p = Math.min(1, (now - t0) / 1000), k = 1 - Math.pow(1 - p, 3)
      facts.forEach((b, i) => { b.textContent = Math.round(targets[i] * k) })
      if (p < 1) requestAnimationFrame(step)
    })(t0)
  }, { threshold: 0.4 })
  ioFacts.observe(document.querySelector('.finale-facts'))
})

onBeforeUnmount(() => {
  ioCards?.disconnect()
  ioFacts?.disconnect()
})
</script>

<template>
  <div>
    <section class="hero-math" id="hero">
      <div class="hm-atoms" aria-hidden="true">
        <div class="atom a1">
          <i class="nuc"></i>
          <span class="orb" style="--a: 0deg; --T: 2.6s; --c: var(--accent-4)"><span class="e"><span></span></span></span>
          <span class="orb" style="--a: 60deg; --T: 3.3s; --c: var(--accent)"><span class="e"><span></span></span></span>
          <span class="orb" style="--a: 120deg; --T: 4s; --c: var(--accent-2)"><span class="e"><span></span></span></span>
        </div>
        <div class="atom a2">
          <i class="nuc"></i>
          <span class="orb" style="--a: 120deg; --T: 4s; --c: var(--accent-2)"><span class="e"><span></span></span></span>
          <span class="orb" style="--a: 60deg; --T: 3.3s; --c: var(--accent)"><span class="e"><span></span></span></span>
          <span class="orb" style="--a: 0deg; --T: 2.6s; --c: var(--accent-4)"><span class="e"><span></span></span></span>
        </div>
        <div class="atom a3">
          <i class="nuc"></i>
          <span class="orb" style="--a: 0deg; --T: 2.6s; --c: var(--accent-4)"><span class="e"><span></span></span></span>
          <span class="orb" style="--a: 60deg; --T: 3.3s; --c: var(--accent)"><span class="e"><span></span></span></span>
          <span class="orb" style="--a: 120deg; --T: 4s; --c: var(--accent-2)"><span class="e"><span></span></span></span>
        </div>
      </div>

      <div class="hm-copy">
        <div class="hero-badge">{{ L('مجاني · بلا إعلانات', 'Free · No ads') }}</div>
        <blockquote>
          <h1>{{ L('وَمَن تعلَّم الحساب جَزُلَ رأيُه', 'Whoever learns arithmetic has sharp judgment ...') }}</h1>
        </blockquote>
        <p>{{ L('آلة حاسبة علمية، ومحوّل للأنظمة الرقمية، وأدوات هندسة — باللغتين (العربية ولإنكليزية)', 'Scientific calculator, number system converter, and engineering tools — in both Arabic and English') }}</p>
        <div class="hero-actions">
          <router-link to="/calculator" class="btn-primary">{{ L('افتح الآلة الحاسبة', 'Open the calculator') }}</router-link>
          <router-link to="/services" class="btn-secondary">{{ L('استعرض كل الأدوات', 'Browse all tools') }}</router-link>
        </div>
        <ul class="hm-tools" :aria-label="L('الأدوات', 'Tools')">
          <li>
            <router-link to="/calculator"><code>∑</code> <span>{{ L('الحاسبة', 'Calculator') }}</span></router-link>
          </li>
          <li>
            <router-link to="/numbers"><code>0x</code> <span>{{ L('الأنظمة الرقمية', 'Number systems') }}</span></router-link>
          </li>
          <li>
            <router-link to="/geometry"><code>△</code> <span>{{ L('الهندسة', 'Geometry') }}</span></router-link>
          </li>
        </ul>
      </div>

      <div class="hm-board">
        <SheetSolver />
      </div>
    </section>

    <!-- ════ الأدوات ════ -->
    <section class="block" id="tools" aria-labelledby="tools-h">
      <div class="block-head">
        <h2 id="tools-h">{{ L('الأدوات الرياضية والعلمية', 'Mathematical and Scientific Tools') }}</h2>
        <p>{{ L('اختر أداة وابدأ — لا شيء لتثبّته.', 'Pick one and start — nothing to install.') }}</p>
      </div>
      <div class="cards-grid" style="padding-inline: 0" :aria-label="L('الأدوات الرئيسية', 'Main tools')">
        <router-link to="/calculator" class="card">
          <div class="card-icon blue" aria-hidden="true">∑</div>
          <h3>{{ L('الآلة الحاسبة العلمية', 'Scientific Calculator') }}</h3>
          <p>{{ L('معاينة حيّة ونسبة مئوية صحيحة ومثلثات وتفاضل وتكامل وسجل عمليات ولوحة مفاتيح كاملة.', 'Live preview, real percent logic, trigonometry, calculus, history and full keyboard support.') }}</p>
          <span class="card-arrow" aria-hidden="true">←</span>
        </router-link>
        <router-link to="/numbers" class="card">
          <div class="card-icon purple" aria-hidden="true">0x</div>
          <h3>{{ L('تحويل الأنظمة الرقمية', 'Number Systems Converter') }}</h3>
          <p>{{ L('ثنائي وثماني وعشري وسداسي عشر بدقة BigInt — مع السالب والكسور.', 'Binary, octal, decimal and hex with BigInt precision — negatives and fractions included.') }}</p>
          <span class="card-arrow" aria-hidden="true">←</span>
        </router-link>
        <router-link to="/geometry" class="card">
          <div class="card-icon green" aria-hidden="true">△</div>
          <h3>{{ L('حساب الأشكال الهندسية', 'Geometry Calculator') }}</h3>
          <p>{{ L('الدائرة والمربع والمستطيل والمثلث والكرة — كل نتيجة مع معادلتها.', 'Circle, square, rectangle, triangle and sphere — every result with its formula.') }}</p>
          <span class="card-arrow" aria-hidden="true">←</span>
        </router-link>
      </div>
    </section>

    <!-- ════ قصة حاسباتي ════ -->
    <section class="finale" id="about" aria-labelledby="about-h">
      <div class="finale-in">
        <div class="finale-text">
          <div class="hero-badge">{{ L('قصة حاسباتي', 'Our story') }}</div>
          <h2 id="about-h">{{ L('علومٌ متقنة البراهين نقيّةٌ عن التخمين', 'Sciences precise in proofs, pure from conjecture') }}</h2>
          <p class="finale-lead" style="text-align: justify">
            {{ L('معظم الآلات الحاسبة على الإنترنت مزدحمة، وتتجاهل اللغات من اليمين إلى اليسار، وتعرض الجواب بشكل مختصر دون تفسير الخطوات، لذلك جاءت حاسباتي.', 'Most online calculators are cluttered, ignore right-to-left languages, and show the answer briefly without explaining the steps, so Hasibati came along.') }}
          </p>
          <ul class="fix-list">
            <li>
              <s>{{ L('إعلانات تحجب الجواب', 'Ads covering the answer') }}</s><span aria-hidden="true"></span>
              <b>{{ L('صفحة نظيفة بلا إعلانات', 'A clean page, zero ads') }}</b>
            </li>
            <li>
              <s>{{ L('واجهة عربية معكوسة', 'Flipped Arabic layouts') }}</s><span aria-hidden="true"></span>
              <b>{{ L('RTL أصيل وإنجليزي كامل', 'Real RTL + full English') }}</b>
            </li>
            <li>
              <s>{{ L('عرض النتائج مباشرةً', 'Show the results immediately') }}</s><span aria-hidden="true"></span>
              <b>{{ L('بيان الخطوات والنتائج الصحيحة', 'Statement of the steps and correct results') }}</b>
            </li>
          </ul>
        </div>
        <div class="finale-facts" :aria-label="L('حقائق سريعة', 'Quick facts')">
          <div class="fact"><b>3</b><span>{{ L('أدوات', 'Tools') }}</span></div>
          <div class="fact"><b>0</b><span>{{ L('إعلانات', 'Ads') }}</span></div>
          <div class="fact"><b>2</b><span>{{ L('وضع ليلي ونهاري', 'Themes') }}</span></div>
          <div class="fact"><b>2</b><span>{{ L('لغتان', 'languages') }}</span></div>
        </div>
      </div>
    </section>

    <!-- ════ لماذا حاسباتي ════ -->
    <section class="block" id="why" aria-labelledby="why-h">
      <div class="block-head">
        <h2 id="why-h">{{ L('لماذا حاسباتي؟', 'Why Hasibati?') }}</h2>
        <p>{{ L('ثلاثة أشياء ستلاحظها من الدقيقة الأولى.', 'Three things you will notice in the first minute.') }}</p>
      </div>
      <div class="why-grid">
        <article class="why-card">
          <div class="wv wv-calc" aria-hidden="true">
            <span class="wv-expr" dir="ltr">0.1 + 0.2</span><span class="wv-ans" dir="ltr">= 0.3</span>
          </div>
          <h3>{{ L('نتائج تثق بها', 'Results you can trust') }}</h3>
          <p>{{ L('أولوية صحيحة للعمليات، و12 خانة معنوية، وأخطاء واضحة بدل أرقام خاطئة بصمت.', 'Correct precedence, 12 significant digits, and clear errors instead of silently wrong numbers.') }}</p>
        </article>
        <article class="why-card">
          <div class="wv wv-lang" aria-hidden="true"><span>ع</span><span>A</span></div>
          <h3>{{ L('عربي أولاً، وإنجليزي أيضاً', 'Arabic first, English too') }}</h3>
          <p>{{ L('واجهة حقيقية من اليمين إلى اليسار، ووضع إنجليزي كامل، ووضعان نهاري وليلي.', 'True right-to-left layout, a full English mode, and day and night themes.') }}</p>
        </article>
        <article class="why-card">
          <div class="wv wv-priv" aria-hidden="true">
            <span class="lock">⊘</span><small dir="ltr">0 bytes sent</small>
          </div>
          <h3>{{ L('خاص بطبيعته', 'Private by design') }}</h3>
          <p>{{ L('كل عملية تُحسب داخل متصفحك. لا شيء مما تكتبه يغادره.', 'Every calculation runs in your browser. Nothing you type leaves it.') }}</p>
        </article>
      </div>
    </section>

    <!-- ════ دعوة للبدء ════ -->
    <section class="block" style="padding-top: 0" aria-labelledby="cta-h">
      <div class="cta-band">
        <h2 id="cta-h">{{ L('جاهز للحساب؟', 'Ready to calculate?') }}</h2>
        <div class="hero-actions">
          <router-link to="/calculator" class="btn-primary">{{ L('افتح الآلة الحاسبة', 'Open the calculator') }}</router-link>
          <router-link to="/services" class="btn-secondary">{{ L('استعرض الأدوات', 'Browse tools') }}</router-link>
        </div>
      </div>
    </section>
  </div>
</template>