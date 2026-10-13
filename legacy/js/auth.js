// ============================================================
// auth.js — نظام حسابات فعلي عبر Supabase (قاعدة بيانات Postgres)
// • إنشاء حساب · تسجيل الدخول · استعادة كلمة المرور عبر بريد حقيقي
// • جلسات + حالة المستخدم في شريط التنقل (تُحدَّث من السحابة)
// • تحقق فوري من المدخلات مع رسائل ثنائية اللغة
// الإعداد في supabase-config.js — بدون مفاتيح تظهر رسالة واضحة
// ============================================================

const Auth = (() => {
  // ── عميل Supabase (يُنشأ فقط عند توفر الإعداد) ──
  const configured =
    typeof SUPABASE_URL !== 'undefined' &&
    typeof SUPABASE_ANON_KEY !== 'undefined' &&
    /^https:\/\/.+/.test(SUPABASE_URL) &&
    SUPABASE_ANON_KEY.length > 40 &&
    !SUPABASE_ANON_KEY.includes('YOUR-');

  const db = (typeof supabase !== 'undefined' && configured)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    : null;

  let _session = null;     // آخر جلسة معروفة
  let _profileName = null; // اسم العرض من جدول profiles (السحابة)

  // مسار الموقع الأساسي: نتحقق إن كنا داخل pages/ لنحسب روابط التنقل الصحيحة
  // (يعمل محلياً وعلى أي استضافة مثل GitHub Pages)
  const inPages = /\/pages\//.test(location.pathname);
  const HOME  = inPages ? '../index.html' : 'index.html';
  const LOGIN = inPages ? 'login.html'     : 'pages/login.html';

  // ── أدوات تحقق ──
  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

  function pwIssues(pw) {
    const issues = [];
    if (pw.length < 8) issues.push('auth.pwShort');
    if (!/[A-Za-z\u0621-\u064A]/.test(pw) || !/\d/.test(pw)) issues.push('auth.pwWeak');
    return issues;
  }

  // قوة كلمة المرور 0..4 (للمؤشر البصري)
  function pwStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Za-z\u0621-\u064A]/.test(pw) && /\d/.test(pw)) score++;
    if (/[^A-Za-z0-9\u0621-\u064A]/.test(pw)) score++;
    if (!pw) score = 0;
    return Math.min(score, 4);
  }

  // ── ترجمة أخطاء Supabase إلى رسائل ثنائية ──
  function mapAuthError(err) {
    if (!err) return 'auth.failed';
    const code = err.code || err.status || '';
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('failed to fetch') || msg.includes('network')) return 'auth.network';
    if (code === 'invalid_credentials' || msg.includes('invalid login')) return 'auth.wrong';
    if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'auth.notConfirmed';
    if (code === 'user_already_exists' || msg.includes('already registered')) return 'auth.exists';
    if (code === 'weak_password' || msg.includes('password should be')) return 'auth.pwWeak';
    if (code === 'over_email_send_rate_limit' || code === 'rate_limit_exceeded' ||
        msg.includes('rate limit')) return 'auth.rateLimited';
    if (code === 'same_password') return 'auth.samePw';
    if (msg.includes('user not found')) return 'auth.wrong';
    return 'auth.failed';
  }

  const noConfig = () => ({ ok: false, err: 'auth.notConfigured' });

  // ── الجلسة ──
  async function getSession() {
    if (!db) return null;
    try {
      const { data } = await db.auth.getSession();
      _session = data.session || null;
      return _session;
    } catch { return null; }
  }

  const sessionUser = s => s ? {
    id: s.user.id,
    name: _profileName || (s.user.user_metadata && (s.user.user_metadata.name || s.user.user_metadata.full_name)) || s.user.email,
    email: s.user.email
  } : null;

  // ── العمليات ──
  async function register(name, email, password) {
    if (!db) return noConfig();
    email = email.trim().toLowerCase();
    try {
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim(), full_name: name.trim() } }
      });
      if (error) return { ok: false, err: mapAuthError(error) };
      // هوية فارغة = البريد مسجّل مسبقاً (يُخفي Supabase ذلك لحماية الخصوصية)
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { ok: false, err: 'auth.exists' };
      }
      _session = data.session;
      renderNavUser();
      // لا جلسة = تأكيد البريد مفعّل، يجب تأكيد الحساب أولاً
      return { ok: true, needsConfirm: !data.session };
    } catch {
      return { ok: false, err: 'auth.network' };
    }
  }

  async function login(email, password) {
    if (!db) return noConfig();
    email = email.trim().toLowerCase();
    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, err: mapAuthError(error) };
      _session = data.session;
      renderNavUser();
      return { ok: true, user: sessionUser(data.session) };
    } catch {
      return { ok: false, err: 'auth.network' };
    }
  }

  async function logout() {
    if (!db) return;
    try { await db.auth.signOut(); } catch { /* تجاهل */ }
    _session = null;
    renderNavUser();
  }

  // ── استعادة كلمة المرور: رابط حقيقي عبر البريد الإلكتروني ──
  async function sendResetEmail(email) {
    if (!db) return noConfig();
    email = email.trim().toLowerCase();
    try {
      const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: location.href.split('#')[0] // العودة إلى forgot.html نفسها
      });
      if (error) return { ok: false, err: mapAuthError(error) };
      return { ok: true };
    } catch {
      return { ok: false, err: 'auth.network' };
    }
  }

  // تعيين كلمة مرور جديدة (بعد فتح رابط الاستعادة من البريد)
  async function updatePassword(newPassword) {
    if (!db) return noConfig();
    try {
      // انتظر جلسة الاستعادة إن كانت التبادلة لا تزال تحدث
      let s = (await db.auth.getSession()).data.session;
      if (!s) {
        await new Promise(r => setTimeout(r, 600));
        s = (await db.auth.getSession()).data.session;
      }
      if (!s) return { ok: false, err: 'auth.recoveryExpired' };
      const { error } = await db.auth.updateUser({ password: newPassword });
      if (error) return { ok: false, err: mapAuthError(error) };
      return { ok: true };
    } catch {
      return { ok: false, err: 'auth.network' };
    }
  }

  // ── حالة المستخدم في شريط التنقل (كل الصفحات) ──
  function renderNavUser() {
    const slot = document.getElementById('nav-user');
    if (!slot) return;

    const user = sessionUser(_session);
    if (user) {
      const initial = (user.name || user.email || '?').trim().charAt(0).toUpperCase();
      slot.innerHTML = `
        <span class="nav-user-chip">
          <span class="nav-user-avatar" aria-hidden="true">${escapeHTML(initial)}</span>
          <span class="nav-user-name">${escapeHTML(user.name)}</span>
        </span>
        <button type="button" class="nav-logout" data-en="Log out" title="${escapeAttr(t('auth.clickLogout'))}">${t('auth.logout')}</button>`;
      slot.querySelector('.nav-logout').addEventListener('click', async () => {
        await logout();
        // العودة للصفحة الرئيسية بعد الخروج من صفحات الحساب
        if (/login|register|forgot/.test(location.pathname)) {
          location.href = HOME;
        }
      });
    } else {
      slot.innerHTML = `<a href="${LOGIN}" class="nav-login-btn">
        <span aria-hidden="true">👤</span>
        <span data-en="Sign in">${escapeHTML(t('auth.signIn'))}</span>
      </a>`;
    }
    // ملاحظة: لا نستدعي I18N.apply() هنا — النص مولّد بـ t() باللغة الحالية،
    // واستدعاؤه كان يسبب تكراراً لا نهائياً مع حدث hp:langchange
  }

  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
  const escapeAttr = escapeHTML;

  // ── أدوات واجهة عامة ──
  function setStatus(el, key, type) {
    if (!el) return;
    el.textContent = key ? t(key) : '';
    el.dataset.msgKey  = key || '';
    el.dataset.msgType = type || '';
    el.className = 'form-status ' + (type || '');
    el.style.display = key ? 'block' : 'none';
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  }

  // إعادة عرض حالة محفوظة بعد تبديل اللغة
  function refreshStatus(el) {
    if (el && el.dataset.msgKey) setStatus(el, el.dataset.msgKey, el.dataset.msgType);
  }

  function togglePw(btn) {
    const input = document.getElementById(btn.dataset.pwToggle);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁️';
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    btn.setAttribute('aria-pressed', String(show));
  }

  // زر إظهار/إخفاء كلمة المرور — ربط عام
  function bindPwToggles() {
    document.querySelectorAll('[data-pw-toggle]').forEach(btn => {
      btn.addEventListener('click', () => togglePw(btn));
    });
  }

  // ── مؤشر قوة كلمة المرور ──
  function bindStrength(inputId, meterId, hintId) {
    const input = document.getElementById(inputId);
    const meter = document.getElementById(meterId);
    const hint  = hintId ? document.getElementById(hintId) : null;
    if (!input || !meter) return;
    input.addEventListener('input', () => {
      const score = pwStrength(input.value);
      meter.className = 'pw-strength' + (score ? ' s' + score : '');
      if (hint) {
        const issues = pwIssues(input.value);
        if (!input.value) hint.textContent = t('auth.pwHintDefault');
        else if (issues.length) hint.textContent = t(issues[0]);
        else hint.textContent = t('auth.pwOk');
      }
    });
  }

  // معطّل النموذج أثناء الإرسال لمنع التكرار
  function busy(form, on) {
    form.querySelectorAll('button[type="submit"]').forEach(b => { b.disabled = on; });
  }

  // ══════════════════════════════════════
  // صفحات الحساب: نموذج تسجيل الدخول
  // ══════════════════════════════════════
  function initLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;
    const status = document.getElementById('login-status');

    // رسالة نجاح بعد استعادة كلمة المرور (login.html?reset=1)
    if (new URLSearchParams(location.search).get('reset') === '1') {
      setStatus(status, 'auth.pwUpdated', 'success');
    }

    // المستخدم مسجّل بالفعل — رسالة ترحيب
    getSession().then(s => {
      const u = sessionUser(s);
      if (u && !status.dataset.msgKey) {
        setStatus(status, 'auth.hello', 'info');
        status.textContent = t('auth.hello', { name: u.name });
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pass  = document.getElementById('login-pass').value;

      if (!email || !pass) { setStatus(status, 'auth.required', 'error'); return; }
      if (!isEmail(email)) { setStatus(status, 'auth.emailInvalid', 'error'); return; }

      busy(form, true);
      const res = await login(email, pass);
      busy(form, false);
      if (!res.ok) { setStatus(status, res.err, 'error'); return; }

      setStatus(status, 'auth.ok', 'success');
      setTimeout(() => { location.href = HOME; }, 900);
    });
  }

  // ══════════════════════════════════════
  // صفحات الحساب: نموذج إنشاء حساب
  // ══════════════════════════════════════
  function initRegister() {
    const form = document.getElementById('register-form');
    if (!form) return;
    const status = document.getElementById('register-status');

    bindStrength('reg-pass', 'reg-strength', 'reg-hint');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name  = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const pass  = document.getElementById('reg-pass').value;
      const pass2 = document.getElementById('reg-pass2').value;

      if (!name || !email || !pass || !pass2) { setStatus(status, 'auth.required', 'error'); return; }
      if (name.length < 2)                    { setStatus(status, 'auth.nameShort', 'error'); return; }
      if (!isEmail(email))                    { setStatus(status, 'auth.emailInvalid', 'error'); return; }
      const issues = pwIssues(pass);
      if (issues.length)                      { setStatus(status, issues[0], 'error'); return; }
      if (pass !== pass2)                     { setStatus(status, 'auth.pwMismatch', 'error'); return; }

      busy(form, true);
      const res = await register(name, email, pass);
      busy(form, false);
      if (!res.ok) { setStatus(status, res.err, 'error'); return; }

      if (res.needsConfirm) {
        // تأكيد البريد مفعّل في Supabase — يجب فتح الرابط أولاً
        setStatus(status, 'auth.confirmSent', 'info');
        return;
      }
      setStatus(status, 'auth.created', 'success');
      setTimeout(() => { location.href = HOME; }, 1200);
    });
  }

  // ══════════════════════════════════════
  // صفحات الحساب: استعادة كلمة المرور
  // الخطوة 1: إرسال رابط حقيقي إلى البريد
  // الخطوة 2: تعيين كلمة مرور جديدة (عند فتح الرابط)
  // ══════════════════════════════════════
  function initForgot() {
    const step1 = document.getElementById('forgot-step1');
    const step2 = document.getElementById('forgot-step2');
    if (!step1 || !step2) return;

    const status1   = document.getElementById('forgot-status1');
    const status2   = document.getElementById('forgot-status2');
    const stepLabel = document.getElementById('reset-step-label');
    const dots      = document.querySelectorAll('#reset-steps .dot');

    bindStrength('forgot-newpass', 'forgot-strength', 'forgot-hint');

    function showStep(n) {
      step1.classList.toggle('hidden', n !== 1);
      step2.classList.toggle('hidden', n !== 2);
      dots.forEach((d, i) => d.classList.toggle('on', i < n));
      if (stepLabel) stepLabel.textContent = n === 1 ? t('auth.step1') : t('auth.step2');
      setStatus(n === 1 ? status1 : status2, '', '');
    }

    // الخطوة 1: إرسال رابط الاستعادة
    step1.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      if (!email)          { setStatus(status1, 'auth.required', 'error'); return; }
      if (!isEmail(email)) { setStatus(status1, 'auth.emailInvalid', 'error'); return; }

      busy(step1, true);
      const res = await sendResetEmail(email);
      busy(step1, false);
      if (!res.ok) { setStatus(status1, res.err, 'error'); return; }

      // Supabase لا يكشف وجود البريد — رسالة موحدة بعد الإرسال
      setStatus(status1, 'auth.resetEmailSent', 'info');
    });

    const backBtn = document.getElementById('forgot-back');
    if (backBtn) backBtn.addEventListener('click', () => showStep(1));

    // الخطوة 2: تعيين كلمة مرور جديدة (رابط الاستعادة وصل للتو)
    step2.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass  = document.getElementById('forgot-newpass').value;
      const pass2 = document.getElementById('forgot-newpass2').value;

      if (!pass || !pass2) { setStatus(status2, 'auth.required', 'error'); return; }
      const issues = pwIssues(pass);
      if (issues.length)   { setStatus(status2, issues[0], 'error'); return; }
      if (pass !== pass2)  { setStatus(status2, 'auth.pwMismatch', 'error'); return; }

      busy(step2, true);
      const res = await updatePassword(pass);
      busy(step2, false);
      if (!res.ok) { setStatus(status2, res.err, 'error'); return; }

      setStatus(status2, 'auth.resetOk', 'success');
      setTimeout(() => { location.href = LOGIN + '?reset=1'; }, 1400);
    });

    // وصول رابط الاستعادة (من البريد) → اعرض الخطوة 2 مباشرة
    const isRecovery = /access_token|type=recovery|refresh_token/.test(location.hash);
    if (isRecovery) showStep(2);
    if (db) {
      db.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') showStep(2);
      });
    }
  }

  // إعادة عرض الحالات بعد تبديل اللغة
  function refreshLang() {
    refreshStatus(document.getElementById('login-status'));
    refreshStatus(document.getElementById('register-status'));
    refreshStatus(document.getElementById('forgot-status1'));
    refreshStatus(document.getElementById('forgot-status2'));
    const stepLabel = document.getElementById('reset-step-label');
    if (stepLabel) {
      const onDots = document.querySelectorAll('#reset-steps .dot.on').length;
      stepLabel.textContent = onDots >= 2 ? t('auth.step2') : t('auth.step1');
    }
    const hint = document.getElementById('reg-hint');
    if (hint && !hint.dataset.msgKey) hint.textContent = t('auth.pwHintDefault');
    const fhint = document.getElementById('forgot-hint');
    if (fhint && !fhint.dataset.msgKey) fhint.textContent = t('auth.pwHintDefault');
    // بطاقة المستخدم في الشريط (عند تغيّر اللغة بدون إعادة تحميل)
    renderNavUser();
  }

  // تعيين اسم العرض من جدول profiles (يُدعا من cloud.js بعد تحميله)
  function setName(name) {
    _profileName = (name && String(name).trim()) || null;
    renderNavUser();
  }

  return {
    register, login, logout, sendResetEmail, updatePassword,
    getSession, renderNavUser, setStatus, pwStrength, pwIssues,
    isEmail, bindPwToggles, escapeHTML,
    initLogin, initRegister, initForgot, refreshLang,
    get db() { return db; },
    currentUser: () => sessionUser(_session),
    get session() { return _session; },
    setName
  };
})();

// ── تشغيل عام عند جاهزية DOM ──
document.addEventListener('DOMContentLoaded', () => {
  Auth.renderNavUser();
  Auth.bindPwToggles();
  Auth.initLogin();
  Auth.initRegister();
  Auth.initForgot();
});

// تحديث فوري لحالة المستخدم عند تغيّر الجلسة من Supabase
if (Auth.db) {
  Auth.db.auth.onAuthStateChange((event, session) => {
    _session = session;
    Auth.renderNavUser();
    // إخبار الوحدات الأخرى (سجلّ النتائج، الملف الشخصي…) بتغيّر الحساب
    document.dispatchEvent(new CustomEvent('hp:authchange', { detail: { event } }));
  });
}

// إعادة العرض بعد تبديل اللغة
document.addEventListener('hp:langchange', () => {
  if (typeof Auth !== 'undefined' && Auth.refreshLang) Auth.refreshLang();
});
