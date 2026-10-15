<script setup>
// صفحة الهندسة: تنسّق بين شريط الأشكال ولوحات القياس وعرض النتائج.
// الرياضيات في src/lib/geoFormulas.js وبيانات الأشكال في src/lib/geoShapes.js.
import { reactive, ref } from 'vue'
import { useI18n } from '../composables/i18n'
import { saveTool } from '../services/cloud'
import SavedHistory from '../components/SavedHistory.vue'
import GeoPanel from '../components/GeoPanel.vue'
import { SHAPES, emptyValues } from '../lib/geoShapes'
import { GEO_CALCS, disp } from '../lib/geoFormulas'

const { L, t } = useI18n()

const activeShape = ref('circle')
const shapesExpanded = ref(false)

// حالات كل شكل: قيم الحقول، رسالة الخطأ، والنتائج
const byId = (make) => Object.fromEntries(SHAPES.map((s) => [s.id, make(s)]))
const values = reactive(byId(emptyValues))
const errors = reactive(byId(() => ''))
const results = reactive(byId(() => []))

function calc(id) {
  const out = GEO_CALCS[id](values[id], t)
  errors[id] = out.error || ''
  results[id] = out.results || []
  if (!out.error && out.summary) saveTool('geometry', id, out.summary)
}

function toggleRound(item) {
  item.rounded = !item.rounded
}
</script>

<template>
  <div class="section tool-page" style="max-width: 1180px">
    <!-- ════ العنوان ════ -->
    <header class="page-head">
      <h1 class="section-title">{{ L('حساب الأشكال الهندسية', 'Geometry Calculator') }}</h1>
      <p class="section-sub">{{ L('اختر شكلاً واكتب أبعاده لتظهر كل النتائج مباشرة مع المعادلة المستخدمة.', 'Pick a shape, type its measurements, and watch every result appear with the formula behind it.') }}</p>
    </header>

    <!-- ════ شريط اختيار الشكل (سطر واحد + زر المزيد) ════ -->
    <div class="shape-zone">
      <div class="calc-bar shape-bar" :class="{ 'is-collapsed': !shapesExpanded }" role="tablist" :aria-label="L('الأشكال الهندسية', 'Geometric shapes')">
        <button
          v-for="sh in SHAPES"
          :key="sh.id"
          type="button"
          class="geo-tab"
          :class="{ active: activeShape === sh.id }"
          role="tab"
          :aria-selected="String(activeShape === sh.id)"
          :aria-controls="sh.id + '-panel'"
          @click="activeShape = sh.id"
        ><span>{{ L(sh.ar, sh.en) }}</span></button>
      </div>
      <button type="button" class="geo-more" :aria-expanded="String(shapesExpanded)" @click="shapesExpanded = !shapesExpanded">
        {{ shapesExpanded ? L('أقل ▲', 'Less ▲') : L('المزيد ▼', 'More ▼') }}
      </button>
    </div>

    <div class="calc-layout calc-layout--ops">
      <!-- ════ القياسات ════ -->
      <div class="ops-col">
        <section class="ops" aria-labelledby="meas-h">
          <div class="panel-bar"><b id="meas-h">{{ L('القياسات', 'Measurements') }}</b></div>
          <div class="panel-body">
            <GeoPanel
              v-for="sh in SHAPES"
              :key="sh.id"
              v-model:values="values[sh.id]"
              :shape="sh"
              :error="errors[sh.id]"
              :active="activeShape === sh.id"
              @calc="calc(sh.id)"
            />
          </div>
        </section>
      </div>

      <!-- ════ النتائج ════ -->
      <div class="calc-side">
        <section class="ops" aria-labelledby="geo-res-h">
          <div class="panel-bar"><b id="geo-res-h">{{ L('النتائج', 'Results') }}</b><span>{{ L('مع المعادلة', 'With each formula') }}</span></div>
          <div class="panel-body">
            <div
              v-for="sh in SHAPES"
              :key="sh.id"
              class="geo-res"
              :class="{ active: activeShape === sh.id }"
              :data-res-for="sh.id + '-panel'"
            >
              <template v-if="results[sh.id].length">
                <div class="geo-results-grid" role="status" aria-live="polite">
                  <div v-for="(it, i) in results[sh.id]" :key="i" class="geo-result-item">
                    <div class="geo-label">{{ it.label }}</div>
                    <div class="geo-val" :class="{ 'is-text': it.isText }">
                      {{ disp(it) }}<small v-if="it.unit">{{ it.unit }}</small>
                    </div>
                    <div v-if="it.formula" class="geo-formula">{{ it.formula }}</div>
                    <button
                      v-if="!it.isText"
                      type="button"
                      class="geo-round"
                      :aria-pressed="String(!!it.rounded)"
                      @click="toggleRound(it)"
                    >{{ it.rounded ? L('↩ إرجاع الكسور', '↩ Show decimals') : L('≈ تقريب', '≈ Round') }}</button>
                  </div>
                </div>
              </template>
              <p v-else class="res-empty">{{ t('geo.empty.' + sh.id) }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>

  <SavedHistory tool="geometry" />
</template>

<style scoped>
/* النتائج كثيرة (خصوصاً المثلث) — فعّل تمريراً عمودياً داخل كل لوحة */
.calc-layout--ops .ops > .panel-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}

/* الأرقام الطويلة لا تخرج من المربّع */
.geo-val {
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.3;
}

/* زر التقريب تحت كل مربّع */
.geo-round {
  margin-top: 0.6rem;
  min-height: 30px;
  padding: 0.15rem 0.7rem;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color var(--transition), color var(--transition), background var(--transition);
}
.geo-round:hover { border-color: var(--line); color: var(--text-primary); background: var(--hl-soft); }
.geo-round[aria-pressed="true"] { background: var(--hl); color: #0d1633; border-color: var(--line); }
</style>
