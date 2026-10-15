<script setup>
// بطاقات «نصائح سريعة» أسفل صفحة الآلة الحاسبة — محتوى ثابت يتبع اللغة فقط.
import { useI18n } from '../composables/i18n'

const { L } = useI18n()
</script>

<template>
  <section class="cheat-sec" aria-labelledby="cheat-head">
    <header class="cheat-sec-head">
      <h2 id="cheat-head">{{ L('نصائح سريعة', 'Quick tips') }}</h2>
      <p>{{ L('اختصارات وقواعد توفّر عليك الوقت.', 'Shortcuts and rules that save you time.') }}</p>
    </header>
    <div class="cheat-grid">
      <div class="cheat">
        <div class="cheat-icon blue" aria-hidden="true">%</div>
        <h3>{{ L('النسبة المئوية الذكية', 'Smart percent') }}</h3>
        <p><code>200+10%</code> {{ L('تضيف 10% من 200 فتصبح 220. وحدها،', 'adds 10% of 200 → 220. On its own,') }} <code>50%</code> {{ L('تساوي 0.5.', 'is 0.5.') }}</p>
      </div>
      <div class="cheat">
        <div class="cheat-icon purple" aria-hidden="true">πx</div>
        <h3>{{ L('الضرب الضمني', 'Implicit multiplication') }}</h3>
        <p>{{ L('اكتب', 'Write') }} <code>2π</code> {{ L('أو', 'or') }} <code>3(4+1)</code> {{ L('أو', 'or') }} <code>2sin(30)</code> {{ L('دون الحاجة إلى ×.', 'without typing ×.') }}</p>
      </div>
      <div class="cheat">
        <div class="cheat-icon green" aria-hidden="true">∫</div>
        <h3>{{ L('التفاضل والتكامل', 'Calculus') }}</h3>
        <p>{{ L('استخدم', 'Use') }} <b>x</b> {{ L('كمتغير:', 'as the variable:') }} <code>diff(x^2,3)</code> = 6 {{ L('و', 'and') }} <code>int(x^2,0,3)</code> = 9. {{ L('النتائج عددية.', 'Results are numeric.') }}</p>
      </div>
      <div class="cheat">
        <div class="cheat-icon red" aria-hidden="true">⚠</div>
        <h3>{{ L('أخطاء واضحة', 'Clear errors') }}</h3>
        <p>{{ L('القسمة على صفر أو', 'Dividing by zero,') }} <code>tan(90)</code> {{ L('أو', 'or') }} <code>log(0)</code> {{ L('تُظهر رسالة واضحة بدل رقم خاطئ.', 'show a clear message instead of a wrong number.') }}</p>
      </div>
    </div>
  </section>
</template>
