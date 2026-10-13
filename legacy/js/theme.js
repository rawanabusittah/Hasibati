// ============================================================
// theme.js — الوضع الليلي / النهاري + شريط تقدّم التمرير
// يُحمَّل في <head> ليُطبَّق الوضع قبل الرسم (بدون وميض).
// الأولوية: اختيار المستخدم المحفوظ ← تفضيل النظام.
// ============================================================
(function () {
  var K = 'hp_theme', root = document.documentElement;

  function stored() {
    try { var s = localStorage.getItem(K); return s === 'light' || s === 'dark' ? s : null; }
    catch (e) { return null; }
  }
  function sys() {
    return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function label(th) {
    var en = root.lang === 'en';
    return th === 'light'
      ? (en ? 'Switch to night mode' : 'التبديل إلى الوضع الليلي')
      : (en ? 'Switch to day mode' : 'التبديل إلى الوضع النهاري');
  }
  function paint() {
    var th = root.dataset.theme;
    document.querySelectorAll('.theme-toggle').forEach(function (b) {
      b.textContent = th === 'light' ? '🌙' : '☀️';
      b.setAttribute('aria-label', label(th));
      b.title = label(th);
      b.setAttribute('aria-pressed', String(th === 'light'));
    });
  }
  function set(th, save) {
    root.dataset.theme = th;
    root.style.colorScheme = th;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = th === 'light' ? '#f5f7fd' : '#070a12';
    if (save) {
      try { localStorage.setItem(K, th); } catch (e) { /* تجاهل */ }
      root.classList.add('theme-anim');
      setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
    }
    paint();
    document.dispatchEvent(new CustomEvent('hp:themechange', { detail: { theme: th } }));
  }

  set(stored() || sys(), false);

  document.addEventListener('DOMContentLoaded', function () {
    var actions = document.querySelector('.nav-actions');
    if (actions && !actions.querySelector('.theme-toggle')) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'theme-toggle';
      b.addEventListener('click', function () {
        set(root.dataset.theme === 'light' ? 'dark' : 'light', true);
      });
      actions.insertBefore(b, actions.querySelector('.lang-toggle') || actions.firstChild);
    }
    paint();

    // شريط التقدّم
    var pb = document.createElement('div');
    pb.id = 'scroll-progress';
    pb.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pb);
    var upd = function () {
      var m = document.documentElement.scrollHeight - innerHeight;
      pb.style.width = (m > 0 ? Math.min(100, scrollY / m * 100) : 0) + '%';
    };
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();
  });

  document.addEventListener('hp:langchange', paint);

  // تتبّع تغيّر تفضيل النظام ما لم يختر المستخدم يدوياً
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: light)');
    var onSys = function () { if (!stored()) set(sys(), false); };
    if (mq.addEventListener) mq.addEventListener('change', onSys);
  }
})();
