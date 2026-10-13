<script setup>
import { onMounted } from 'vue'
import { useSavedHistory } from '../services/cloud'
import { t } from '../composables/i18n'

const props = defineProps({ tool: { type: String, required: true } })

const { entries, visible, reload, remove, clearAll } = useSavedHistory(props.tool)

onMounted(reload)
</script>

<template>
  <section v-if="visible" class="cloud-panel" :aria-label="t('cloud.title')">
    <div class="cloud-head">
      <h3 class="cloud-title">☁️ {{ t('cloud.title') }}</h3>
      <button type="button" class="cloud-clear" :aria-label="t('cloud.clear')" @click="clearAll">
        {{ t('cloud.clear') }}
      </button>
    </div>

    <ul v-if="entries.length" class="cloud-list">
      <li v-for="en in entries" :key="en.id" class="cloud-item">
        <span class="cloud-in">{{ en.input }}</span>
        <span class="cloud-arrow" aria-hidden="true">→</span>
        <span class="cloud-out">{{ en.output }}</span>
        <button type="button" class="cloud-del" :aria-label="t('cloud.delete')" @click="remove(en.id)">✕</button>
      </li>
    </ul>
    <p v-else class="cloud-empty">{{ t('cloud.empty') }}</p>
  </section>
</template>