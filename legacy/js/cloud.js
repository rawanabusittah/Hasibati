// ============================================================
// cloud.js — طبقة قاعدة البيانات (Supabase)
// • ملفات المستخدمين (profiles) → اسم العرض في شريط التنقل
// • سجل نتائج الأدوات (tool_history) → لوحة "نتائجك المحفوظة"
// • رسائل نموذج التواصل (contact_messages)
//
// كل العمليات "صامتة وآمنة": عندما لا يكون Supabase مضبوطاً
// (أو فشل الاتصال) لا يظهر أي خطأ ولا تتوقف الأدوات عن العمل.
// ============================================================
(function () {
  const TOOL = (location.pathname.split('/').pop() || '').replace('.html', '');
  const IS_TOOL = ['calculator', 'numbers', 'geometry'].includes(TOOL);

  const db = () => (typeof Auth !== 'undefined' && Auth.db) || null;
  const user = () =>
    (typeof Auth !== 'undefined' && typeof Auth.currentUser === 'function' && Auth.currentUser()) || null;

  // ═══════ الحفظ في سجلّ الأدوات (يُستدعى من main.js) ═══════
  async function saveTool(tool, input, output) {
    const d = db(), u = user();
    const trimmed = String(input || '').trim();
    if (!d || !u || !trimmed) return;
    try {
      const { error } = await d.from('tool_history')
        .insert({
          user_id: u.id,
          tool,
          input: trimmed.slice(0, 300),
          output: String(output || '').slice(0, 300)
        });
      if (!error) SavedHistory.reload();
    } catch { /* صامت */ }
  }

  // ═══════ رسالة نموذج التواصل ═══════
  async function saveContact(name, email, message) {
    const d = db();
    if (!d) return { ok: false, tried: false };
    try {
      const { error } = await d.from('contact_messages')
        .insert({
          name: String(name).slice(0, 80),
          email: String(email).slice(0, 120),
          message: String(message).slice(0, 4000)
        });
      return { ok: !error, tried: true };
    } catch {
      return { ok: false, tried: true };
    }
  }

  // ═══════ اسم العرض من جدول profiles ═══════
  async function loadProfile() {
    const d = db(), u = user();
    if (!d || !u) return null;
    try {
      const { data, error } = await d.from('profiles')
        .select('full_name')
        .eq('id', u.id)
        .maybeSingle();
      if (error || !data) return null;
      return data.full_name || null;
    } catch { return null; }
  }

  // ═══════ لوحة "نتائجك المحفوظة" على صفحات الأدوات ═══════
  const SavedHistory = (() => {
    let panel = null, listEl = null, emptyEl = null;
    let entries = [];

    function build() {
      const anchor = document.getElementById('saved-history');
      if (!anchor) return false;

      panel = document.createElement('section');
      panel.className = 'cloud-panel';
      panel.setAttribute('aria-label', t('cloud.title'));

      const head = document.createElement('div');
      head.className = 'cloud-head';
      const title = document.createElement('h3');
      title.className = 'cloud-title';
      title.textContent = '☁️ ' + t('cloud.title');
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'cloud-clear';
      clear.textContent = t('cloud.clear');
      clear.setAttribute('aria-label', t('cloud.clear'));
      clear.addEventListener('click', clearAll);
      head.append(title, clear);

      listEl = document.createElement('ul');
      listEl.className = 'cloud-list';

      emptyEl = document.createElement('p');
      emptyEl.className = 'cloud-empty';

      panel.append(head, listEl, emptyEl);
      anchor.appendChild(panel);
      return true;
    }

    function render() {
      if (!panel) return;
      if (!entries.length) {
        listEl.textContent = '';
        listEl.style.display = 'none';
        emptyEl.style.display = 'block';
        emptyEl.textContent = t('cloud.empty');
      } else {
        emptyEl.style.display = 'none';
        listEl.style.display = 'grid';
        listEl.textContent = '';
        entries.forEach(en => {
          const li = document.createElement('li');
          li.className = 'cloud-item';

          const inEl = document.createElement('span');
          inEl.className = 'cloud-in';
          inEl.textContent = en.input;

          const arrow = document.createElement('span');
          arrow.className = 'cloud-arrow';
          arrow.setAttribute('aria-hidden', 'true');
          arrow.textContent = '→';

          const outEl = document.createElement('span');
          outEl.className = 'cloud-out';
          outEl.textContent = en.output;

          const del = document.createElement('button');
          del.type = 'button';
          del.className = 'cloud-del';
          del.textContent = '✕';
          del.setAttribute('aria-label', t('cloud.delete'));
          del.addEventListener('click', () => remove(en.id));

          li.append(inEl, arrow, outEl, del);
          listEl.appendChild(li);
        });
      }
    }

    function show() { if (panel) panel.style.display = ''; }
    function hide() { if (panel) panel.style.display = 'none'; }

    async function reload() {
      const d = db(), u = user();
      if (!d || !u || !IS_TOOL) { hide(); return; }
      if (!panel && !build()) return;
      try {
        const { data, error } = await d.from('tool_history')
          .select('id, input, output')
          .eq('user_id', u.id)
          .eq('tool', TOOL)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) { hide(); return; }
        entries = data || [];
        show();
        render();
      } catch { hide(); }
    }

    async function remove(id) {
      const d = db(), u = user();
      if (!d || !u) return;
      try {
        await d.from('tool_history').delete().eq('id', id).eq('user_id', u.id);
        entries = entries.filter(e => e.id !== id);
        render();
      } catch { /* صامت */ }
    }

    async function clearAll() {
      const d = db(), u = user();
      if (!d || !u) return;
      try {
        await d.from('tool_history').delete().eq('user_id', u.id).eq('tool', TOOL);
        entries = [];
        render();
      } catch { /* صامت */ }
    }

    function onLang() { if (panel && panel.style.display !== 'none') render(); }

    return { reload, onLang };
  })();

  // ═══════ التشغيل ═══════
  async function refreshAll() {
    // تحديث اسم العرض من جدول profiles
    if (typeof Auth !== 'undefined' && typeof Auth.setName === 'function') {
      const s = await Auth.getSession();
      if (s) {
        const name = await loadProfile();
        Auth.setName(name);
      } else {
        await Auth.setName(null);
      }
    }
    SavedHistory.reload();
  }

  document.addEventListener('DOMContentLoaded', refreshAll);
  document.addEventListener('hp:authchange', refreshAll);
  document.addEventListener('hp:langchange', () => SavedHistory.onLang());

  window.Cloud = { saveTool, saveContact, loadProfile };
})();