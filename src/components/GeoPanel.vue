<script setup>
// لوحة قياس واحدة: الرسم + المعادلة + الحقول + رسالة الخطأ + زر الحساب.
// لا تعرف هذه اللوحة شيئاً عن الرياضيات؛ ترفع حدث calc وتترك الحساب للصفحة الأم.
import { useI18n } from '../composables/i18n'
import GeoFigure from './GeoFigure.vue'

const props = defineProps({
  shape: { type: Object, required: true },
  error: { type: String, default: '' },
  active: { type: Boolean, default: false }
})

// كائن قيم الشكل (يُمرَّر بـ v-model:values من الصفحة الأم)
const values = defineModel('values', { type: Object, required: true })

const emit = defineEmits(['calc'])
const { L } = useI18n()

const fieldId = (key) => `${props.shape.id}-${key}`
const placeholder = (f) => (Array.isArray(f.ph) ? L(f.ph[0], f.ph[1]) : f.ph || '')
</script>

<template>
  <div
    class="geo-panel"
    :class="{ active }"
    :id="shape.id + '-panel'"
    role="tabpanel"
    :aria-label="L(shape.title[0], shape.title[1])"
  >
    <GeoFigure :id="shape.id" />

    <div class="formula-bar">{{ shape.formula }}</div>

    <div class="field-row">
      <div v-for="f in shape.fields" :key="f.key" class="input-group">
        <label :for="fieldId(f.key)">{{ L(f.label[0], f.label[1]) }}</label>
        <input
          type="number"
          :id="fieldId(f.key)"
          v-model="values[f.key]"
          :placeholder="placeholder(f)"
          :min="f.min ?? 0"
          :max="f.max"
          :step="f.step ?? 'any'"
          :inputmode="f.step === 1 ? 'numeric' : 'decimal'"
          autocomplete="off"
          :aria-describedby="shape.errorId"
          @keydown.enter.prevent="emit('calc')"
        />
      </div>
    </div>

    <p v-if="shape.hint" class="rt-hint">{{ L(shape.hint[0], shape.hint[1]) }}</p>

    <div :id="shape.errorId" class="error-msg" role="alert" aria-live="polite">{{ error }}</div>

    <button type="button" class="btn-primary" @click="emit('calc')">{{ L(shape.action[0], shape.action[1]) }}</button>
  </div>
</template>

<style scoped>
/* توحيد موضع رسالة الخطأ أسفل الحقول في كل الألواح */
.geo-panel > .error-msg { margin: -0.5rem 0 0.75rem; }

/* تلميح المثلث القائم */
.rt-hint { font-size: 0.8rem; color: var(--text-muted); margin: -0.5rem 0 0.75rem; line-height: 1.7; }
</style>
