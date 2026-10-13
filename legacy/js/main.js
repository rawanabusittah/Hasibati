// ============================================================
// main.js — منطق صفحة الأدوات (سكربت كلاسيكي يُحمَّل في نهاية كل صفحة)
//  • التنقّل العلوي: الرابط النشط + قائمة الجوال
//  • الآلة الحاسبة العلمية  (calculator.html)
//  • محوّل الأنظمة الرقمية   (numbers.html)
//  • حاسبة الأشكال الهندسية  (geometry.html)
//  • صفحة التواصل           (contact.html)
//
// يعتمد على: site-config.js · layout.js · i18n.js
//            core.js (MathEngine / BaseConv) · cloud.js (Supabase اختياري)
// كل أداة تبدأ عملها فقط عندما توجد عناصرها في الصفحة الحالية.
// ============================================================
(function () {
  'use strict';

  const $  = (id) => document.getElementById(id);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  // ── اعتماد آمن على الملفات الأساسية (قد لا تُحمَّل كلها في كل صفحة) ──
  const ME = (typeof MathEngine !== 'undefined') ? MathEngine : null;
  const BC = (typeof BaseConv !== 'undefined') ? BaseConv : null;
  const tr = (typeof t === 'function') ? t : (k => k);
  const isEn = () => (typeof I18N !== 'undefined') ? I18N.lang === 'en' : false;
  const L  = (ar, en) => (isEn() ? en : ar);
  const save = (tool, input, output) => {
    try {
      if (typeof Cloud !== 'undefined' && Cloud.saveTool) Cloud.saveTool(tool, input, output);
    } catch (e) { /* صامت */ }
  };

  // تنسيق رقم: نستعمل MathEngine إن وُجد، وإلا تقريب بسيط
  const fmt = (n) => {
    if (!Number.isFinite(n)) return String(n);
    if (ME) return ME.format(n);
    if (n === 0) return '0';
    const a = Math.abs(n);
    if (a >= 1e15 || a < 1e-9) return n.toExponential(8).replace(/\.?0+e/, 'e').replace('e+', 'e');
    return String(Number(n.toPrecision(12)));
  };

  // نسخ إلى الحافظة مع رسالة «تم النسخ»
  function copyText(text, btn, labelKey) {
    labelKey = labelKey || 'calc.copy';
    const done = () => {
      if (!btn) return;
      btn.classList.add('copied');
      btn.disabled = true;
      btn.textContent = tr('calc.copied');
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.disabled = false;
        btn.textContent = tr(labelKey);
      }, 1400);
    };
    const legacy = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* تجاهل */ }
      ta.remove();
      done();
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(legacy);
    } else legacy();
  }

  // ═══════════════ شريط التنقّل العلوي ═══════════════
  function initNav() {
    const current = (location.pathname.split('/').pop() || 'index.html').split(/[?#]/)[0];
    $$('.navbar-links a').forEach(a => {
      const href = (a.getAttribute('href') || '').split(/[?#]/)[0];
      if (href && href.split('/').pop() === current) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
    const toggle = document.querySelector('.menu-toggle');
    const links  = document.querySelector('.navbar-links');
    if (toggle && links) {
      const set = (open) => {
        links.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
      };
      toggle.addEventListener('click', () => set(!links.classList.contains('open')));
      links.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') set(false);
      });
    }
  }

  // ═══════════════ الآلة الحاسبة العلمية ═══════════════
  const Calculator = (function () {
    const CATS = ['arith', 'power', 'trig', 'log', 'calculus', 'combo', 'history'];
    // v: النص المُدرج في الشريط · n: الاسم [ع/إ] · s: الصيغة · d: الوصف [ع/إ] · x: مثال
    const OPS = {
      arith: [
        { v:'+',   n:['جمع','Add'], s:'a + b', d:['يجمع عددين أو أكثر.','Adds two or more numbers.'], x:'12+8' },
        { v:'-',   n:['طرح','Subtract'], s:'a − b', d:['يطرح الثاني من الأول.','Subtracts the second from the first.'], x:'50-18' },
        { v:'×',   n:['ضرب','Multiply'], s:'a × b', d:['يضرب عددين أو أكثر.','Multiplies numbers.'], x:'7×6' },
        { v:'÷',   n:['قسمة','Divide'], s:'a ÷ b', d:['يقسم الأول على الثاني.','Divides the first by the second.'], x:'84÷4' },
        { v:'%',   n:['نسبة مئوية','Percent'], s:'a + b%', d:['تضيف 10% من 200 إلى 200 = 220.','Adds 10% of 200 to 200 = 220.'], x:'200+10%' },
        { v:'mod(', n:['باقي القسمة','Remainder'], s:'mod(a, b)', d:['باقي قسمة a ÷ b.','Remainder of a ÷ b.'], x:'mod(17,5)' },
        { v:'abs(', n:['القيمة المطلقة','Absolute value'], s:'abs(a)', d:['البعد عن الصفر دائماً موجب.','Always non-negative distance from zero.'], x:'abs(-9)' },
        { v:'round(', n:['تقريب','Round'], s:'round(a)', d:['يقرّب لأقرب عدد صحيح.','Rounds to the nearest integer.'], x:'round(3.6)' },
        { v:'floor(', n:['تقريب للأدنى','Floor'], s:'floor(a)', d:['أكبر عدد صحيح ≤ a.','Largest integer ≤ a.'], x:'floor(3.9)' },
        { v:'ceil(', n:['تقريب للأعلى','Ceil'], s:'ceil(a)', d:['أصغر عدد صحيح ≥ a.','Smallest integer ≥ a.'], x:'ceil(3.1)' }
      ],
      power: [
        { v:'^',    n:['رفع لأس','Power'], s:'x^y', d:['يرفع الأساس إلى الأس.','Raises the base to an exponent.'], x:'2^10' },
        { v:'√',    n:['جذر تربيعي','Square root'], s:'√x', d:['الجذر التربيعي الموجب.','The positive square root.'], x:'√49' },
        { v:'cbrt(', n:['جذر تكعيبي','Cube root'], s:'cbrt(x)', d:['الجذر التكعيبي لأي عدد.','Cube root of any number.'], x:'cbrt(27)' },
        { v:'root(', n:['جذر عام','nth root'], s:'root(x, n)', d:['الجذر النوني للعدد.','The n-th root of a number.'], x:'root(8,3)' },
        { v:'exp(',  n:['أُسّ طبيعي','Exponential'], s:'exp(x)', d:['e مرفوع لأس x.','e raised to the power x.'], x:'exp(1)' }
      ],
      trig: [
        { v:'sin(',  n:['جيب','Sine'], s:'sin(x)', d:['جيب الزاوية (بالدرجات أو الراديان حسب الوضع).','Sine of the angle (degrees or radians).'], x:'sin(30)' },
        { v:'cos(',  n:['جيب تمام','Cosine'], s:'cos(x)', d:['جيب تمام الزاوية.','Cosine of the angle.'], x:'cos(60)' },
        { v:'tan(',  n:['ظل','Tangent'], s:'tan(x)', d:['ظل الزاوية.','Tangent of the angle.'], x:'tan(45)' },
        { v:'asin(', n:['قوس الجيب','Arcsine'], s:'asin(x)', d:['الزاوية التي جيبها x.','The angle whose sine is x.'], x:'asin(0.5)' },
        { v:'acos(', n:['قوس جيب التمام','Arccosine'], s:'acos(x)', d:['الزاوية التي جيب تمامها x.','The angle whose cosine is x.'], x:'acos(0.5)' },
        { v:'atan(', n:['قوس الظل','Arctangent'], s:'atan(x)', d:['الزاوية التي ظلها x.','The angle whose tangent is x.'], x:'atan(1)' }
      ],
      log: [
        { v:'ln(',  n:['لوغاريتم طبيعي','Natural log'], s:'ln(x)', d:['اللوغاريتم للأساس e.','Logarithm base e.'], x:'ln(e)' },
        { v:'log(', n:['لوغاريتم عشري','Common log'], s:'log(x)', d:['اللوغاريتم للأساس 10.','Logarithm base 10.'], x:'log(100)' },
        { v:'log2(', n:['لوغاريتم ثنائي','Binary log'], s:'log2(x)', d:['اللوغاريتم للأساس 2.','Logarithm base 2.'], x:'log2(8)' },
        { v:'logb(', n:['لوغاريتم بأساس اختياري','Log base b'], s:'logb(x, b)', d:['اللوغاريتم للأساس b.','Logarithm to a chosen base.'], x:'logb(8,2)' }
      ],
      calculus: [
        { v:'diff(',  n:['مشتقة أولى','First derivative'], s:'diff(f, x0)', d:['مشتقة الدالة عند نقطة (عددية).','Numerical derivative at a point.'], x:'diff(x^2,3)' },
        { v:'diff2(', n:['مشتقة ثانية','Second derivative'], s:'diff2(f, x0)', d:['المشتقة الثانية عند نقطة.','Second derivative at a point.'], x:'diff2(x^3,2)' },
        { v:'int(',   n:['تكامل محدد','Definite integral'], s:'int(f, a, b)', d:['تكامل الدالة من a إلى b.','Integral from a to b.'], x:'int(x^2,0,3)' },
        { v:'sum(',   n:['مجموع Σ','Sum'], s:'sum(f, a, b)', d:['مجموع الدالة على الأعداد الصحيحة.','Sum over integers.'], x:'sum(x^2,1,5)' },
        { v:'prod(',  n:['جداء Π','Product'], s:'prod(f, a, b)', d:['جداء الدالة على الأعداد الصحيحة.','Product over integers.'], x:'prod(x,1,5)' }
      ],
      combo: [
        { v:'nCr(', n:['توافيق','Combination'], s:'nCr(n, r)', d:['عدد طرق اختيار r من n.','Ways to choose r from n.'], x:'nCr(5,2)' },
        { v:'nPr(', n:['تباديل','Permutation'], s:'nPr(n, r)', d:['عدد التباديل المرتبة.','Ordered arrangements.'], x:'nPr(5,2)' },
        { v:'gcd(', n:['قاسم مشترك أكبر','Greatest common divisor'], s:'gcd(a, b)', d:['أكبر عدد يقسم العددين.','Largest number dividing both.'], x:'gcd(12,18)' },
        { v:'lcm(', n:['مضاعف مشترك أصغر','Least common multiple'], s:'lcm(a, b)', d:['أصغر مضاعف مشترك.','Smallest common multiple.'], x:'lcm(4,6)' },
        { v:'avg(', n:['متوسط حسابي','Average'], s:'avg(a, b, …)', d:['متوسط مجموعة أعداد.','Mean of numbers.'], x:'avg(2,4,6)' },
        { v:'max(', n:['القيمة العظمى','Maximum'], s:'max(a, b, …)', d:['أكبر قيمة بين الأعداد.','Largest value.'], x:'max(3,9,5)' },
        { v:'min(', n:['القيمة الصغرى','Minimum'], s:'min(a, b, …)', d:['أصغر قيمة بين الأعداد.','Smallest value.'], x:'min(3,9,5)' },
        { v:'!',   n:['مضروب','Factorial'], s:'n!', d:['جداء الأعداد من 1 إلى n.','Product of 1..n.'], x:'5!' }
      ]
    };

    const LS_HIST = 'hp_calc_history';
    const LS_ANG  = 'hp_angle';

    let state = null;
    let active = false;

    function getHistory() {
      try { return JSON.parse(localStorage.getItem(LS_HIST)) || []; }
      catch (e) { return []; }
    }
    function setHistory(arr) {
      try { localStorage.setItem(LS_HIST, JSON.stringify(arr.slice(0, 50))); } catch (e) { /* تجاهل */ }
    }
    function getAngle() {
      try { return localStorage.getItem(LS_ANG) === 'rad' ? 'rad' : 'deg'; }
      catch (e) { return 'deg'; }
    }

    function exampleResult(x) {
      if (!ME) return '';
      try { return fmt(ME.evaluate(x, { angle: getAngle(), vars: { x: 0 } })); }
      catch (e) { return '\u2014'; }
    }

    function el(tag, cls, text) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }

    function buildCat(cat) {
      const list = el('div', 'ops-list');
      list.dataset.cat = cat;
      (OPS[cat] || []).forEach(op => list.appendChild(buildItem(op)));
      return list;
    }

    function buildItem(op) {
      const item = el('div', 'ops-item');
      const head = document.createElement('button');
      head.type = 'button';
      head.className = 'ops-head';
      head.setAttribute('aria-expanded', 'false');
      head.appendChild(el('span', 'ops-name', L(op.n[0], op.n[1])));
      head.appendChild(el('span', 'ops-syn', op.s));
      const chev = el('span', 'ops-chev', '\u25BC');
      chev.setAttribute('aria-hidden', 'true');
      head.appendChild(chev);

      const panel = el('div', 'ops-panel');
      panel.hidden = true;
      panel.appendChild(el('p', 'ops-desc', L(op.d[0], op.d[1])));

      const ex = el('div', 'ops-example');
      ex.appendChild(el('small', '', 'EX'));
      ex.appendChild(el('div', 'ex-expr', op.x));
      const exRes = el('div', 'ex-res', exampleResult(op.x));
      exRes.dataset.ex = op.x;
      ex.appendChild(exRes);

      const acts = el('div', 'ops-actions');
      const ins = document.createElement('button');
      ins.type = 'button';
      ins.className = 'ops-act primary';
      ins.textContent = tr('calc.insert');
      ins.dataset.insert = op.v;
      const tryEx = document.createElement('button');
      tryEx.type = 'button';
      tryEx.className = 'ops-act';
      tryEx.textContent = tr('calc.tryEx');
      tryEx.dataset.tryex = op.x;
      acts.appendChild(ins);
      acts.appendChild(tryEx);

      panel.appendChild(ex);
      panel.appendChild(acts);
      item.appendChild(head);
      item.appendChild(panel);

      head.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        panel.hidden = !open;
        head.setAttribute('aria-expanded', String(open));
      });
      return item;
    }

    function renderOps() {
      const grid = state.grid;
      if (!grid) return;
      grid.textContent = '';
      CATS.forEach(cat => { if (cat !== 'history') grid.appendChild(buildCat(cat)); });
      if (state.currentCat) selectCat(state.currentCat, true);
      else selectCat('arith', true);
    }

    function selectCat(cat, skip) {
      if (!state) return;
      state.currentCat = cat;
      $$('.ops-tab').forEach(btn => {
        const on = btn.dataset.opsTab === cat;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', String(on));
        if (state.catTabs) btn.tabIndex = on ? 0 : -1;
      });
      $$('.ops-list', state.grid).forEach(list => { list.hidden = list.dataset.cat !== cat; });
      if (state.hist) state.hist.hidden = cat !== 'history';
      if (cat === 'history') renderHistory();
    }

    function renderHistory() {
      const ul = state.histList;
      if (!ul) return;
      const items = getHistory();
      ul.textContent = '';
      if (!items.length) {
        const li = el('li', 'history-empty', tr('calc.history.empty'));
        ul.appendChild(li);
        return;
      }
      items.slice().reverse().forEach(h => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'history-item';
        btn.appendChild(el('span', 'h-expr', h.e));
        btn.appendChild(el('span', 'h-res', h.r));
        btn.addEventListener('click', () => {
          state.input.value = h.e;
          preview();
          state.input.focus();
        });
        li.appendChild(btn);
        ul.appendChild(li);
      });
    }

    const errKey = (code) => 'calc.err.' + (code === 'div0' ? 'div0' : code === 'domain' ? 'domain' : 'syntax');

    function evaluate(str) {
      if (!ME) return { error: 'syntax' };
      try { return { value: ME.evaluate(str, { angle: getAngle(), vars: { x: 0 } }) }; }
      catch (e) { return { error: (e && e.code) || 'syntax' }; }
    }

    function preview() {
      const src = state.input.value.trim();
      if (!src) {
        state.result.textContent = '0';
        state.result.classList.remove('is-error');
        state.last = '';
        state.ok = false;
        return;
      }
      const r = evaluate(src);
      if (r.error) {
        state.result.textContent = tr(errKey(r.error));
        state.result.classList.add('is-error');
        state.last = '';
        state.ok = false;
      } else {
        state.result.textContent = fmt(r.value);
        state.result.classList.remove('is-error');
        state.last = fmt(r.value);
        state.ok = true;
      }
    }

    function record() {
      const src = state.input.value.trim();
      if (!src) return;
      const wasOk = state.ok;
      preview();
      if (!wasOk) return; // لم تُحسب النتيجة
      const items = getHistory();
      items.push({ e: src, r: state.last });
      setHistory(items);
      renderHistory();
      save('calculator', src, state.last);
    }

    function insert(text) {
      const inp = state.input;
      const start = inp.selectionStart != null ? inp.selectionStart : inp.value.length;
      const end   = inp.selectionEnd != null ? inp.selectionEnd : inp.value.length;
      inp.value = inp.value.slice(0, start) + text + inp.value.slice(end);
      const caret = start + text.length;
      inp.focus();
      inp.setSelectionRange(caret, caret);
      preview();
    }

    function back() {
      const inp = state.input;
      const start = inp.selectionStart != null ? inp.selectionStart : inp.value.length;
      const end   = inp.selectionEnd != null ? inp.selectionEnd : inp.value.length;
      if (start !== end) {
        inp.value = inp.value.slice(0, start) + inp.value.slice(end);
        inp.setSelectionRange(start, start);
      } else if (start > 0) {
        inp.value = inp.value.slice(0, start - 1) + inp.value.slice(end);
        inp.setSelectionRange(start - 1, start - 1);
      }
      preview();
    }

    function negate() {
      const inp = state.input;
      let v = inp.value;
      const m = v.match(/(^|[^0-9.])(\d+(?:\.\d+)?)$/);
      if (m) v = v.slice(0, m.index + 1) + '(-' + m[2] + ')';
      else v += '-';
      inp.value = v;
      preview();
      inp.focus();
    }

    function toggleMode() {
      const next = getAngle() === 'deg' ? 'rad' : 'deg';
      try { localStorage.setItem(LS_ANG, next); } catch (e) { /* تجاهل */ }
      const btn = state.modeBtn;
      if (btn) {
        btn.textContent = next === 'deg' ? 'DEG' : 'RAD';
        btn.setAttribute('aria-pressed', String(next === 'deg'));
      }
      // تحديث نتائج الأمثلة حسب الوحدة الجديدة
      $$('.ex-res', state.grid).forEach(r => { if (r.dataset.ex) r.textContent = exampleResult(r.dataset.ex); });
      preview();
    }

    function handlePad(e) {
      const btn = e.target.closest('[data-calc]');
      if (!btn) return;
      e.preventDefault();
      const act = btn.dataset.calc;
      switch (act) {
        case 'append': insert(btn.dataset.val || ''); break;
        case 'clear':
          state.input.value = '';
          preview();
          state.input.focus();
          break;
        case 'back': back(); break;
        case 'fn': {
          const v = btn.dataset.val;
          if (v === 'neg') negate();
          else if (v === 'pi') insert('\u03C0');
          else if (v === 'e') insert('e');
          break;
        }
        case 'mode': toggleMode(); break;
        case 'equals': record(); break;
        case 'copy': if (state.ok && state.last) copyText(state.last, btn); break;
        case 'clear-history': setHistory([]); renderHistory(); selectCat('history', true); break;
      }
    }

    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target;
      const tag = (target && target.tagName || '').toLowerCase();
      const inField = tag === 'input' || tag === 'textarea';
      if (inField) {
        if (state.input && target === state.input && e.key === 'Enter') {
          e.preventDefault();
          record();
        }
        return; // لا نتدخل في حقول أخرى
      }
      const map = {
        '0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9',
        '.':'.','+':'+','-':'-','*':'\u00D7','/':'\u00F7','^':'^','%':'%','!':'!',
        '(':'(',')':')',',':',','x':'x'
      };
      if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); record(); return; }
      if (e.key === 'Backspace') { e.preventDefault(); back(); return; }
      if (e.key === 'Delete' || e.key === 'Escape') { e.preventDefault(); state.input.value = ''; preview(); return; }
      if (map[e.key]) { e.preventDefault(); insert(map[e.key]); }
    }

    function onLang() {
      renderOps();          // أسماء ووصف العمليات حسب اللغة
      renderHistory();
      toggleModeLabels();
      preview();
    }

    function toggleModeLabels() {
      const btn = state.modeBtn;
      if (btn) btn.textContent = getAngle() === 'deg' ? 'DEG' : 'RAD';
    }

    function init() {
      const input = $('calc-expr');
      if (!input) return;
      active = true;
      state = {
        input: input,
        result: $('calc-result'),
        grid: $('ops-grid'),
        hist: $('ops-history'),
        histList: $('calc-history'),
        modeBtn: $$('button[data-calc="mode"]')[0] || null,
        currentCat: 'arith',
        ok: false,
        last: ''
      };
      if (!state.result || !state.grid) return;

      renderOps();
      toggleModeLabels();

      input.addEventListener('input', preview);

      const pad = document.querySelector('.calc-buttons');
      if (pad) pad.addEventListener('click', handlePad);

      // أزرار العمليات
      document.addEventListener('click', (e) => {
        const ins = e.target.closest('.ops-act[data-insert]');
        if (ins) { e.preventDefault(); insert(ins.dataset.insert); return; }
        const tryEx = e.target.closest('.ops-act[data-tryex]');
        if (tryEx) {
          e.preventDefault();
          state.input.value = tryEx.dataset.tryex;
          preview();
          record(); // يُسجل في السجل عند تجربة مثال
          state.input.focus();
        }
      });

      // التبويبات
      $$('.ops-tab').forEach(btn => {
        btn.addEventListener('click', () => selectCat(btn.dataset.opsTab));
      });

      // زر «مسح السجل» داخل لوحة السجل (خارج شبكة الأزرار)
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-calc="clear-history"]');
        if (!btn) return;
        e.preventDefault();
        setHistory([]);
        renderHistory();
      });

      document.addEventListener('keydown', onKey);

      // زر وضع الزوايا (DEG/RAD) في شريط الإدخال — خارج شبكة الأزرار
      const modeBtn = state.modeBtn;
      if (modeBtn) modeBtn.addEventListener('click', () => { toggleMode(); });

      // أيقونة النسخ في نتيجة الشريط
      const copyBtn = $$('button[data-calc="copy"]')[0];
      if (copyBtn) copyBtn.addEventListener('click', () => {
        const text = (state.ok && state.last) ? state.last : state.input.value.trim();
        if (text) copyText(text, copyBtn);
      });
    }

    return { init, onLang, get active() { return active; } };
  })();

  // ═══════════════ محوّل الأنظمة الرقمية ═══════════════
  const NumberTool = (function () {
    const BASES = [2, 8, 10, 16];
    let st = null;
    let active = false;

    function detectBase(raw) {
      const s = String(raw).trim().replace(/[\s_]/g, '').toUpperCase();
      const m = s.match(/^[+-]?0([XB]|O)/);
      if (m) {
        if (m[1] === 'X') return 16;
        if (m[1] === 'B') return 2;
        if (m[1] === 'O') return 8;
      }
      const sel = st.sel;
      return sel && sel.value ? parseInt(sel.value, 10) : 10;
    }

    function convert() {
      if (!st) return;
      const raw = st.input.value;
      const errEl = st.err;
      if (!raw.trim()) {
        errEl.textContent = '';
        st.input.setAttribute('aria-invalid', 'false');
        st.grid.style.display = 'none';
        if (st.empty) st.empty.style.display = '';
        if (st.info) st.info.textContent = '';
        return;
      }
      const base = detectBase(raw);
      const p = BC ? BC.parse(raw, base) : { error: 'failed' };
      if (p.error) {
        let msg;
        if (p.error === 'required') msg = tr('num.required');
        else if (p.error === 'tooLong') msg = tr('num.tooLong');
        else msg = tr('num.invalid', { base: tr('base.' + base) });
        errEl.textContent = msg;
        st.input.setAttribute('aria-invalid', 'true');
        st.grid.style.display = 'none';
        if (st.empty) st.empty.style.display = '';
        if (st.info) st.info.textContent = '';
        return;
      }
      errEl.textContent = '';
      st.input.setAttribute('aria-invalid', 'false');
      if (st.empty) st.empty.style.display = 'none';

      st.grid.textContent = '';
      let truncated = false;
      BASES.forEach(b => {
        const r = BC.toBase(p, b, 20);
        if (r.truncated) truncated = true;
        const val = (p.neg ? '-' : '') + r.text;
        const item = document.createElement('div');
        item.className = 'num-result-item';

        const label = document.createElement('div');
        label.className = 'sys-label';
        label.textContent = tr('sys.' + b);

        const num = document.createElement('div');
        num.className = 'sys-value' + (b === base ? ' accent' : '');
        num.textContent = val;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-btn';
        btn.textContent = tr('calc.copy');
        btn.dataset.copy = val;

        item.appendChild(label);
        item.appendChild(num);
        item.appendChild(btn);
        st.grid.appendChild(item);
      });
      st.grid.style.display = '';

      // معلومات إضافية: البتات/البايت + تنبيه الكسور الدورية
      if (st.info) {
        const bits = BC.bitInfo(p);
        let msg = tr('num.bits', { bits: bits.bits, bytes: bits.bytes });
        if (truncated) msg += ' \u00B7 ' + tr('num.truncated', { n: 20 });
        st.info.textContent = msg;
      }

      // تمثيل عشري للحفظ في السجل السحابي
      const dec = (p.neg ? '-' : '') + BC.toBase(p, 10).text;
      save('numbers', raw, dec);
    }

    function init() {
      const input = $('num-input');
      if (!input) return;
      active = true;
      st = {
        input: input,
        sel: $('from-base'),
        grid: $('num-results'),
        info: $('num-info'),
        err: $('num-error'),
        empty: document.querySelector('.num-page .res-empty') || $('res-empty') || null
      };
      if (!st.grid) return;

      input.addEventListener('input', convert);
      if (st.sel) st.sel.addEventListener('change', convert);
      const go = document.querySelector('[data-convert-num]');
      if (go) go.addEventListener('click', (e) => { e.preventDefault(); convert(); });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); convert(); } });

      // الأمثلة السريعة
      document.addEventListener('click', (e) => {
        const chip = e.target.closest('.ex-chip[data-example]');
        if (!chip) return;
        input.value = chip.dataset.example;
        const b = chip.dataset.base;
        if (st.sel && b && st.sel.value !== b) {
          st.sel.value = b;
          st.sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        convert();
        input.focus();
      });
    }

    function onLang() { convert(); }

    return { init, onLang, get active() { return active; } };
  })();

  // ═══════════════ حاسبة الأشكال الهندسية ═══════════════
  const GeoTool = (function () {
    const U2 = 'geo.unit2';
    const U3 = 'geo.unit3';
    const U  = 'geo.unit';
    let lastResults = {}; // id → [items]
    let active = false;

    const round = (n) => (Number.isFinite(n) ? n : NaN);

    function itemsToHTML(id, items) {
      const grid = $(id + '-results');
      if (!grid) return;
      const empty = grid.closest('.geo-res');
      grid.textContent = '';
      items.forEach(it => {
        const box = document.createElement('div');
        box.className = 'geo-result-item';
        box.appendChild(createEl('div', 'geo-label', it.label));
        const val = document.createElement('div');
        val.className = 'geo-val' + (it.isText ? ' is-text' : '');
        val.appendChild(document.createTextNode(it.value));
        if (it.unit) {
          const sm = document.createElement('small');
          sm.textContent = it.unit;
          val.appendChild(sm);
        }
        box.appendChild(val);
        if (it.formula) box.appendChild(createEl('div', 'geo-formula', it.formula));
        grid.appendChild(box);
      });
      grid.style.display = '';
      if (empty) { const ep = empty.querySelector('.res-empty'); if (ep) ep.style.display = 'none'; }
    }

    function createEl(tag, cls, text) {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }

    function setError(id, msg) {
      const box = $(id + '-error');
      if (box) box.textContent = msg;
    }

    function num(id) {
      const inp = $(id);
      const v = inp ? parseFloat(inp.value) : NaN;
      return { v, input: inp };
    }

    function showError(id, key, units) {
      setError(id, tr(key));
      return false;
    }

    // ── الحسابات ──
    function calcCircle() {
      const { v: r, input } = num('circle-r');
      if (!(r > 0)) return showError('circle', 'geo.err.r');
      setError('circle', '');
      const items = [
        { label: tr('geo.area'),       value: fmt(Math.PI * r * r),    unit: tr(U2), formula: 'A = \u03C0 \u00D7 r\u00B2' },
        { label: tr('geo.perimeter'),  value: fmt(2 * Math.PI * r),    unit: tr(U),  formula: 'C = 2 \u00D7 \u03C0 \u00D7 r' },
        { label: tr('geo.diag2'),      value: fmt(2 * r),              unit: tr(U),  formula: 'd = 2 \u00D7 r' }
      ];
      renderAndSave('circle', items, 'r=' + r);
    }
    function calcSquare() {
      const { v: a, input } = num('square-side');
      if (!(a > 0)) return showError('square', 'geo.err.side');
      setError('square', '');
      const items = [
        { label: tr('geo.area'),      value: fmt(a * a),      unit: tr(U2), formula: 'A = a\u00B2' },
        { label: tr('geo.perimeter'), value: fmt(4 * a),      unit: tr(U),  formula: 'P = 4 \u00D7 a' },
        { label: tr('geo.diag'),      value: fmt(a * Math.SQRT2), unit: tr(U), formula: 'd = a \u00D7 \u221A2' }
      ];
      renderAndSave('square', items, 'a=' + a);
    }
    function calcRect() {
      const { v: w, input: wi } = num('rect-w');
      const { v: h, input: hi } = num('rect-h');
      if (!(w > 0) || !(h > 0)) return showError('rect', 'geo.err.rect');
      setError('rect', '');
      const items = [
        { label: tr('geo.area'),      value: fmt(w * h),                unit: tr(U2), formula: 'A = w \u00D7 h' },
        { label: tr('geo.perimeter'), value: fmt(2 * (w + h)),           unit: tr(U),  formula: 'P = 2 \u00D7 (w + h)' },
        { label: tr('geo.diag'),      value: fmt(Math.sqrt(w * w + h * h)), unit: tr(U), formula: 'd = \u221A(w\u00B2 + h\u00B2)' }
      ];
      renderAndSave('rect', items, 'w=' + w + ', h=' + h);
    }
    function calcTriangle() {
      const { v: a, input: ai } = num('tri-a');
      const { v: b, input: bi } = num('tri-b');
      const { v: c, input: ci } = num('tri-c');
      if (!(a > 0) || !(b > 0) || !(c > 0)) return showError('tri', 'geo.err.side');
      if (a + b <= c || a + c <= b || b + c <= a) return showError('tri', 'geo.err.tri');
      setError('tri', '');
      const s = (a + b + c) / 2;
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      // نوع المثلث
      let type = 'scal';
      const sq = [a, b, c].map(x => x * x).sort((x, y) => x - y);
      if (a === b && b === c) type = 'equi';
      else if (Math.abs(sq[0] + sq[1] - sq[2]) < 1e-9) type = 'right';
      else if (a === b || b === c || a === c) type = 'iso';
      const items = [
        { label: tr('geo.perimeter'),   value: fmt(a + b + c), unit: tr(U),  formula: 'P = a + b + c' },
        { label: tr('geo.semiperim'),   value: fmt(s),         unit: tr(U),  formula: 's = (a + b + c) \u00F7 2' },
        { label: tr('geo.area'),        value: fmt(area),      unit: tr(U2), formula: 'A = \u221A(s(s\u2212a)(s\u2212b)(s\u2212c))' },
        { label: tr('geo.type'),        value: tr('geo.type.' + type), isText: true, formula: '' },
        { label: tr('geo.inradius'),    value: fmt(area / s),  unit: tr(U),  formula: 'r = A \u00F7 s' },
        { label: tr('geo.circumradius'),value: fmt((a * b * c) / (4 * area)), unit: tr(U), formula: 'R = (a \u00D7 b \u00D7 c) \u00F7 (4A)' }
      ];
      renderAndSave('triangle', items, 'a=' + a + ', b=' + b + ', c=' + c);
    }
    function calcSphere() {
      const { v: r, input } = num('sphere-r');
      if (!(r > 0)) return showError('sphere', 'geo.err.r');
      setError('sphere', '');
      const items = [
        { label: tr('geo.volume'),  value: fmt((4 / 3) * Math.PI * Math.pow(r, 3)), unit: tr(U3), formula: 'V = 4/3 \u00D7 \u03C0 \u00D7 r\u00B3' },
        { label: tr('geo.surface'), value: fmt(4 * Math.PI * r * r),           unit: tr(U2), formula: 'S = 4 \u00D7 \u03C0 \u00D7 r\u00B2' }
      ];
      renderAndSave('sphere', items, 'r=' + r);
    }

    const CALCS = {
      circle: calcCircle, square: calcSquare, rect: calcRect,
      triangle: calcTriangle, sphere: calcSphere
    };

    function renderAndSave(id, items, params) {
      lastResults[id] = items;
      itemsToHTML(id, items);
      save('geometry', id, params);
    }

    function onLang() {
      Object.keys(lastResults).forEach(id => itemsToHTML(id, lastResults[id]));
    }

    function init() {
      if (!document.querySelector('.geo-tab')) return;
      active = true;

      // التبويبات
      document.addEventListener('click', (e) => {
        const tab = e.target.closest('.geo-tab');
        if (!tab) return;
        const id = tab.dataset.geoTab;
        $$('.geo-tab').forEach(b => {
          const on = b === tab;
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', String(on));
        });
        $$('.geo-panel').forEach(p => p.classList.toggle('active', p.id === id));
        $$('.geo-res').forEach(r => r.classList.toggle('active', r.dataset.resFor === id));
      });

      // أزرار الحساب
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-geo-calc]');
        if (!btn) return;
        const fn = CALCS[btn.dataset.geoCalc];
        if (fn) fn();
      });

      // Enter داخل حقول الشكل النشط
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const inp = e.target;
        if (!inp || !inp.classList || !inp.closest) return;
        const panel = inp.closest('.geo-panel.active');
        if (!panel || inp.tagName !== 'INPUT') return;
        e.preventDefault();
        const btn = panel.querySelector('[data-geo-calc]');
        if (btn) btn.click();
      });
    }

    return { init, onLang, get active() { return active; } };
  })();

  // ═══════════════ صفحة التواصل ═══════════════
  const Contact = (function () {
    let active = false;

    function renderContactInfo() {
      const list = $('contact-info-list');
      if (!list) return;
      const empty = $('contact-empty');
      const cfg = window.SITE || {};
      const entries = [];
      if (cfg.email) entries.push({ icon: '\u2709\uFE0F', label: L('بريد إلكتروني', 'Email'), value: cfg.email, href: 'mailto:' + cfg.email });
      if (cfg.github) entries.push({ icon: '\u{1F5C2}\uFE0F', label: 'GitHub', value: cfg.github, href: /^https?:\/\//.test(cfg.github) ? cfg.github : 'https://github.com/' + cfg.github });
      if (cfg.linkedin) entries.push({ icon: '\u{1F465}', label: 'LinkedIn', value: cfg.linkedin, href: /^https?:\/\//.test(cfg.linkedin) ? cfg.linkedin : 'https://www.linkedin.com/in/' + cfg.linkedin });
      if (cfg.twitter) entries.push({ icon: '\u{1F4AC}', label: L('منصة X', 'X (Twitter)'), value: cfg.twitter, href: /^https?:\/\//.test(cfg.twitter) ? cfg.twitter : 'https://x.com/' + cfg.twitter });

      list.textContent = '';
      entries.forEach(en => {
        const a = document.createElement('a');
        a.className = 'contact-info-item';
        a.href = en.href;
        a.target = en.href.indexOf('mailto:') === 0 ? '_self' : '_blank';
        a.rel = 'noopener noreferrer';
        const ic = document.createElement('span');
        ic.className = 'ci-icon';
        ic.setAttribute('aria-hidden', 'true');
        ic.textContent = en.icon;
        const body = document.createElement('div');
        const lab = document.createElement('div');
        lab.className = 'ci-label';
        lab.textContent = en.label;
        const val = document.createElement('div');
        val.className = 'ci-value';
        val.textContent = en.value;
        body.appendChild(lab);
        body.appendChild(val);
        a.appendChild(ic);
        a.appendChild(body);
        list.appendChild(a);
      });
      if (empty) empty.style.display = entries.length ? 'none' : 'block';
    }

    async function onSubmit(e) {
      e.preventDefault();
      const form = e.target;
      const name = form['contact-name'] ? form['contact-name'].value.trim() : '';
      const email = form['contact-email'] ? form['contact-email'].value.trim() : '';
      const msg = form['contact-msg'] ? form['contact-msg'].value.trim() : '';
      const status = $('form-status');

      const setStatus = (kind, text) => {
        if (!status) return;
        status.className = 'form-status ' + kind;
        status.textContent = text;
      };
      if (!name || !email || !msg) { setStatus('error', tr('contact.fill')); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setStatus('error', tr('contact.email')); return; }

      setStatus('info', tr('contact.sending'));

      // 1) قاعدة البيانات (Supabase) إن كانت مضبوطة
      try {
        if (typeof Cloud !== 'undefined' && Cloud.saveContact) {
          const res = await Cloud.saveContact(name, email, msg);
          if (res && res.tried) {
            setStatus(res.ok ? 'success' : 'error', res.ok ? tr('contact.done') : tr('contact.failed'));
            if (res.ok) form.reset();
            return;
          }
        }
      } catch (err) { /* نكمل للخطوات التالية */ }

      const cfg = window.SITE || {};
      // 2) نموذج خارجي (Formspree)
      if (cfg.formEndpoint) {
        try {
          const resp = await fetch(cfg.formEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ name, email, message: msg })
          });
          if (resp.ok) { setStatus('success', tr('contact.done')); form.reset(); }
          else setStatus('error', tr('contact.failed'));
        } catch (err) { setStatus('error', tr('contact.failed')); }
        return;
      }
      // 3) تطبيق البريد
      if (cfg.email) {
        window.location.href = 'mailto:' + cfg.email +
          '?subject=' + encodeURIComponent(name) +
          '&body=' + encodeURIComponent(msg + '\n\n— ' + name + ' (' + email + ')');
        setStatus('info', tr('contact.mailto'));
        return;
      }
      setStatus('error', tr('contact.notConfigured'));
    }

    function init() {
      const form = $('contact-form');
      if (!form) return;
      active = true;
      renderContactInfo();
      form.addEventListener('submit', onSubmit);
      document.addEventListener('hp:langchange', renderContactInfo);
    }

    function onLang() { renderContactInfo(); }
    return { init, onLang, get active() { return active; } };
  })();

  // تعريفات عامة للتوافق
  window.Calculator = Calculator;
  window.NumberTool = NumberTool;
  window.GeoTool    = GeoTool;
  window.Contact    = Contact;

  document.addEventListener('hp:langchange', () => {
    if (Calculator.active) Calculator.onLang();
    if (NumberTool.active) NumberTool.onLang();
    if (GeoTool.active)    GeoTool.onLang();
    if (Contact.active)    Contact.onLang();
  });

  function boot() {
    initNav();
    Calculator.init();
    NumberTool.init();
    GeoTool.init();
    Contact.init();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();