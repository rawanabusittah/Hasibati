// ============================================================
// core.js — منطق رياضي نقي (بدون DOM) قابل للاختبار
//  • MathEngine : محلل تعبيرات آمن (بدون eval) — Recursive Descent
//  • BaseConv   : تحويل الأنظمة الرقمية بدقة كاملة عبر BigInt (أعداد كبيرة + كسور + سالب)
// ============================================================

const MathEngine = (() => {
  class CalcError extends Error {
    constructor(code) { super(code); this.code = code; } // syntax | div0 | domain
  }

  // أسماء الدوال المعروفة (الأطول أولاً) — يستخدمها المحلّل وزر الحذف ⌫
  const NAMES = ['diff2', 'prod', 'diff', 'asin', 'acos', 'atan', 'cbrt', 'floor', 'round', 'ceil',
                 'log2', 'logb', 'root', 'sin', 'cos', 'tan', 'exp', 'abs', 'mod', 'gcd', 'lcm',
                 'nCr', 'nPr', 'avg', 'max', 'min', 'sum', 'int', 'log', 'ln'];
  const UNARY = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'log2', 'exp',
                         'abs', 'cbrt', 'floor', 'ceil', 'round']);
  // دوال تأخذ تعبيراً بالمتغير x كوسيط أول: diff(f, x0) · int(f, a, b) · sum(f, a, b) ...
  const LAMBDA = new Set(['diff', 'diff2', 'int', 'sum', 'prod']);

  // هل الحرف يبدأ عاملاً جديداً؟ (للضرب الضمني: 2π ، 3(4+1) ، 2sin(30) ، 3x)
  const startsPrimary = c => /[0-9.(π√A-Za-z]/.test(c);

  function clean(v) {
    if (Object.is(v, -0)) return 0;
    return Number(v.toPrecision(12)); // 0.1+0.2 → 0.3
  }

  // تقريب إلى n خانة معنوية مع تصفير القيم الضئيلة (ضجيج الحساب العددي)
  const sig = (v, n, eps) => (Math.abs(v) < eps ? 0 : Number(v.toPrecision(n)));
  const gcd2 = (p, q) => { p = Math.abs(p); q = Math.abs(q); while (q) { [p, q] = [q, p % q]; } return p; };

  // ── التفاضل والتكامل العددي ──
  // المشتقة الأولى: فروق مركزية مع استقراء ريتشاردسون (خطأ ~h⁴)
  function derivative(f, x0) {
    const h = 1e-3 * Math.max(1, Math.abs(x0));
    const D = s => (f(x0 + s) - f(x0 - s)) / (2 * s);
    return sig((4 * D(h / 2) - D(h)) / 3, 9, 1e-9);
  }
  // المشتقة الثانية: صيغة من خمس نقاط
  function derivative2(f, x0) {
    const h = 1e-2 * Math.max(1, Math.abs(x0));
    const v = (-f(x0 + 2 * h) + 16 * f(x0 + h) - 30 * f(x0) + 16 * f(x0 - h) - f(x0 - 2 * h)) / (12 * h * h);
    return sig(v, 7, 1e-6);
  }
  // التكامل المحدود: قاعدة سيمبسون بألفي مجال
  function integral(f, a, b) {
    if (a === b) return 0;
    let sign = 1;
    if (a > b) { const t = a; a = b; b = t; sign = -1; }
    const n = 2000, h = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return sign * sig(s * h / 3, 10, 1e-10);
  }
  // المجموع Σ والجداء Π على أعداد صحيحة
  function series(f, a, b, product) {
    a = Math.round(a); b = Math.round(b);
    if (b < a) return product ? 1 : 0;
    if (b - a > 10000) throw new CalcError('domain');
    let s = product ? 1 : 0;
    for (let i = a; i <= b; i++) s = product ? s * f(i) : s + f(i);
    if (!Number.isFinite(s)) throw new CalcError('domain');
    return s;
  }

  // يعيد القيمة الخام (بدون تقريب) ليُستخدم داخلياً في الدوال التي تأخذ تعبيراً
  function run(raw, opts) {
    const deg = !opts || opts.angle !== 'rad';
    const vars = (opts && opts.vars) || {};
    let src = String(raw)
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
      .replace(/\s+/g, '');
    if (!src) throw new CalcError('syntax');

    // إغلاق الأقواس الناقصة تلقائياً (للمعاينة الحية)
    let open = 0;
    for (const c of src) {
      if (c === '(') open++;
      else if (c === ')' && --open < 0) throw new CalcError('syntax');
    }
    src += ')'.repeat(open);

    let pos = 0;
    let lastPct = false;  // آخر عملية لاحقة كانت %
    let pctTerm = false;  // الحد الأخير هو نسبة مفردة (للصيغة 200+10%)
    const peek = () => src[pos];
    const bad = code => new CalcError(code);
    const snap = v => (Math.abs(v) < 1e-12 ? 0 : v);
    const back = v => snap(deg ? v * 180 / Math.PI : v);
    const isInt = Number.isInteger;

    function unary(name, x) {
      const rad = deg ? x * Math.PI / 180 : x;
      switch (name) {
        case 'sin':   return snap(Math.sin(rad));
        case 'cos':   return snap(Math.cos(rad));
        case 'tan':   if (Math.abs(Math.cos(rad)) < 1e-12) throw bad('domain'); return snap(Math.tan(rad));
        case 'asin':  if (x < -1 || x > 1) throw bad('domain'); return back(Math.asin(x));
        case 'acos':  if (x < -1 || x > 1) throw bad('domain'); return back(Math.acos(x));
        case 'atan':  return back(Math.atan(x));
        case 'ln':    if (x <= 0) throw bad('domain'); return Math.log(x);
        case 'log':   if (x <= 0) throw bad('domain'); return Math.log10(x);
        case 'log2':  if (x <= 0) throw bad('domain'); return Math.log2(x);
        case 'exp':   return Math.exp(x);
        case 'abs':   return Math.abs(x);
        case 'cbrt':  return Math.cbrt(x);
        case 'floor': return Math.floor(x);
        case 'ceil':  return Math.ceil(x);
        case 'round': return Math.round(x);
      }
      throw bad('syntax');
    }

    function multi(name, a) {
      const two = () => { if (a.length !== 2) throw bad('syntax'); return a; };
      switch (name) {
        case 'logb': {
          const [x, b] = two();
          if (x <= 0 || b <= 0 || b === 1) throw bad('domain');
          return Math.log(x) / Math.log(b);
        }
        case 'root': {
          const [x, n] = two();
          if (n === 0) throw bad('domain');
          if (x < 0) {
            if (isInt(n) && Math.abs(n) % 2 === 1) return -Math.pow(-x, 1 / n);
            throw bad('domain');
          }
          return Math.pow(x, 1 / n);
        }
        case 'mod': {
          const [x, m] = two();
          if (m === 0) throw bad('div0');
          return x - m * Math.floor(x / m);
        }
        case 'gcd': {
          const [x, y] = two();
          if (!isInt(x) || !isInt(y)) throw bad('domain');
          return gcd2(x, y);
        }
        case 'lcm': {
          const [x, y] = two();
          if (!isInt(x) || !isInt(y)) throw bad('domain');
          const g = gcd2(x, y);
          return g === 0 ? 0 : Math.abs(x / g * y);
        }
        case 'nCr': {
          const [n, r] = two();
          if (!isInt(n) || !isInt(r) || r < 0 || r > n || n > 1000) throw bad('domain');
          const k = Math.min(r, n - r);
          let v = 1;
          for (let i = 1; i <= k; i++) v = v * (n - k + i) / i;
          return Math.round(v);
        }
        case 'nPr': {
          const [n, r] = two();
          if (!isInt(n) || !isInt(r) || r < 0 || r > n || n > 1000) throw bad('domain');
          let v = 1;
          for (let i = 0; i < r; i++) v *= (n - i);
          return v;
        }
        case 'avg': return a.reduce((s, v) => s + v, 0) / a.length;
        case 'max': return Math.max(...a);
        case 'min': return Math.min(...a);
      }
      throw bad('syntax');
    }

    function lambda(name, body, rest) {
      const f = x => run(body, { angle: deg ? 'deg' : 'rad', vars: Object.assign({}, vars, { x }) });
      const need = n => { if (rest.length !== n) throw bad('syntax'); };
      switch (name) {
        case 'diff':  need(1); return derivative(f, rest[0]);
        case 'diff2': need(1); return derivative2(f, rest[0]);
        case 'int':   need(2); return integral(f, rest[0], rest[1]);
        case 'sum':   need(2); return series(f, rest[0], rest[1], false);
        case 'prod':  need(2); return series(f, rest[0], rest[1], true);
      }
      throw bad('syntax');
    }

    function fact(n) {
      if (!Number.isInteger(n) || n < 0 || n > 170) throw new CalcError('domain');
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    }

    // وسائط مفصولة بفواصل حتى القوس المغلق
    function parseArgs() {
      const a = [parseExpr()];
      while (peek() === ',') { pos++; a.push(parseExpr()); }
      if (peek() !== ')') throw bad('syntax');
      pos++;
      return a;
    }

    function call(name) {
      if (LAMBDA.has(name)) {
        let depth = 0, comma = -1;
        for (let i = pos; i < src.length; i++) {
          const ch = src[i];
          if (ch === '(') depth++;
          else if (ch === ')') { if (depth === 0) break; depth--; }
          else if (ch === ',' && depth === 0) { comma = i; break; }
        }
        if (comma < 0) throw bad('syntax');
        const body = src.slice(pos, comma);
        pos = comma + 1;
        return lambda(name, body, parseArgs());
      }
      const a = parseArgs();
      if (UNARY.has(name)) {
        if (a.length !== 1) throw bad('syntax');
        return unary(name, a[0]);
      }
      return multi(name, a);
    }

    // expr := term (('+'|'-') term)*
    function parseExpr() {
      let v = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = src[pos++];
        let r = parseTerm();
        if (pctTerm) r = v * r;         // 200 + 10%  →  200 + 20
        v = op === '+' ? v + r : v - r;
      }
      return v;
    }

    // term := unary (('*'|'/'|implicit) unary)*
    function parseTerm() {
      let v = parseUnary();
      let single = lastPct;
      for (;;) {
        const c = peek();
        if (c === '*') { pos++; v *= parseUnary(); single = false; }
        else if (c === '/') {
          pos++;
          const r = parseUnary();
          if (r === 0) throw new CalcError('div0');
          v /= r; single = false;
        }
        else if (c !== undefined && startsPrimary(c)) { v *= parseUnary(); single = false; }
        else break;
      }
      pctTerm = single;
      return v;
    }

    // unary := ('-'|'+') unary | power      (-2^2 = -4)
    function parseUnary() {
      const c = peek();
      if (c === '-') { pos++; return -parseUnary(); }
      if (c === '+') { pos++; return parseUnary(); }
      return parsePower();
    }

    // power := postfix ('^' unary)?        (يمين-الارتباط: 2^3^2 = 512)
    function parsePower() {
      const b = parsePostfix();
      if (peek() === '^') {
        pos++;
        const e = parseUnary();
        const r = Math.pow(b, e);
        if (!Number.isFinite(r)) throw new CalcError('domain');
        return r;
      }
      return b;
    }

    // postfix := primary ('!' | '%')*
    function parsePostfix() {
      let v = parsePrimary();
      lastPct = false;
      while (peek() === '!' || peek() === '%') {
        if (src[pos++] === '!') { v = fact(v); lastPct = false; }
        else { v = v / 100; lastPct = true; }
      }
      return v;
    }

    function parsePrimary() {
      const rest = src.slice(pos);
      let m;
      if (rest[0] === '(') {
        pos++;
        const v = parseExpr();
        if (peek() !== ')') throw new CalcError('syntax');
        pos++;
        return v;
      }
      if (rest[0] === '√') {
        pos++;
        const v = parsePostfix();
        if (v < 0) throw new CalcError('domain');
        return Math.sqrt(v);
      }
      if ((m = rest.match(/^(\d+\.?\d*|\.\d+)/))) { pos += m[0].length; return parseFloat(m[0]); }
      if (rest[0] === 'π') { pos++; return Math.PI; }
      if ((m = rest.match(/^([A-Za-z][A-Za-z0-9]*)\(/)) && NAMES.includes(m[1])) {
        pos += m[0].length;
        return call(m[1]);
      }
      if (rest[0] === 'e') { pos++; return Math.E; }
      if (rest[0] === 'x' && Object.prototype.hasOwnProperty.call(vars, 'x')) { pos++; return vars.x; }
      throw new CalcError('syntax');
    }

    const value = parseExpr();
    if (pos !== src.length) throw new CalcError('syntax');
    if (!Number.isFinite(value)) throw new CalcError('domain');
    return value;
  }

  function evaluate(raw, opts) { return clean(run(raw, opts)); }

  // عرض الرقم: 12 خانة معنوية، وصيغة علمية للقيم الكبيرة/الصغيرة جداً
  function format(n) {
    if (!Number.isFinite(n)) return String(n);
    if (n === 0) return '0';
    const a = Math.abs(n);
    if (a >= 1e15 || a < 1e-9) {
      return n.toExponential(8).replace(/\.?0+e/, 'e').replace('e+', 'e');
    }
    return String(Number(n.toPrecision(12)));
  }

  // صيغة قابلة لإعادة التحليل داخل التعبير (بدون حرف e العلمي الذي يلتبس مع الثابت e)
  function formatForExpr(n) {
    if (!Number.isFinite(n)) return String(n);
    const a = Math.abs(n);
    if (n !== 0 && (a >= 1e15 || a < 1e-9)) {
      const [mant, exp] = n.toExponential(9).split('e');
      const mm = mant.replace(/\.?0+$/, '');
      return '(' + mm + '×10^' + parseInt(exp, 10) + ')';
    }
    return format(n);
  }

  return { evaluate, format, formatForExpr, CalcError, names: NAMES };
})();

