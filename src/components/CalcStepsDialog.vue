<script setup>
import { useI18n } from '../composables/i18n'
import { fmt } from '../lib/calcFormat'
import { fmt as cxFmt } from '../lib/complex'

const { L, t } = useI18n()

defineProps({
  /** إظهار النافذة */
  show: { type: Boolean, default: false },
  /** بيانات الخطوات: { type?, original, steps?, final? , m?, cx? } */
  payload: { type: Object, default: null },
  /** '' | 'empty' | مفتاح خطأ */
  error: { type: String, default: '' }
})

defineEmits(['close'])

const LAMBDA_LABEL = { diff: 'ldiff', diff2: 'ldiff2', int: 'lint', sum: 'lsum', prod: 'lprod' }

function stepKindLabel(s) {
  if (s.kind === 'calc') return t('calc.steps.' + (LAMBDA_LABEL[s.name] || 'kcalc'), { n: s.name })
  if (s.kind === 'fn') return t('calc.steps.kfn', { n: s.name })
  return t('calc.steps.k' + s.kind)
}

function cxFinalText(cx) {
  if (cx.mode === 'solve') {
    if (cx.special === 'all') return t('calc.ineq.all')
    if (cx.special === 'none') return t('calc.ineq.none')
    return cx.roots.map(cxFmt).join(' ، ')
  }
  if (cx.mode === 'polar') {
    return cx.zStr + ' = ' + cx.p.r + '(cos ' + cx.p.deg360 + '° + i sin ' + cx.p.deg360 + '°)  =  ' + cx.p.r + ' ∠ ' + cx.p.degP + '°'
  }
  if (cx.mode === 'degree') return cx.zStr + '  →  θ = ' + cx.p.degP + '°'
  return cx.zStr
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="steps-overlay" role="presentation" @click.self="$emit('close')">
      <div class="steps-card" role="dialog" aria-modal="true" :aria-label="t('calc.steps.title')">
        <header class="steps-head">
          <div class="steps-head-text">
            <h2 class="steps-title">{{ t('calc.steps.title') }}</h2>
            <p class="steps-sub">{{ t('calc.steps.subtitle') }}</p>
          </div>
          <button type="button" class="steps-close" :aria-label="t('calc.steps.close')" @click="$emit('close')">✕</button>
        </header>

        <div class="steps-body">
          <p v-if="error" class="steps-msg" role="alert">
            {{ error === 'empty' ? t('calc.steps.empty') : t(error) }}
          </p>

          <template v-else-if="payload && payload.type === 'ineq'">
            <div class="steps-orig">
              <span class="steps-tag">{{ t('calc.steps.original') }}</span>
              <code class="steps-expr" dir="ltr">{{ payload.original }}</code>
            </div>

            <ol class="steps-list">
              <li v-for="(s, i) in payload.steps" :key="i" class="steps-item ineq-item">
                <span class="steps-num">{{ i + 1 }}</span>
                <code class="ineq-expr" dir="ltr">{{ s.expr }}</code>
                <span class="steps-kind">{{ t('calc.steps.ineq.' + s.kind) }}</span>
              </li>
            </ol>

            <div class="steps-final">
              <span class="steps-tag">{{ t('calc.steps.ineq.solution') }}</span>
              <code class="steps-expr fin" dir="ltr">{{ payload.special === 'all' ? t('calc.ineq.all') : payload.special === 'none' ? t('calc.ineq.none') : payload.solution }}</code>
            </div>
          </template>

          <template v-else-if="payload && payload.type === 'stats'">
            <div class="steps-orig">
              <span class="steps-tag">{{ t('calc.steps.original') }}</span>
              <code class="steps-expr" dir="ltr">{{ payload.original }}</code>
            </div>

            <div class="cx-main" dir="ltr">{{ payload.original }} = {{ payload.final === null ? '—' : fmt(payload.final) }}</div>

            <div class="cx-grid">
              <div class="cx-cell"><small>{{ L('العدد', 'Count') }}</small><b dir="ltr">{{ payload.m.n }}</b></div>
              <div class="cx-cell"><small>{{ L('المجموع', 'Sum') }}</small><b dir="ltr">{{ fmt(payload.m.sum) }}</b></div>
              <div class="cx-cell"><small>{{ L('المتوسط', 'Mean') }}</small><b dir="ltr">{{ fmt(payload.m.mean) }}</b></div>
              <div class="cx-cell"><small>{{ L('الوسيط', 'Median') }}</small><b dir="ltr">{{ fmt(payload.m.median) }}</b></div>
              <div class="cx-cell"><small>{{ L('المنوال', 'Mode(s)') }}</small><b dir="ltr">{{ payload.m.modes.length ? payload.m.modes.map(fmt).join(' ، ') : t('calc.stats.nomode') }}</b></div>
              <div class="cx-cell"><small>{{ L('الربيع Q1', 'Quartile Q1') }}</small><b dir="ltr">{{ fmt(payload.m.q1) }}</b></div>
              <div class="cx-cell"><small>{{ L('الربيع Q3', 'Quartile Q3') }}</small><b dir="ltr">{{ fmt(payload.m.q3) }}</b></div>
              <div class="cx-cell"><small>{{ L('المدى الربيعي', 'IQR') }}</small><b dir="ltr">{{ fmt(payload.m.iqr) }}</b></div>
              <div class="cx-cell"><small>σ</small><b dir="ltr">{{ fmt(payload.m.stdev) }}</b></div>
              <div class="cx-cell"><small>s</small><b dir="ltr">{{ payload.m.sstd === null ? '—' : fmt(payload.m.sstd) }}</b></div>
              <div class="cx-cell"><small>σ²</small><b dir="ltr">{{ fmt(payload.m.varPop) }}</b></div>
              <div class="cx-cell"><small>{{ L('الصغرى', 'Min') }}</small><b dir="ltr">{{ fmt(payload.m.min) }}</b></div>
              <div class="cx-cell"><small>{{ L('العظمى', 'Max') }}</small><b dir="ltr">{{ fmt(payload.m.max) }}</b></div>
              <div class="cx-cell"><small>{{ L('المدى', 'Range') }}</small><b dir="ltr">{{ fmt(payload.m.range) }}</b></div>
              <div class="cx-cell"><small>{{ L('المدى الأوسط', 'Midrange') }}</small><b dir="ltr">{{ fmt(payload.m.midrange) }}</b></div>
              <div class="cx-cell"><small>{{ L('منتصف المفصلات', 'Midhinge') }}</small><b dir="ltr">{{ fmt(payload.m.midhinge) }}</b></div>
            </div>

            <div class="steps-final">
              <span class="steps-tag">{{ t('calc.steps.final') }}</span>
              <code class="steps-expr fin" dir="ltr">{{ payload.final === null ? '—' : fmt(payload.final) }}</code>
            </div>
          </template>

          <template v-else-if="payload && payload.type === 'complex'">
            <div class="steps-orig">
              <span class="steps-tag">{{ t('calc.steps.original') }}</span>
              <code class="steps-expr" dir="ltr">{{ payload.original }}</code>
            </div>

            <!-- حل المعادلات -->
            <template v-if="payload.cx.mode === 'solve'">
              <p v-if="payload.cx.special === 'all'" class="cx-plain">{{ t('calc.ineq.all') }}</p>
              <p v-else-if="payload.cx.special === 'none'" class="cx-plain">{{ t('calc.ineq.none') }}</p>
              <template v-else>
                <p class="cx-note">
                  {{ L('درجة المعادلة', 'Equation degree') }}: {{ payload.cx.degree }}
                  · {{ L('N حلول', 'N solutions').replace('N', String(payload.cx.roots.length)) }}
                </p>
                <ul class="cx-roots">
                  <li v-for="(rt, i) in payload.cx.roots" :key="i">
                    <span class="cx-root-var">x<sub>{{ i + 1 }}</sub></span>
                    <span class="cx-root-eq">=</span>
                    <b class="cx-root-val" dir="ltr">{{ cxFmt(rt) }}</b>
                  </li>
                </ul>
              </template>
            </template>

            <!-- تقييم / قطبية / درجة -->
            <template v-else>
              <div class="cx-main" dir="ltr">
                {{ payload.cx.mode === 'polar'
                  ? payload.cx.zStr + ' = ' + payload.cx.p.r + '(cos ' + payload.cx.p.deg360 + '° + i sin ' + payload.cx.p.deg360 + '°)'
                  : payload.cx.zStr }}
              </div>
              <div v-if="payload.cx.mode === 'polar'" class="cx-sub" dir="ltr">{{ payload.cx.p.r }} ∠ {{ payload.cx.p.degP }}°</div>
              <div v-else-if="payload.cx.mode === 'degree'" class="cx-arg" dir="ltr">{{ payload.cx.p.degP }}°</div>
              <div class="cx-grid">
                <div class="cx-cell"><small>Re</small><b dir="ltr">{{ payload.cx.p.re }}</b></div>
                <div class="cx-cell"><small>Im</small><b dir="ltr">{{ payload.cx.p.im }}</b></div>
                <div class="cx-cell"><small>|z|</small><b dir="ltr">{{ payload.cx.p.abs }}</b></div>
                <div class="cx-cell"><small>θ°</small><b dir="ltr">{{ payload.cx.p.deg360 }}°</b></div>
                <div class="cx-cell"><small>rad</small><b dir="ltr">{{ payload.cx.p.rad }}</b></div>
                <div class="cx-cell"><small>z̄</small><b dir="ltr">{{ payload.cx.p.conj }}</b></div>
              </div>
            </template>

            <div class="steps-final">
              <span class="steps-tag">{{ t('calc.steps.final') }}</span>
              <code class="steps-expr fin" dir="ltr">{{ cxFinalText(payload.cx) }}</code>
            </div>
          </template>

          <template v-else-if="payload">
            <div class="steps-orig">
              <span class="steps-tag">{{ t('calc.steps.original') }}</span>
              <code class="steps-expr" dir="ltr">{{ payload.original }}</code>
            </div>

            <ol class="steps-list">
              <li v-for="(s, i) in payload.steps" :key="i" class="steps-item">
                <span class="steps-num">{{ i + 1 }}</span>
                <div class="steps-math" dir="ltr">
                  <code class="steps-sub">{{ s.sub }}</code>
                  <span class="steps-eq">=</span>
                  <span class="steps-res">{{ s.res }}</span>
                </div>
                <span class="steps-kind">{{ stepKindLabel(s) }}</span>
              </li>
            </ol>

            <div class="steps-final">
              <span class="steps-tag">{{ t('calc.steps.final') }}</span>
              <code class="steps-expr fin" dir="ltr">{{ payload.final }}</code>
            </div>
          </template>
        </div>

        <footer class="steps-foot">{{ payload && payload.type === 'ineq' ? t('calc.steps.ineq.hint') : t('calc.steps.hint') }}</footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── نافذة خطوات الحل بالترتيب ── */
.steps-overlay {
  position: fixed; inset: 0; z-index: 400;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  background: rgba(4, 8, 20, 0.62);
  backdrop-filter: blur(6px);
  overscroll-behavior: contain;
}
.steps-card {
  width: min(680px, 100%);
  max-height: min(86vh, 760px);
  display: flex; flex-direction: column;
  background: var(--bg-card);
  border: 2px solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: 8px 8px 0 var(--shadow-ink), var(--shadow-glow);
  animation: steps-pop 0.2s var(--transition);
}
@keyframes steps-pop {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}
.steps-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.8rem;
  padding: 1rem 1.1rem; border-bottom: 2px solid var(--border);
}
.steps-title { margin: 0; font-size: 1.15rem; color: var(--text-primary); }
.steps-sub { margin: 0.2rem 0 0; font-size: 0.82rem; color: var(--text-secondary); }
.steps-close {
  flex: none; width: 38px; height: 38px; cursor: pointer;
  border: 2px solid var(--line); border-radius: 10px;
  background: var(--bg-secondary); color: var(--text-primary);
  font: 700 1rem var(--font-main);
  box-shadow: 2px 2px 0 var(--shadow-ink);
  transition: transform var(--transition), box-shadow var(--transition);
}
.steps-close:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--shadow-ink); }
.steps-close:active { transform: translate(1px, 1px); box-shadow: none; }
.steps-body { overflow: auto; padding: 1rem 1.1rem; }
.steps-msg { color: var(--accent-danger); font-weight: 600; text-align: center; padding: 1.2rem 0.5rem; }
.steps-orig, .steps-final {
  display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
  margin-block: 0.2rem 1rem;
}
.steps-tag {
  flex: none; font-size: 0.72rem; font-weight: 800;
  color: #0d1633; background: var(--hl);
  border: 2px solid var(--line); border-radius: 999px; padding: 0.18rem 0.7rem;
}
.steps-expr {
  font: 700 1rem var(--font-mono); color: var(--accent);
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 8px; padding: 0.28rem 0.6rem;
  direction: ltr; text-align: left;
  overflow-x: auto; white-space: nowrap; max-width: 100%;
}
.steps-expr.fin { color: var(--accent-3); font-size: 1.25rem; }
.steps-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.steps-item {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) auto;
  align-items: center; gap: 0.65rem;
  background: var(--bg-card-hover);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.7rem;
}
.steps-num {
  width: 2rem; height: 2rem; display: grid; place-items: center;
  background: var(--accent); color: #fff;
  border-radius: 50%; font: 800 0.82rem var(--font-main);
  box-shadow: 2px 2px 0 var(--shadow-ink); flex: none;
}
.steps-math {
  display: flex; align-items: center; gap: 0.5rem; min-width: 0;
  direction: ltr; justify-content: flex-start;
}
.ineq-expr {
  font: 800 1.05rem var(--font-mono); color: var(--text-primary);
  direction: ltr; text-align: left; unicode-bidi: isolate;
  white-space: nowrap; overflow-x: auto; min-width: 0; scrollbar-width: thin;
}
.steps-sub {
  font: 700 0.95rem var(--font-mono); color: var(--text-primary);
  white-space: nowrap; overflow-x: auto; max-width: 100%; scrollbar-width: thin;
}
.steps-eq { color: var(--text-muted); font-weight: 800; flex: none; }
.steps-res { font: 800 1rem var(--font-mono); color: var(--accent-3); flex: none; }
.steps-kind {
  justify-self: end; text-align: left; direction: ltr;
  font-size: 0.72rem; font-weight: 700; color: var(--text-muted);
  background: var(--bg-secondary); border: 1px solid var(--border);
  border-radius: 999px; padding: 0.15rem 0.6rem; white-space: nowrap;
}
.steps-foot {
  padding: 0.7rem 1.1rem; border-top: 2px solid var(--border);
  font-size: 0.8rem; color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
/* ── تفاصيل الأعداد المركبة داخل نافذة الخطوات ── */
.cx-plain {
  text-align: center; padding: 1rem 0; margin: 0 0 1rem;
  font: 800 1.4rem var(--font-main); color: var(--accent-3);
}
.cx-note { margin: 0 0 .7rem; font-size: .8rem; color: var(--text-secondary); text-align: center; }
.cx-roots { list-style: none; margin: 0 0 1rem; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
.cx-roots li {
  display: flex; align-items: baseline; justify-content: center; gap: .55rem;
  background: var(--bg-card-hover); border: 1.5px solid var(--border);
  border-radius: var(--radius-md); padding: .55rem .8rem;
}
.cx-root-var { font: 800 .9rem var(--font-mono); color: var(--text-secondary); }
.cx-root-eq { color: var(--text-muted); font-weight: 800; }
.cx-root-val { font: 800 1.1rem var(--font-mono); color: var(--accent-3); direction: ltr; unicode-bidi: isolate; }
.cx-main {
  font: 800 1.35rem var(--font-mono); color: var(--text-primary);
  text-align: center; padding: .4rem 0; word-break: break-word;
  direction: ltr; unicode-bidi: isolate;
}
.cx-sub { font: 700 1rem var(--font-mono); color: var(--text-secondary); text-align: center; padding-bottom: .5rem; direction: ltr; }
.cx-arg { font: 800 2rem var(--font-mono); color: var(--accent-3); text-align: center; padding: .2rem 0 .5rem; direction: ltr; }
.cx-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: .5rem; margin: .8rem 0; padding: .8rem 0 0; border-top: 2px dashed var(--border);
}
.cx-cell { background: var(--bg-secondary); border: 1.5px solid var(--border); border-radius: 10px; padding: .5rem .5rem .55rem; text-align: center; }
.cx-cell small { display: block; font-size: .7rem; font-weight: 800; color: var(--text-muted); margin-bottom: .2rem; }
.cx-cell b { display: block; font: 700 .92rem var(--font-mono); direction: ltr; unicode-bidi: isolate; color: var(--text-primary); overflow-wrap: anywhere; }
@media (max-width: 480px) {
  .steps-item { grid-template-columns: 2rem minmax(0, 1fr); }
  .steps-kind { grid-column: 2; justify-self: start; text-align: left; }
}
</style>
