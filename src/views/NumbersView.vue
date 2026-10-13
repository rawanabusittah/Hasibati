<script setup>
import { ref, computed } from 'vue'
import { BaseConv } from '../lib/core'
import { useI18n } from '../composables/i18n'
import { saveTool } from '../services/cloud'
import SavedHistory from '../components/SavedHistory.vue'

const { L, t } = useI18n()
const BC = BaseConv
const BASES = [2, 8, 10, 16]

const numInput = ref('')
const fromBase = ref(10)
const errorMsg = ref('')
const infoMsg = ref('')
const results = ref([])
const hasValue = ref(false)

const inputEl = ref(null)

function detectBase(raw) {
  const s = String(raw).trim().replace(/[\s_]/g, '').toUpperCase()
  const m = s.match(/^[+-]?0([XB]|O)/)
  if (m) {
    if (m[1] === 'X') return 16
    if (m[1] === 'B') return 2
    if (m[1] === 'O') return 8
  }
  return fromBase.value || 10
}

function convert() {
  const raw = numInput.value
  if (!raw.trim()) {
    errorMsg.value = ''
    hasValue.value = false
    results.value = []
    infoMsg.value = ''
    return
  }
  const base = detectBase(raw)
  const p = BC.parse(raw, base)
  if (p.error) {
    let msg
    if (p.error === 'required') msg = t('num.required')
    else if (p.error === 'tooLong') msg = t('num.tooLong')
    else msg = t('num.invalid', { base: t('base.' + base) })
    errorMsg.value = msg
    hasValue.value = false
    results.value = []
    infoMsg.value = ''
    return
  }
  errorMsg.value = ''
  hasValue.value = true

  let truncated = false
  const items = BASES.map(b => {
    const r = BC.toBase(p, b, 20)
    if (r.truncated) truncated = true
    return {
      base: b,
      label: t('sys.' + b),
      value: (p.neg ? '-' : '') + r.text,
      accent: b === base
    }
  })
  results.value = items

  const bits = BC.bitInfo(p)
  let msg = t('num.bits', { bits: bits.bits, bytes: bits.bytes })
  if (truncated) msg += ' · ' + t('num.truncated', { n: 20 })
  infoMsg.value = msg

  const dec = (p.neg ? '-' : '') + BC.toBase(p, 10).text
  saveTool('numbers', raw, dec)
}

function chooseBase(b) {
  fromBase.value = b
  if (numInput.value.trim()) convert()
}

function useChip(example, base) {
  numInput.value = example
  if (base) fromBase.value = base
  convert()
  inputEl.value?.focus()
}

function onInput() {
  if (numInput.value.length > 200) numInput.value = numInput.value.slice(0, 200)
  convert()
}

function copyVal(text, el) {
  const done = (btn) => {
    btn.textContent = t('calc.copied')
    setTimeout(() => { btn.textContent = t('calc.copy') }, 1400)
  }
  const fallback = (btn) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch { /* تجاهل */ }
    ta.remove()
    done(btn)
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => done(el)).catch(() => fallback(el))
  } else fallback(el)
}

const chips = [
  { ex: '255', base: 10, label: '255', sub: 'Dec' },
  { ex: '11111111', base: 2, label: '11111111', sub: 'Bin' },
  { ex: 'FF', base: 16, label: 'FF', sub: 'Hex' },
  { ex: '-42', base: 10, label: '-42', sub: 'Dec' },
  { ex: '0.1', base: 10, label: '0.1', sub: 'Dec' },
  { ex: '123456789012345678901234567890', base: 10, label: '123456…890', sub: L('30 خانة', '30 digits') }
]

const typeBtns = computed(() => [
  { base: 2, label: L('ثنائي', 'Binary'), sub: 'BIN · 2' },
  { base: 8, label: L('ثماني', 'Octal'), sub: 'OCT · 8' },
  { base: 10, label: L('عشري', 'Decimal'), sub: 'DEC · 10' },
  { base: 16, label: L('سداسي عشر', 'Hexadecimal'), sub: 'HEX · 16' }
])
</script>

