<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from '../composables/i18n'
import { saveTool } from '../services/cloud'
import SavedHistory from '../components/SavedHistory.vue'
import { CATS, buildOps, buildCatLabels } from '../lib/calcOps'
import { buildPad } from '../lib/calcPad'
import { fmt } from '../lib/calcFormat'
import { fmt as cxFmt } from '../lib/complex'
import { evaluate, exampleResult, buildSteps, errText, ineqSolutionText, cxResultText } from '../lib/calcEngine'
import CalcKeypad from '../components/CalcKeypad.vue'
import CalcOpsPanel from '../components/CalcOpsPanel.vue'
import CalcStepsDialog from '../components/CalcStepsDialog.vue'
import CalcCheatSheet from '../components/CalcCheatSheet.vue'

const { L, t } = useI18n()

const LS_HIST = 'hp_calc_history'
const LS_ANG = 'hp_angle'
const MAXLEN = 200

// تُبنى عبر computed حتى تتحدّث التسميات والوصف فورًا عند تبديل اللغة
const OPS = computed(() => buildOps(L))
const CAT_LABELS = computed(() => buildCatLabels(L))
const pad = computed(() => buildPad(L))

// ── الحالة ──
const expr = ref('')
const inputEl = ref(null)
const result = ref('0')
const resultError = ref(false)
const ok = ref(false)
const last = ref('')
const copied = ref(false)
const angle = ref(readAngle())
const activeCat = ref('arith')
const openPanels = ref(new Set())
// وضع الأعداد المركبة: eval | polar | degree | solve
const cxMode = ref('eval')

const historyList = ref(getHistory())
const modeLabel = computed(() => (angle.value === 'deg' ? 'DEG' : 'RAD'))
const copyLabel = computed(() => (copied.value ? t('calc.copied') : t('calc.copy')))

// سياق التقييم الحالي — يُمرَّر إلى محرّك الحساب النقي مع كل إدخال
const ctx = () => ({ angle: angle.value, cxMode: cxMode.value })

// تغيير قسم العمليات: مغادرة قسم الأعداد المركبة تُطفئ وضع القطبية/الدرجة/الحل
// حتى لا يسري الوضع العام على تقييمات وأقسام لا علاقة لها به
function setCat(c) {
  activeCat.value = c
  if (c !== 'complex') cxMode.value = 'eval'
}

function readAngle() {
  try { return localStorage.getItem(LS_ANG) === 'rad' ? 'rad' : 'deg' } catch { return 'deg' }
}
function getHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HIST)) || [] } catch { return [] }
}
function setHistory(arr) {
  try { localStorage.setItem(LS_HIST, JSON.stringify(arr.slice(0, 50))) } catch { /* تجاهل */ }
}

function preview() {
  const src = expr.value.trim()
  if (!src) {
    result.value = '0'
    resultError.value = false
    ok.value = false
    last.value = ''
    return
  }
  const r = evaluate(src, ctx())
  if (r.error) {
    result.value = errText(r.error, t, cxMode.value)
    resultError.value = true
    ok.value = false
    last.value = ''
  } else if (r.ineq) {
    result.value = ineqSolutionText(r.ineq, t)
    resultError.value = false
    last.value = result.value
    ok.value = true
  } else if (r.cx) {
    showComplexResult(r.cx)
    resultError.value = false
    ok.value = true
  } else {
    result.value = fmt(r.value)
    resultError.value = false
    last.value = fmt(r.value)
    ok.value = true
  }
}

// العرض المختصر لحلٍّ مركب: تظهر الجذور كاملة إن كانت قصيرة، وإلا يُذكر عددها
function showComplexResult(data) {
  if (data.mode === 'solve') {
    if (data.special === 'all') {
      result.value = t('calc.ineq.all')
      last.value = result.value
    } else if (data.special === 'none') {
      result.value = t('calc.ineq.none')
      last.value = result.value
    } else {
      const joined = data.roots.map(cxFmt).join(' ، ')
      last.value = joined
      result.value = joined.length <= 30
        ? joined
        : L('N حلول', 'N solutions').replace('N', String(data.roots.length))
    }
    return
  }
  result.value = cxResultText(data, t)
  last.value = result.value
}

