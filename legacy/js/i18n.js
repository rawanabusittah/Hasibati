// ============================================================
// i18n.js — نظام اللغة ثنائية (عربي / إنجليزي)
// • الترجمة الثابتة عبر data-en على العناصر (النص العربي هو الأصل)
// • الرسائل الديناميكية عبر t('key') من قاموس MSG
// • تبديل dir/lang على <html> + حفظ الاختيار في localStorage
// ============================================================

const I18N = (() => {
  const LS_KEY = 'hp_lang';
  let lang = null;
  try { lang = localStorage.getItem(LS_KEY) === 'en' ? 'en' : 'ar'; }
  catch { lang = 'ar'; }

  // ── رسائل ديناميكية (تُستخدم من main.js و auth.js) ──
  const MSG = {
    ar: {
      'calc.copy':'نسخ','calc.copied':'تم النسخ ✓','calc.err.syntax':'تعبير غير صالح','calc.err.div0':'لا يمكن القسمة على صفر','calc.err.domain':'خارج نطاق التعريف',
      'calc.history.empty':'لا توجد عمليات بعد','calc.demo.empty':'اكتب عملية لترى النتيجة',
      'num.tooLong':'القيمة طويلة جداً (200 خانة كحد أقصى)','num.bits':'{bits} بت · {bytes} بايت','num.truncated':'⚠️ الكسر دوري — اقتُطع عند {n} خانة',
      'geo.unit3':'وحدة³','geo.err.tri':'هذه الأضلاع لا تكوّن مثلثاً (مجموع أي ضلعين يجب أن يزيد عن الثالث)','geo.type':'نوع المثلث',
      'geo.type.equi':'متساوي الأضلاع','geo.type.iso':'متساوي الساقين','geo.type.scal':'مختلف الأضلاع','geo.type.right':'قائم الزاوية',
      'geo.inradius':'نصف قطر الدائرة الداخلية','geo.circumradius':'نصف قطر الدائرة الخارجية','geo.volume':'الحجم','geo.surface':'المساحة السطحية','geo.semiperim':'نصف المحيط',
      'contact.notConfigured':'الإرسال غير مضبوط بعد — أضف مفاتيح Supabase في supabase-config.js أو بريدك في site-config.js','contact.sent':'✅ تم الإرسال بنجاح','contact.failed':'تعذّر الإرسال — حاول لاحقاً','contact.mailto':'جارٍ فتح تطبيق البريد…',
      // عام / شريط التنقل
      'nav.open':   'فتح القائمة',
      'nav.close':  'إغلاق القائمة',
      // الآلة الحاسبة
      'calc.error': 'خطأ',
      'calc.insert': 'إدخال',
      'calc.tryEx': 'جرّب المثال',
      // الأنظمة الرقمية
      'num.required': 'الرجاء إدخال قيمة',
      'num.invalid':  'القيمة المدخلة غير صالحة للنظام {base}',
      'num.failed':   'حدث خطأ في التحويل',
      'base.2':  'الثنائي',
      'base.8':  'الثماني',
      'base.10': 'العشري',
      'base.16': 'السداسي عشر',
      'sys.2':  'ثنائي (Binary)',
      'sys.8':  'ثماني (Octal)',
      'sys.10': 'عشري (Decimal)',
      'sys.16': 'سداسي عشر (Hexadecimal)',
      // الهندسة
      'geo.err.r':    'الرجاء إدخال نصف قطر صحيح أكبر من صفر',
      'geo.err.side': 'الرجاء إدخال طول ضلع صحيح أكبر من صفر',
      'geo.err.rect': 'الرجاء إدخال قيم صحيحة أكبر من صفر',
      'geo.area':     'المساحة',
      'geo.perimeter':'المحيط',
      'geo.diag':     'القطر (وتر)',
      'geo.diag2':    'القطر',
      'geo.radius':   'نصف القطر',
      'geo.unit':     'وحدة',
      'geo.unit2':    'وحدة²',
      // التواصل
      'contact.fill':     'الرجاء ملء جميع الحقول',
      'contact.email':    'الرجاء إدخال بريد إلكتروني صحيح',
      'contact.sending':  '⏳ جاري الإرسال...',
      'contact.done':     '✅ تم الإرسال بنجاح!',
      'contact.received': 'تم استلام رسالتك، سنرد عليك قريباً.',
      // قاعدة البيانات (Supabase)
      'cloud.title':'نتائجك المحفوظة',
      'cloud.empty':'لا نتائج محفوظة بعد — أي عملية حسابية ستظهر هنا تلقائياً',
      'cloud.delete':'حذف هذا السجل',
      'cloud.clear':'مسح الكل',
      'contact.send':     'إرسال الرسالة',
      // الحسابات
      'auth.demoNote':   'الحسابات محفوظة في قاعدة بيانات Supabase المشفرة — تعمل على جميع أجهزتك.',
      'auth.required':   'جميع الحقول مطلوبة',
      'auth.nameShort':  'الاسم قصير جداً (حرفان على الأقل)',
      'auth.emailInvalid': 'بريد إلكتروني غير صالح',
      'auth.pwShort':    'كلمة المرور 8 أحرف على الأقل',
      'auth.pwWeak':     'كلمة المرور يجب أن تحتوي على حرف ورقم معاً',
      'auth.pwMismatch': 'كلمتا المرور غير متطابقتين',
      'auth.terms':      'يجب الموافقة على الشروط والأحكام',
      'auth.exists':     'هذا البريد مسجّل مسبقاً، سجّل الدخول بدلاً من ذلك',
      'auth.notFound':   'لا يوجد حساب بهذا البريد الإلكتروني',
      'auth.wrong':      'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'auth.ok':         'تم تسجيل الدخول بنجاح ✓',
      'auth.created':    'تم إنشاء حسابك بنجاح ✓ جارٍ تحويلك...',
      'auth.hello':      'مرحباً، {name}',
      'auth.logout':     'تسجيل الخروج',
      'auth.signIn':     'تسجيل الدخول',
      'auth.clickLogout':'اضغط للخروج من حسابك',
      'auth.codeSent':   'تم إنشاء رمز التحقق — أدخله في الخطوة التالية',
      'auth.codeWrong':  'رمز التحقق غير صحيح',
      'auth.codeExpired':'انتهت صلاحية الرمز (10 دقائق) — اطلب رمزاً جديداً',
      'auth.resetOk':    'تم تحديث كلمة المرور بنجاح ✓ جارٍ تحويلك لصفحة الدخول...',
      'auth.pwUpdated':  'كلمة المرور الجديدة محفوظة',
      'auth.pwHintDefault': '8 أحرف على الأقل مع أرقام وحروف.',
      'auth.pwOk':       'كلمة المرور قوية ✓',
      'auth.step1':      'الخطوة 1 من 2 — أدخل بريدك',
      'auth.step2':      'الخطوة 2 من 2 — كلمة المرور الجديدة',
      // Supabase
      'auth.notConfigured': 'إعداد Supabase غير مكتمل — ضع مفاتيحك في supabase-config.js',
      'auth.network':    'تعذّر الاتصال بقاعدة البيانات — تحقق من اتصال الإنترنت',
      'auth.notConfirmed': 'يجب تأكيد بريدك الإلكتروني أولاً — تحقق من صندوق الوارد',
      'auth.confirmSent': 'تم إنشاء الحساب ✓ تحقق من بريدك واضغط رابط التأكيد ثم سجّل الدخول',
      'auth.resetEmailSent': 'تم إرسال رابط الاستعادة إلى بريدك ✓ تحقق من صندوق الوارد (ورسائل غير المرغوب فيها)',
      'auth.rateLimited': 'طلبات كثيرة جداً — حاول مجدداً بعد قليل',
      'auth.samePw':      'كلمة المرور الجديدة يجب أن تختلف عن السابقة',
      'auth.failed':      'تعذّر إتمام العملية — حاول مرة أخرى',
      'auth.recoveryExpired': 'انتهت صلاحية رابط الاستعادة — اطلب رابطاً جديداً'
    },
    en: {
      'calc.copy':'Copy','calc.copied':'Copied ✓','calc.err.syntax':'Invalid expression','calc.err.div0':'Cannot divide by zero','calc.err.domain':'Out of domain',
      'calc.history.empty':'No calculations yet','calc.demo.empty':'Type an expression to see the result',
      'num.tooLong':'Value is too long (200 digits max)','num.bits':'{bits} bits · {bytes} bytes','num.truncated':'⚠️ Repeating fraction — truncated at {n} digits',
      'geo.unit3':'unit³','geo.err.tri':'These sides cannot form a triangle (any two sides must sum to more than the third)','geo.type':'Triangle type',
      'geo.type.equi':'Equilateral','geo.type.iso':'Isosceles','geo.type.scal':'Scalene','geo.type.right':'Right-angled',
      'geo.inradius':'Inradius','geo.circumradius':'Circumradius','geo.volume':'Volume','geo.surface':'Surface area','geo.semiperim':'Semi-perimeter',
      'contact.notConfigured':'Sending is not set up yet — add your Supabase keys in supabase-config.js or your email in site-config.js','contact.sent':'✅ Sent successfully','contact.failed':'Could not send — try again later','contact.mailto':'Opening your mail app…',
      // Common / navbar
      'nav.open':   'Open menu',
      'nav.close':  'Close menu',
      // Calculator
      'calc.error': 'Error',
      'calc.insert': 'Insert',
      'calc.tryEx': 'Try example',
      // Number systems
      'num.required': 'Please enter a value',
      'num.invalid':  'The entered value is not valid for the {base} system',
      'num.failed':   'Conversion failed',
      'base.2':  'Binary',
      'base.8':  'Octal',
      'base.10': 'Decimal',
      'base.16': 'Hexadecimal',
      'sys.2':  'Binary',
      'sys.8':  'Octal',
      'sys.10': 'Decimal',
      'sys.16': 'Hexadecimal',
      // Geometry
      'geo.err.r':    'Please enter a valid radius greater than zero',
      'geo.err.side': 'Please enter a valid side length greater than zero',
      'geo.err.rect': 'Please enter valid values greater than zero',
      'geo.area':     'Area',
      'geo.perimeter':'Perimeter',
      'geo.diag':     'Diagonal',
      'geo.diag2':    'Diagonal',
      'geo.radius':   'Radius',
      'geo.unit':     'unit',
      'geo.unit2':    'unit²',
      // Contact
      'contact.fill':     'Please fill in all fields',
      'contact.email':    'Please enter a valid email address',
      'contact.sending':  '⏳ Sending...',
      'contact.done':     '✅ Sent successfully!',
      'contact.received': 'Your message has been received. We will reply soon.',
      // Database (Supabase)
      'cloud.title':'Your saved results',
      'cloud.empty':'No saved results yet — your calculations will appear here automatically',
      'cloud.delete':'Delete this entry',
      'cloud.clear':'Clear all',
      'contact.send':     'Send message',
      // Accounts
      'auth.demoNote':   'Accounts are stored in Supabase\'s encrypted database — works on all your devices.',
      'auth.required':   'All fields are required',
      'auth.nameShort':  'Name is too short (2 characters minimum)',
      'auth.emailInvalid': 'Invalid email address',
      'auth.pwShort':    'Password must be at least 8 characters',
      'auth.pwWeak':     'Password must contain both a letter and a number',
      'auth.pwMismatch': 'Passwords do not match',
      'auth.terms':      'You must accept the terms and conditions',
      'auth.exists':     'This email is already registered — please sign in instead',
      'auth.notFound':   'No account found with this email address',
      'auth.wrong':      'Incorrect email or password',
      'auth.ok':         'Signed in successfully ✓',
      'auth.created':    'Account created successfully ✓ Redirecting...',
      'auth.hello':      'Hi, {name}',
      'auth.logout':     'Log out',
      'auth.signIn':     'Sign in',
      'auth.clickLogout':'Click to log out of your account',
      'auth.codeSent':   'Verification code generated — enter it in the next step',
      'auth.codeWrong':  'Incorrect verification code',
      'auth.codeExpired':'Code expired (10 minutes) — request a new one',
      'auth.resetOk':    'Password updated successfully ✓ Redirecting to sign in...',
      'auth.pwUpdated':  'New password saved',
      'auth.pwHintDefault': 'At least 8 characters with letters and numbers.',
      'auth.pwOk':       'Strong password ✓',
      'auth.step1':      'Step 1 of 2 — Enter your email',
      'auth.step2':      'Step 2 of 2 — New password',
      // Supabase
      'auth.notConfigured': 'Supabase is not configured yet — add your keys in supabase-config.js',
      'auth.network':    'Could not reach the database — check your internet connection',
      'auth.notConfirmed': 'Please confirm your email first — check your inbox',
      'auth.confirmSent': 'Account created ✓ Check your email, click the confirmation link, then sign in',
      'auth.resetEmailSent': 'Reset link sent to your inbox ✓ Check your email (and spam folder)',
      'auth.rateLimited': 'Too many requests — try again in a few minutes',
      'auth.samePw':      'The new password must be different from the previous one',
      'auth.failed':      'Operation could not be completed — please try again',
      'auth.recoveryExpired': 'Reset link expired — request a new one'
    }
  };

  // ── ترجمة رسالة ديناميكية ──
  function t(key, vars) {
    let s = (MSG[lang] && MSG[lang][key]) || (MSG.ar[key]) || key;
    if (vars) {
      for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
    }
    return s;
  }

  function updateToggle() {
    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.textContent = lang === 'ar' ? 'EN' : 'عربي';
      btn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
      btn.setAttribute('lang', lang === 'ar' ? 'en' : 'ar');
    });
  }

  // ── تطبيق اللغة على الصفحة الحالية ──
  function apply() {
    const html = document.documentElement;
    html.lang = lang;
    html.dir  = lang === 'en' ? 'ltr' : 'rtl';

    // نصوص العناصر (النص العربي الأصلي يُخزَّن مرة واحدة ثم يُستعاد)
    document.querySelectorAll('[data-en]').forEach(el => {
      if (el.dataset.arCache === undefined) el.dataset.arCache = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.arCache;
    });

    // حقول الإدخال
    document.querySelectorAll('[data-en-ph]').forEach(el => {
      if (el.dataset.arPh === undefined) el.dataset.arPh = el.placeholder || '';
      el.placeholder = lang === 'en' ? el.dataset.enPh : el.dataset.arPh;
    });

    // وصف عناصر الوصول
    document.querySelectorAll('[data-en-aria]').forEach(el => {
      if (el.dataset.arAria === undefined) el.dataset.arAria = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', lang === 'en' ? el.dataset.enAria : el.dataset.arAria);
    });

    // عنوان التبويب
    document.querySelectorAll('title[data-en]').forEach(el => {
      if (el.dataset.arCache === undefined) el.dataset.arCache = el.innerHTML;
      el.textContent = lang === 'en' ? el.dataset.en : el.dataset.arCache;
    });

    updateToggle();
    try { localStorage.setItem(LS_KEY, lang); } catch { /* تجاهل */ }
    document.dispatchEvent(new CustomEvent('hp:langchange', { detail: { lang } }));
  }

  function setLang(next) {
    lang = next === 'en' ? 'en' : 'ar';
    apply();
  }

  function toggle() { setLang(lang === 'ar' ? 'en' : 'ar'); }

  function init() {
    apply();
    document.querySelectorAll('.lang-toggle').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  return { t, apply, setLang, toggle, init, get lang() { return lang; } };
})();

// اختصارات عامة
const t = I18N.t;

// التهيئة فور جاهزية DOM (السكربت في نهاية body عادةً)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', I18N.init);
} else {
  I18N.init();
}