// ============================================================
const BaseConv = (() => {
  const DIGITS = '0123456789ABCDEF';
  const MAX_LEN = 200;

  const digitClass = {
    2: '[01]', 8: '[0-7]', 10: '[0-9]', 16: '[0-9A-F]'
  };
  const prefixOf = { 2: '0B', 8: '0O', 10: '', 16: '0X' };

  // يعيد { neg, int:BigInt, num:BigInt, den:BigInt } أو { error }
  function parse(input, base) {
    let s = String(input).trim().toUpperCase().replace(/[\s_]/g, '');
    if (!s) return { error: 'required' };
    if (s.length > MAX_LEN) return { error: 'tooLong' };
    let neg = false;
    if (s[0] === '-') { neg = true; s = s.slice(1); }
    else if (s[0] === '+') s = s.slice(1);
    if (prefixOf[base] && s.startsWith(prefixOf[base])) s = s.slice(2);

    const d = digitClass[base];
    if (!new RegExp('^(?:' + d + '+(?:\\.' + d + '+)?|\\.' + d + '+)$').test(s)) {
      return { error: 'invalid' };
    }
    const [ip, fp = ''] = s.split('.');
    const B = BigInt(base);
    let int = 0n;
    for (const ch of ip) int = int * B + BigInt(DIGITS.indexOf(ch));
    let num = 0n, den = 1n;
    for (const ch of fp) { num = num * B + BigInt(DIGITS.indexOf(ch)); den *= B; }
    return { neg, int, num, den };
  }

  // تحويل دقيق إلى أي نظام (الكسور تُقتطع إلى maxFrac خانة)
  function toBase(p, base, maxFrac = 20) {
    const B = BigInt(base);
    const intText = p.int.toString(base).toUpperCase();
    let frac = '';
    let truncated = false;
    if (p.num > 0n) {
      let n = p.num;
      for (let i = 0; i < maxFrac && n > 0n; i++) {
        n *= B;
        frac += DIGITS[Number(n / p.den)];
        n %= p.den;
      }
      truncated = n > 0n;
    }
    return { text: intText + (frac ? '.' + frac : ''), intText, frac, truncated };
  }

  function bitInfo(p) {
    if (p.int === 0n) return { bits: 1, bytes: 1 };
    const bits = p.int.toString(2).length;
    return { bits, bytes: Math.ceil(bits / 8) };
  }

  return { parse, toBase, bitInfo, MAX_LEN };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MathEngine, BaseConv };
}