function record() {
  const src = expr.value.trim()
  if (!src) return
  if (!ok.value) return
  const items = getHistory()
  items.push({ e: src, r: last.value })
  setHistory(items)
  historyList.value = items
  saveTool('calculator', src, last.value)
}

function insert(text) {
  const el = inputEl.value
  if (!el) { expr.value += text; return }
  const start = el.selectionStart != null ? el.selectionStart : expr.value.length
  const end = el.selectionEnd != null ? el.selectionEnd : expr.value.length
  expr.value = expr.value.slice(0, start) + text + expr.value.slice(end)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + text.length, start + text.length)
  })
  preview()
}

function back() {
  const el = inputEl.value
  const start = el ? (el.selectionStart != null ? el.selectionStart : expr.value.length) : expr.value.length
  const end = el ? (el.selectionEnd != null ? el.selectionEnd : expr.value.length) : expr.value.length
  if (start !== end) {
    expr.value = expr.value.slice(0, start) + expr.value.slice(end)
    if (el) nextTick(() => el.setSelectionRange(start, start))
  } else if (start > 0) {
    expr.value = expr.value.slice(0, start - 1) + expr.value.slice(start)
    if (el) nextTick(() => el.setSelectionRange(start - 1, start - 1))
  }
  preview()
}

function negate() {
  let v = expr.value
  const m = v.match(/(^|[^0-9.])(\d+(?:\.\d+)?)$/)
  if (m) v = v.slice(0, m.index + 1) + '(-' + m[2] + ')'
  else v += '-'
  expr.value = v
  preview()
  inputEl.value?.focus()
}

function toggleMode() {
  angle.value = angle.value === 'deg' ? 'rad' : 'deg'
  try { localStorage.setItem(LS_ANG, angle.value) } catch { /* تجاهل */ }
  preview()
}

function clearAll() {
  expr.value = ''
  preview()
  inputEl.value?.focus()
}

function onPad(act, val) {
  switch (act) {
    case 'append': insert(val); break
    case 'clear': clearAll(); break
    case 'back': back(); break
    case 'fn': {
      if (val === 'neg') negate()
      else if (val === 'pi') insert('π')
      else if (val === 'e') insert('e')
      break
    }
    case 'mode': toggleMode(); break
    case 'equals': record(); break
    case 'copy': {
      const text = (ok.value && last.value) ? last.value : expr.value.trim()
      if (text) copyText(text)
      break
    }
    case 'clear-history':
      setHistory([])
      historyList.value = []
      break
  }
}

function copyText(text) {
  const done = () => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 1400)
  }
  const legacy = () => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch { /* تجاهل */ }
    ta.remove()
    done()
  }
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(legacy)
  else legacy()
}

// ── خطوات الحل بالترتيب ──
const showSteps = ref(false)
const stepsData = ref(null)
const stepsError = ref('') // '' | 'empty' | مفتاح خطأ

function openSteps() {
  const r = buildSteps(expr.value, ctx())
  stepsData.value = r.data
  stepsError.value = r.error
  showSteps.value = true
}

function closeSteps() {
  showSteps.value = false
  inputEl.value?.focus()
}

// ── العمليات القابلة للطي ──
function togglePanel(key) {
  const s = new Set(openPanels.value)
  if (s.has(key)) s.delete(key)
  else s.add(key)
  openPanels.value = s
}
const openKeys = computed(() => [...openPanels.value])

// نتيجة مثال العملية كما تُعرض في لوحة العمليات — بزاوية التقييم فقط؛
// وضع المركبة لا يدخل الأمثلة (يرى exampleResult)
const opExample = (x, m) => exampleResult(x, m, { angle: angle.value })

// ── السجل ──
const reversedHistory = computed(() => [...historyList.value].reverse())

function useHistoryItem(h) {
  expr.value = h.e
  preview()
  inputEl.value?.focus()
}

function clearHistoryPanel() {
  setHistory([])
  historyList.value = []
}

function tryExample(x, m) {
  if (m) cxMode.value = m
  expr.value = x
  preview()
  record()
  inputEl.value?.focus()
}

