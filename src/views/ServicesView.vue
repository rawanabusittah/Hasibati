<script setup>
import { useI18n } from '../composables/i18n'

const { L } = useI18n()
</script>

<template>
  <div class="section">
    <header class="page-head">
      <div class="hero-badge">{{ L('🛠️ الأدوات', '🛠️ Tools') }}</div>
      <h1 class="section-title">{{ L('كل الأدوات', 'All Tools') }}</h1>
      <p class="section-sub">{{ L('ثلاث أدوات، كلٌّ منها مبنية حول حالات استخدام حقيقية — اختر واحدة لتبدأ.', 'Three tools, each built around real use cases — pick one to start.') }}</p>
    </header>

    <router-link to="/calculator" class="service-card sc-blue">
      <div class="service-icon-big blue" aria-hidden="true">🔬</div>
      <div class="service-info">
        <div class="service-head">
          <span class="service-num">01</span>
          <h2>{{ L('الآلة الحاسبة العلمية', 'Scientific Calculator') }}</h2>
        </div>
        <p>{{ L('ابنِ تعبيرك مع معاينة حيّة للنتيجة ثم اضغط يساوي. تدعم العمليات الأربع والأسس والجذور والدوال المثلثية بالدرجات أو الراديان واللوغاريتمات والمضروب وثابتي π وe — مع سجل محفوظ وتحكم كامل من لوحة المفاتيح.', 'Build expressions with a live preview, then press equals. Supports the four operations, powers and roots, trigonometry in degrees or radians, logarithms, factorial and the constants π and e — plus a saved history and full keyboard control.') }}</p>
        <div class="service-tags">
          <span class="badge">+ − × ÷</span>
          <span class="badge">sin cos tan</span>
          <span class="badge">log ln</span>
          <span class="badge">√ xⁿ n!</span>
          <span class="badge">DEG / RAD</span>
        </div>
      </div>
      <span class="service-goto" aria-hidden="true">←</span>
    </router-link>

    <router-link to="/numbers" class="service-card sc-purple">
      <div class="service-icon-big purple" aria-hidden="true">⚙️</div>
      <div class="service-info">
        <div class="service-head">
          <span class="service-num">02</span>
          <h2>{{ L('محوّل الأنظمة الرقمية', 'Number Systems Converter') }}</h2>
        </div>
        <p>{{ L('حوّل بين الثنائي والثماني والعشري والسداسي عشر. يعتمد على BigInt فتبقى الأعداد الصحيحة دقيقة مهما كبرت، ويدعم السالب والكسور والبادئات 0x / 0b / 0o. ويمكن نسخ كل نتيجة بنقرة واحدة.', 'Convert between binary, octal, decimal and hexadecimal. Uses BigInt, so integers of any size stay exact, and it handles negatives, fractions and 0x / 0b / 0o prefixes. Each result can be copied in one click.') }}</p>
        <div class="service-tags">
          <span class="badge purple">Binary</span>
          <span class="badge purple">Octal</span>
          <span class="badge purple">Decimal</span>
          <span class="badge purple">Hex</span>
          <span class="badge purple">BigInt</span>
        </div>
      </div>
      <span class="service-goto" aria-hidden="true">←</span>
    </router-link>

    <router-link to="/geometry" class="service-card sc-green">
      <div class="service-icon-big green" aria-hidden="true">📐</div>
      <div class="service-info">
        <div class="service-head">
          <span class="service-num">03</span>
          <h2>{{ L('حاسبة الأشكال الهندسية', 'Geometry Solver') }}</h2>
        </div>
        <p>{{ L('المساحة والمحيط وغيرهما لخمسة أشكال. يُحلّ المثلث من أضلاعه الثلاثة (صيغة هيرون) مع التحقق من إمكانية تكوينه وتحديد نوعه، وتعطي الكرة الحجم والمساحة السطحية. وتظهر المعادلة بجانب كل نتيجة.', 'Area, perimeter and more for five shapes. The triangle is solved from its three sides (Heron\'s formula) with validity checking and type detection; the sphere gives volume and surface area. Every result shows its formula.') }}</p>
        <div class="service-tags">
          <span class="badge green">⭕ <span>{{ L('الدائرة', 'Circle') }}</span></span>
          <span class="badge green">🟦 <span>{{ L('المربع', 'Square') }}</span></span>
          <span class="badge green">▬ <span>{{ L('المستطيل', 'Rectangle') }}</span></span>
          <span class="badge green">🔺 <span>{{ L('المثلث', 'Triangle') }}</span></span>
          <span class="badge green">🔵 <span>{{ L('الكرة', 'Sphere') }}</span></span>
        </div>
      </div>
      <span class="service-goto" aria-hidden="true">←</span>
    </router-link>
  </div>
</template>