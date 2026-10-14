<script setup>
import { useI18n } from '../composables/i18n'

const { L } = useI18n()

defineProps({
  /** مصفوفة أزرار اللوحة: { act, label, cls, val?, aria? } */
  pad: { type: Array, required: true }
})

defineEmits(['press'])
</script>

<template>
  <div class="calc-wrapper">
    <div class="calc-buttons" role="group" :aria-label="L('لوحة الأرقام', 'Number pad')">
      <button
        v-for="(b, i) in pad"
        :key="i"
        type="button"
        class="calc-btn"
        :class="[b.cls]"
        :aria-label="b.aria ? b.aria[0] : undefined"
        @click="$emit('press', b.act, b.val)"
      >{{ b.label }}</button>
    </div>
  </div>
</template>