function insertOp(op) {
  if (op.m) cxMode.value = op.m
  insert(op.v)
  inputEl.value?.focus()
}

// ── اختصار لوحة المفاتيح ──
function onKey(e) {
  if (showSteps.value) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === '=') {
      e.preventDefault()
      closeSteps()
    }
    return
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const target = e.target
  const tag = (target && target.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea') {
    if (inputEl.value && target === inputEl.value && e.key === 'Enter') {
      e.preventDefault()
      record()
    }
    return
  }
  const map = {
    '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
    '.':'.','+':'+','-':'-','*':'×','/':'÷','^':'^','%':'%','!':'!',
    '(':'(',')':')',',':',','x':'x','i':'i'
  }
  if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); record(); return }
  if (e.key === 'Backspace') { e.preventDefault(); back(); return }
  if (e.key === 'Delete' || e.key === 'Escape') { e.preventDefault(); expr.value = ''; preview(); return }
  if (map[e.key]) { e.preventDefault(); insert(map[e.key]) }
}

function onInput() {
  if (expr.value.length > MAXLEN) expr.value = expr.value.slice(0, MAXLEN)
  preview()
}

onMounted(() => {
  preview()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})

const visibleCats = CATS.filter(c => c !== 'history')
</script>

<template>
  <div class="section calc-page" style="max-width: 1180px">
    <!-- ════ العنوان ════ -->
    <header class="page-head">
      <h1 class="section-title">{{ L('الآلة الحاسبة العلمية', 'Scientific Calculator') }}</h1>
      <p class="section-sub">{{ L('اكتب عمليتك في الشريط، أو اختر عملية وجرّب مثالها على لوحة الأرقام.', 'Type an expression below, or pick an operation and try its example on the keypad.') }}</p>
    </header>

    <!-- ════ شريط الإدخال + النتيجة ════ -->
    <div class="calc-bar" role="group" :aria-label="L('إدخال العملية', 'Expression input')">
      <button
        type="button"
        class="bar-btn bar-mode"
        :aria-pressed="String(angle === 'deg')"
        :aria-label="L(modeLabel + ' — وحدة الزوايا (اضغط للتبديل)', modeLabel + ' — angle unit (tap to switch)')"
        @click="toggleMode"
      >{{ modeLabel }}</button>
      <input
        ref="inputEl"
        v-model="expr"
        class="bar-input"
        type="text"
        dir="ltr"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="done"
        :placeholder="L(' 2π × sin(30) + 5!', ' e.g. 2π × sin(30) + 5!')"
        :aria-label="L('العملية الحسابية', 'Expression')"
        @input="onInput"
      />
      <div class="calc-result bar-result" :class="{ 'is-error': resultError }" role="status" aria-live="polite" :aria-label="L('النتيجة', 'Result')">{{ result }}</div>
      <button type="button" class="bar-btn" :class="{ copied }" @click="onPad('copy')">{{ copyLabel }}</button>
      <button type="button" class="bar-btn bar-steps" :aria-label="L('استعرض الخطوات بالترتيب', 'Show steps in order')" @click="openSteps">{{ L('استعرض الخطوات', 'Show steps') }}</button>
    </div>

    <div class="calc-layout calc-layout--ops">
      <CalcOpsPanel
        :cats="CATS"
        :visible-cats="visibleCats"
        :cat-labels="CAT_LABELS"
        :ops="OPS"
        :active-cat="activeCat"
        :open-keys="openKeys"
        :history="reversedHistory"
        :example-result="opExample"
        @update:activeCat="setCat"
        @toggle="togglePanel"
        @insert="insertOp"
        @try="tryExample"
        @use-history="useHistoryItem"
        @clear-history="clearHistoryPanel"
      />

      <!-- ════ لوحة الأرقام ════ -->
      <div class="calc-side">
        <CalcKeypad :pad="pad" @press="onPad" />
      </div>
    </div>

    <CalcCheatSheet />
  </div>

  <CalcStepsDialog :show="showSteps" :payload="stepsData" :error="stepsError" @close="closeSteps" />

  <SavedHistory tool="calculator" />
</template>

<style scoped>
.bar-btn.bar-steps { border-color: var(--accent); color: var(--accent); }
</style>
