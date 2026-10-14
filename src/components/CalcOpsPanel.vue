<script setup>
import { useI18n } from '../composables/i18n'

const { L, t } = useI18n()

const props = defineProps({
  /** كل الأقسام (بما فيها history) */
  cats: { type: Array, required: true },
  /** الأقسام القابلة للعرض ضمن القوائم (باستثناء history) */
  visibleCats: { type: Array, required: true },
  /** تسميات الأقسام: { [cat]: [icon, label] } */
  catLabels: { type: Object, required: true },
  /** كائن العمليات: { [cat]: op[] } */
  ops: { type: Object, required: true },
  /** القسم النشط */
  activeCat: { type: String, required: true },
  /** مفاتيح اللوحات المفتوحة (مثل 'arith:+') */
  openKeys: { type: Array, default: () => [] },
  /** عناصر السجل الأخيرة أولًا: { e, r } */
  history: { type: Array, default: () => [] },
  /** دالة تُرجع نتيجة مثال العملية نصًّا */
  exampleResult: { type: Function, required: true }
})

defineEmits(['update:activeCat', 'toggle', 'insert', 'try', 'use-history', 'clear-history'])

const isOpen = (key) => props.openKeys.includes(key)
</script>

<template>
  <div class="ops-col">
    <section class="ops" :aria-label="L('العمليات', 'Operations')">
      <div class="ops-tabs" role="tablist" :aria-label="L('أقسام العمليات', 'Operation categories')">
        <button
          v-for="cat in cats"
          :key="cat"
          type="button"
          class="ops-tab"
          :class="{ active: activeCat === cat }"
          role="tab"
          :aria-selected="String(activeCat === cat)"
          @click="$emit('update:activeCat', cat)"
        >
          <span aria-hidden="true">{{ catLabels[cat][0] }}</span>
          <span>{{ catLabels[cat][1] }}</span>
        </button>
      </div>

      <div class="ops-body" role="tabpanel" :aria-label="L('العمليات المتاحة', 'Available operations')">
        <div
          v-for="cat in visibleCats"
          :key="cat"
          class="ops-list"
          :data-cat="cat"
          :hidden="activeCat !== cat"
        >
          <div
            v-for="op in ops[cat]"
            :key="cat + ':' + op.v"
            class="ops-item"
            :class="{ open: isOpen(cat + ':' + op.v) }"
          >
            <button type="button" class="ops-head" :aria-expanded="String(isOpen(cat + ':' + op.v))" @click="$emit('toggle', cat + ':' + op.v)">
              <span class="ops-name">{{ op.n[0] }}</span>
              <span class="ops-syn">{{ op.s }}</span>
              <span class="ops-chev" aria-hidden="true">▼</span>
            </button>
            <div class="ops-panel" :hidden="!isOpen(cat + ':' + op.v)">
              <p class="ops-desc">{{ op.d[0] }}</p>
              <div class="ops-example">
                <small>EX</small>
                <div class="ex-expr">{{ op.x }}</div>
                <div class="ex-res">{{ exampleResult(op.x, op.m) }}</div>
              </div>
              <div class="ops-actions">
                <button type="button" class="ops-act primary" @click="$emit('insert', op)">{{ t('calc.insert') }}</button>
                <button type="button" class="ops-act" @click="$emit('try', op.x, op.m)">{{ t('calc.tryEx') }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- السجل -->
        <div class="ops-history" :hidden="activeCat !== 'history'">
          <div class="history-head">
            <h2>{{ L('السجل', 'History') }}</h2>
            <button type="button" class="history-clear" @click="$emit('clear-history')">{{ L('مسح', 'Clear') }}</button>
          </div>
          <ul class="history-list">
            <li v-if="!history.length" class="history-empty">{{ t('calc.history.empty') }}</li>
            <li v-for="(h, i) in history" :key="'h' + i">
              <button type="button" class="history-item" @click="$emit('use-history', h)">
                <span class="h-expr">{{ h.e }}</span>
                <span class="h-res">{{ h.r }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
