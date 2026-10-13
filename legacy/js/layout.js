// ============================================================
// layout.js — الشريط العلوي والفوتر المشتركان (مصدر واحد لكل الصفحات)
// يُحمَّل قبل i18n.js حتى تُترجم عناصره مع بقية الصفحة.
// ============================================================
(function () {
  const cfg = window.SITE || {};
  const inPages = /\/pages\//.test(location.pathname);
  const ROOT = inPages ? '../' : '';
  const P = inPages ? '' : 'pages/';

  // ربط ملفات التنسيق الإضافية تلقائياً — design.css آخراً ليكون له الأولوية
  ['components.css', 'design.css'].forEach(f => {
    if (document.querySelector('link[href$="' + f + '"]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = ROOT + 'css/' + f;
    document.head.appendChild(l);
  });

  const NAV = [
    ['calculator.html', 'الآلة الحاسبة', 'Calculator'],
    ['numbers.html',    'الأنظمة الرقمية', 'Number Systems'],
    ['geometry.html',   'الهندسة', 'Geometry'],
    ['about',           'من نحن', 'About us'],
    ['contact.html',    'تواصل', 'Contact']
  ];

  // "من نحن" أصبحت فقرة في الواجهة الرئيسية، لذا يشير الرابط إلى قسمها
  const navLink = href => (href === 'about' ? `${ROOT}index.html#about` : `${P}${href}`);

  const navHTML = `
  <nav class="navbar" aria-label="التنقل الرئيسي" data-en-aria="Main navigation">
    <a href="${ROOT}index.html" class="navbar-brand">
      <div class="brand-icon" aria-hidden="true">∑</div>
      <span data-en="Hasibati">حاسباتي</span>
    </a>
    <ul class="navbar-links" id="navbar-menu">
      ${NAV.map(([href, ar, en]) =>
        `<li><a href="${navLink(href)}" data-en="${en}">${ar}</a></li>`).join('')}
    </ul>
    <div class="nav-actions">
      <div class="nav-user" id="nav-user"></div>
      <button class="lang-toggle" type="button">EN</button>
      <button class="menu-toggle" aria-label="فتح القائمة" data-en-aria="Open menu"
              aria-expanded="false" aria-controls="navbar-menu">☰</button>
    </div>
  </nav>`;

  // روابط خارجية: تظهر فقط إن كانت معرّفة في site-config.js
  const ext = [
    [cfg.github,   'GitHub',   'GitHub'],
    [cfg.linkedin, 'LinkedIn', 'LinkedIn'],
    [cfg.twitter,  'X',        'X'],
    [cfg.repo,     'كود المشروع', 'Source code']
  ].filter(x => x[0]);

  const extHTML = ext.length ? `<div class="ft-ext">${ext.map(([u, ar, en]) =>
    `<a href="${u}" target="_blank" rel="noopener noreferrer" aria-label="${en}" title="${en}">${({GitHub:'GH',LinkedIn:'in',X:'𝕏','Source code':'</>'})[en] || en}</a>`).join('')}</div>` : '';

  const year = new Date().getFullYear();
  const authorAr = cfg.author && cfg.author.nameAr;
  const authorEn = (cfg.author && cfg.author.nameEn) || authorAr;
  const creditAr = authorAr ? `تصميم وتطوير ${authorAr}` : 'مشروع شخصي مفتوح';
  const creditEn = authorEn ? `Designed & built by ${authorEn}` : 'An open personal project';

  const footHTML = `
  <footer class="site-footer">
    <div class="ft-row">
      <a href="${ROOT}index.html" class="ft-brand"><span class="ic" aria-hidden="true">∑</span><span data-en="Hasibati">حاسباتي</span></a>
      <nav class="ft-links" aria-label="روابط التذييل" data-en-aria="Footer links">
        <a href="${P}calculator.html" data-en="Calculator">الآلة الحاسبة</a>
        <a href="${P}numbers.html" data-en="Number Systems">الأنظمة الرقمية</a>
        <a href="${P}geometry.html" data-en="Geometry">الهندسة</a>
        <a href="${ROOT}index.html#about" data-en="About us">من نحن</a>
        <a href="${P}contact.html" data-en="Contact">تواصل</a>
        <a href="${P}menu.html" data-en="Site map">خريطة الموقع</a>
        <a href="${P}login.html" data-account-link data-en="Account">الحساب</a>
      </nav>
      ${extHTML}
    </div>
    <div class="ft-bottom">
      <span data-en="© ${year} Hasibati — ${creditEn}">© ${year} حاسباتي — ${creditAr}</span>
      <span class="ft-note" data-en="Runs entirely in your browser">تعمل بالكامل داخل متصفحك</span>
      <a href="#main" class="ft-top" aria-label="العودة للأعلى" data-en-aria="Back to top">↑</a>
    </div>
  </footer>`;

  function mount(id, html) {
    const ph = document.getElementById(id);
    if (!ph) return;
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    ph.replaceWith(tpl.content);
  }

  mount('site-nav', navHTML);
  mount('site-footer', footHTML);

  // بطاقة المؤلف في صفحة "عن المشروع" — تظهر فقط إذا عُبّئ الاسم في site-config.js
  function renderAuthor() {
    const card = document.getElementById('author-card');
    if (!card) return;
    const a = cfg.author || {};
    const en = document.documentElement.lang === 'en';
    const name = (en ? (a.nameEn || a.nameAr) : (a.nameAr || a.nameEn)) || '';
    if (!name) { card.classList.remove('show'); return; }
    document.getElementById('author-name').textContent = name;
    document.getElementById('author-role').textContent = (en ? a.roleEn : a.roleAr) || '';
    document.getElementById('author-avatar').textContent = name.trim().charAt(0).toUpperCase();
    card.classList.add('show');
  }
  renderAuthor();
  document.addEventListener('hp:langchange', renderAuthor);
})();
