<script setup>
import { ref, watch, onMounted } from 'vue'
import { MathEngine } from '../lib/core'
import { t, isEn, L } from '../composables/i18n'

const inp = ref('x^2-4')
const xVal = ref(2)
const xLabel = ref('2')
const mode = ref('value')
const resText = ref('')
const hintText = ref('')
const noteText = ref('')
const plotHtml = ref('')
const inputEl = ref(null)

const fmt = MathEngine.format
const ev = (src, x, ang) => MathEngine.evaluate(src, { angle: ang, vars: x == null ? undefined : { x } })

const X0 = -10, X1 = 10, W = 320, H = 150, P = 12
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

function draw(src) {
  const N = 160, pts = []
  for (let i = 0; i <= N; i++) {
    const x = X0 + ((X1 - X0) * i) / N
    let y = NaN
    try { y = ev(src, x, 'rad') } catch (e) { /* خارج النطاق */ }
    pts.push([x, y])
  }
  const ys = pts.map(p => p[1]).filter(Number.isFinite).sort((a, b) => a - b)
  if (!ys.length) return null
  let lo = ys[Math.floor(ys.length * 0.03)], hi = ys[Math.ceil(ys.length * 0.97) - 1]
  if (hi - lo < 1e-9) { lo -= 1; hi += 1 }
  const pad = (hi - lo) * 0.12
  lo -= pad; hi += pad
  const mx = x => P + ((x - X0) / (X1 - X0)) * (W - 2 * P)
  const my = y => H - P - ((y - lo) / (hi - lo)) * (H - 2 * P)
  let d = '', pen = false
  for (const [x, y] of pts) {
    if (Number.isFinite(y) && y >= lo && y <= hi) {
      d += (pen ? 'L' : 'M') + mx(x).toFixed(1) + ' ' + my(y).toFixed(1)
      pen = true
    } else pen = false
  }
  const ax = clamp(my(0), P, H - P), ay = mx(0)
  let ticks = ''
  for (const k of [-10, -5, 5, 10])
    ticks += `<line class="plot-ax" x1="${mx(k)}" x2="${mx(k)}" y1="${(ax - 3)}" y2="${(ax + 3)}"/>`
  const x0 = parseFloat(xVal.value)
  let y0 = NaN
  try { y0 = ev(src, x0, 'rad') } catch (e) { /* تجاهل */ }
  const dot = Number.isFinite(y0) && y0 >= lo && y0 <= hi
    ? `<circle class="plot-pt" cx="${mx(x0).toFixed(1)}" cy="${my(y0).toFixed(1)}" r="5"/>`
    : ''
  plotHtml.value =
    `<line class="plot-ax" x1="${P}" x2="${W - P}" y1="${ax}" y2="${ax}"/>` +
    `<line class="plot-ax" x1="${ay}" x2="${ay}" y1="${P}" y2="${H - P}"/>` +
    ticks +
    `<path class="plot-fn" d="${d}"/>` +
    dot
  return { x0, y0 }
}

function solve() {
  const src = inp.value.trim()
  xLabel.value = String(xVal.value)
  noteText.value = ''
  if (!src) {
    mode.value = 'hint'
    resText.value = isEn.value ? 'Type an expression to begin' : 'اكتب عملية لتبدأ'
    return
  }
  let err = null
  try { ev(src, undefined, 'deg') } catch (e) { err = e }
  if (!err) {
    mode.value = 'value'
    let plain
    try { plain = ev(src, undefined, 'deg') } catch { /* لا يصل هنا */ }
    resText.value = '= ' + fmt(plain)
    hintText.value = isEn.value ? 'Add x to draw a curve — try x^2-4' : 'أضف x لرسم منحنى — جرّب x^2-4'
    return
  }
  const r = draw(src)
  if (!r) {
    mode.value = 'error'
    resText.value = t('calc.err.' + (err.code || 'syntax'))
    return
  }
  mode.value = 'plot'
  resText.value = 'f(' + fmt(r.x0) + ') = ' + (Number.isFinite(r.y0) ? fmt(r.y0) : t('calc.err.domain'))
  if (/sin|cos|tan/.test(src))
    noteText.value = isEn.value ? 'Angles in radians' : 'الزوايا بالراديان'
  else
    noteText.value = ''
}

function pickExample(e) {
  inp.value = e
  solve()
  inputEl.value?.focus()
}

watch(inp, solve)
watch(xVal, solve)
watch(isEn, solve)

onMounted(() => {
  solve()
  setTimeout(() => solve(), 50)
})
</script>

<template>
  <div class="sheet" :data-mode="mode" id="sheet">
    <div class="sheet-rings" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="sheet-body">
      <div class="sheet-title">{{ L('جرّب — اكتب أي عملية', 'Try it — type any expression') }}</div>
      <div class="sheet-line">
        <span aria-hidden="true">›</span>
        <input
          ref="inputEl"
          v-model="inp"
          class="sheet-input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          dir="ltr"
          :aria-label="L('العملية', 'Expression')"
        />
      </div>
      <div class="sheet-out">
        <svg id="solver-plot" class="sheet-plot" viewBox="0 0 320 150" role="img" :aria-label="L('رسم الدالة','Function graph')" v-html="plotHtml"></svg>
        <div class="sheet-x">
          <label for="solver-x">x</label>
          <input id="solver-x" v-model.number="xVal" type="range" min="-10" max="10" step="0.5" />
          <output id="solver-xv" for="solver-x">{{ xLabel }}</output>
        </div>
        <div class="sheet-res" :class="mode === 'error' ? 'is-error' : mode === 'hint' ? 'is-hint' : ''" role="status" aria-live="polite">{{ resText }}</div>
        <div class="sheet-hint" v-if="hintText">{{ hintText }}</div>
        <div class="sheet-note" v-if="noteText">{{ noteText }}</div>
      </div>
      <div class="sheet-tags" :aria-label="L('أمثلة', 'Examples')">
        <button type="button" v-for="ex in ['x^2-4', 'sin(x)', '200+10%', '5!', 'int(x^2,0,3)']" :key="ex" @click="pickExample(ex)">{{ ex }}</button>
      </div>
    </div>
  </div>
</template>