<template>
  <div class="section tool-page num-page" style="max-width: 1180px">
    <!-- ════ العنوان ════ -->
    <header class="page-head">
      <h1 class="section-title">{{ L('تحويل الأنظمة الرقمية', 'Number Systems Converter') }}</h1>
      <p class="section-sub">{{ L('اكتب قيمة في أي نظام لتراها في الأنظمة الأربعة — بدقة كاملة حتى مع الأعداد الضخمة والكسور.', 'Type a value in any system and see it in all four — exact, even for huge numbers and fractions.') }}</p>
    </header>

    <!-- ════ شريط الإدخال ════ -->
    <div class="calc-bar num-bar" role="group" :aria-label="L('إدخال القيمة', 'Value input')">
      <input
        ref="inputEl"
        v-model="numInput"
        class="bar-input num-input"
        :placeholder="L('255  /  -12.5  /  0xFF', '255  /  -12.5  /  0xFF')"
        autocomplete="off"
        spellcheck="false"
        inputmode="text"
        dir="ltr"
        enterkeyhint="done"
        :aria-label="L('القيمة', 'Value')"
        :aria-describedby="errorMsg ? 'num-error' : undefined"
        :aria-invalid="String(!!errorMsg)"
        @input="onInput"
        @keydown.enter.prevent="convert"
      />
      <button type="button" class="bar-btn" @click="convert">{{ L('تحويل ⇄', 'Convert ⇄') }}</button>
    </div>

    <!-- ════ شريط اختيار النظام ════ -->
    <div class="type-bar-wrap">
      <p class="type-bar-label" id="type-bar-h">{{ L('حوّل من نظام:', 'Convert from:') }}</p>
      <div class="type-bar" id="type-bar" role="radiogroup" aria-labelledby="type-bar-h">
        <button
          v-for="b in typeBtns"
          :key="b.base"
          type="button"
          class="type-btn"
          :data-base="String(b.base)"
          role="radio"
          :aria-checked="String(fromBase === b.base)"
          :tabindex="fromBase === b.base ? 0 : -1"
          @click="chooseBase(b.base)"
        >
          <span>{{ b.label }}</span><small>{{ b.sub }}</small>
        </button>
      </div>
    </div>

    <div id="num-error" v-if="errorMsg" class="error-msg bar-error" role="alert" aria-live="polite">{{ errorMsg }}</div>

    <div class="calc-layout calc-layout--ops">
      <!-- ════ النتائج ════ -->
      <div class="ops-col">
        <section class="ops" aria-labelledby="res-h">
          <div class="panel-bar">
            <b id="res-h">{{ L('النتائج في كل الأنظمة', 'Results in all systems') }}</b>
            <span id="num-info" class="num-info" aria-live="polite">{{ infoMsg }}</span>
          </div>
          <div class="panel-body">
            <div v-if="hasValue" id="num-results" class="num-results res-list" role="status" aria-live="polite">
              <div v-for="r in results" :key="r.base" class="num-result-item">
                <div class="sys-label">{{ r.label }}</div>
                <div class="sys-value" :class="{ accent: r.accent }" dir="ltr">{{ r.value }}</div>
                <button
                  type="button"
                  class="copy-btn"
                  :data-copy="r.value"
                  @click="copyVal(r.value, $event.currentTarget)"
                >{{ t('calc.copy') }}</button>
              </div>
            </div>
            <p v-else class="res-empty">{{ L('أدخل قيمة في الشريط بالأعلى وستظهر التحويلات الأربعة هنا مباشرة.', 'Enter a value above and the four conversions appear here, live.') }}</p>
          </div>
        </section>
      </div>

      <!-- ════ أمثلة ومراجع ════ -->
      <div class="calc-side">
        <section class="ops" aria-labelledby="ref-h">
          <div class="panel-bar"><b id="ref-h">{{ L('أمثلة ومراجع', 'Examples & reference') }}</b></div>
          <div class="ops-body">
            <div class="ops-list">
              <details class="ops-item" open>
                <summary class="ops-head">
                  <span class="ops-name">{{ L('أمثلة سريعة', 'Quick examples') }}</span>
                  <span class="ops-chev" aria-hidden="true">▼</span>
                </summary>
                <div class="ops-panel">
                  <div class="ex-grid">
                    <button
                      type="button"
                      v-for="c in chips"
                      :key="c.ex"
                      class="ex-chip"
                      @click="useChip(c.ex, c.base)"
                    >{{ c.label }} <small>{{ c.sub }}</small></button>
                  </div>
                </div>
              </details>

              <details class="ops-item">
                <summary class="ops-head">
                  <span class="ops-name">{{ L('الأنظمة الأربعة', 'The four systems') }}</span>
                  <span class="ops-chev" aria-hidden="true">▼</span>
                </summary>
                <div class="ops-panel">
                  <div class="base-legend">
                    <div class="b2"><b>Binary</b><span>{{ L('أرقام 0, 1 فقط', 'Digits 0, 1 only') }}</span></div>
                    <div class="b8"><b>Octal</b><span>{{ L('أرقام 0–7', 'Digits 0–7') }}</span></div>
                    <div class="b10"><b>Decimal</b><span>{{ L('أرقام 0–9', 'Digits 0–9') }}</span></div>
                    <div class="b16"><b>Hexadecimal</b><span>{{ L('0–9، A–F', '0–9, A–F') }}</span></div>
                  </div>
                </div>
              </details>

              <details class="ops-item">
                <summary class="ops-head">
                  <span class="ops-name">{{ L('ما الذي يقبله الحقل؟', 'What the field accepts') }}</span>
                  <span class="ops-chev" aria-hidden="true">▼</span>
                </summary>
                <div class="ops-panel">
                  <p class="ops-desc">{{ L('يقبل الأعداد السالبة والكسور والبادئات (0x 0b 0o) والمسافات.', 'Negative numbers, fractions, prefixes (0x, 0b, 0o) and spaces are all accepted.') }}</p>
                </div>
              </details>

              <details class="ops-item">
                <summary class="ops-head">
                  <span class="ops-name">{{ L('لماذا لا يكون 0.1 دقيقاً في الثنائي؟', "Why 0.1 isn't exact in binary") }}</span>
                  <span class="ops-chev" aria-hidden="true">▼</span>
                </summary>
                <div class="ops-panel">
                  <p class="ops-desc">{{ L('لأنه يتكرر بلا نهاية (0.000110011…)، لذا تُقتطع الكسور عند 20 خانة، وتُعلمك الصفحة عندما يحدث ذلك.', '0.1 repeats forever as 0.000110011…, so fractions are truncated to 20 digits — the page tells you when that happens.') }}</p>
                </div>
              </details>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>

  <SavedHistory tool="numbers" />
</template>

<style>
/* شريط اختيار نوع التحويل (ثابت تحت الإدخال) — من التصميم الأصلي */
.type-bar-wrap { max-width: 1180px; margin: 0 auto 1.2rem; }
.type-bar-label { font-size: .85rem; font-weight: 800; margin: 0 0 .5rem .2rem; color: var(--text-secondary); }
.type-bar {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .6rem;
}
.type-btn {
  --c: var(--accent);
  display: flex; align-items: center; justify-content: space-between; gap: .6rem; min-height: 54px;
  padding: .5rem .9rem; cursor: pointer; text-align: start;
  font: 800 .92rem var(--font-main); color: var(--text-primary);
  background: var(--bg-card); border: 2px solid var(--line); border-top: 5px solid var(--c);
  border-radius: 12px; box-shadow: 2px 2px 0 var(--shadow-ink);
  transition: transform var(--transition), box-shadow var(--transition), background var(--transition);
}
.type-btn[data-base="2"]  { --c: var(--accent); }
.type-btn[data-base="8"]  { --c: var(--accent-2); }
.type-btn[data-base="10"] { --c: var(--accent-3); }
.type-btn[data-base="16"] { --c: var(--accent-4); }
.type-btn small {
  font: 700 .72rem var(--font-mono); direction: ltr; padding: .1rem .45rem; border-radius: 6px;
  background: color-mix(in srgb, var(--c) 18%, transparent);
}
.type-btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--shadow-ink); }
.type-btn:active { transform: translate(2px, 2px); box-shadow: none; }
.type-btn[aria-checked="true"] {
  background: var(--hl); color: #0d1633; box-shadow: 4px 4px 0 var(--shadow-ink);
}
.type-btn[aria-checked="true"] small { background: #fff; }
@media (max-width: 760px) { .type-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.num-page .page-head { margin-bottom: 1.2rem; }
.num-page .bar-error { margin: -.2rem auto .9rem; }
</style>