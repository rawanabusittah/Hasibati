# حاسباتي — نسخة Vue 3 + Vite

موقع حاسباتي: آلة حاسبة علمية، محوّل أنظمة رقمية، وأدوات هندسية — عربي/إنجليزي، ووضعان نهاري وليلي.

تحويل كامل من HTML/CSS/JS كلاسيكي إلى **SPA بـ Vue 3 + Vue Router + ملفات SFC** مع بقاء التصميم والسلوك كما هو.

## 🚀 التشغيل

```bash
npm install        # أو npm.cmd install (على Windows إن مُنعت npm)
npm run dev        # خادم تطوير على http://localhost:5173
npm run build      # بناء إنتاجي في مجلد dist/
npm run preview    # معاينة البناء الإنتاجي
```

> ملاحظة خاصة بـ Windows: إن ظهرت رسالة تفيد بحجب PowerShell لسكربت `npm`، استخدم `npm.cmd`.

## 📁 البنية

```
├── index.html              # نقطة الدخول (Vite)
├── public/css/             # ملفات CSS الأصلية كما هي (style, theme, calc-ops, components, design)
├── src/
│   ├── main.js             # نقطة إقلاع التطبيق
│   ├── App.vue             # الشريط العلوي + الفوتر + <router-view>
│   ├── router/index.js     # المسارات (hash history ليعمل على أي استضافة ثابتة)
│   ├── composables/        # i18n (عربي/إنجليزي) و theme (ليلي/نهاري)
│   ├── services/           # auth (Supabase) و cloud (قاعدة البيانات) و siteConfig
│   ├── lib/core.js         # MathEngine + BaseConv (منطق رياضي خالص)
│   ├── components/         # AppNav, AppFooter, SavedHistory, SheetSolver
│   └── views/              # 10 صفحات: home/calculator/numbers/geometry/contact
│                          #   + login/register/forgot/menu/services
├── supabase/               # schema.sql + SETUP.md لِقاعدة بيانات الحسابات
└── legacy/                 # نسخة من الموقع القديم (HTML كلاسيكي) للرجوع إليها
```

## 🗺️ المسارات

| المسار        | الصفحة                     |
|---------------|----------------------------|
| `/`           | الرئيسية (مع حاسبة تجريبية)|
| `/calculator` | الآلة الحاسبة العلمية      |
| `/numbers`    | تحويل الأنظمة الرقمية      |
| `/geometry`   | الأشكال الهندسية           |
| `/contact`    | تواصل                      |
| `/login`      | تسجيل الدخول               |
| `/register`   | إنشاء حساب                 |
| `/forgot`     | استعادة كلمة المرور        |
| `/menu`       | خريطة الموقع               |
| `/services`   | كل الأدوات                 |

استخدمنا `hash history` (`#/calculator`) ليعمل التطبيق على أي استضافة ثابتة (GitHub Pages أو فتح `index.html` محلياً) دون إعدادات إضافية.

## 🔐 Supabase (اختياري)

الحسابات والتخزين السحابي يعملان عبر Supabase تماماً كما في الموقع القديم:

1. أنشئ مشروعاً مجانياً على supabase.com
2. نفّذ ملف `supabase/schema.sql` (جدولا profiles و tool_history و contact_messages)
3. ضع `Project URL` و `anon public key` في `src/services/supabaseConfig.js`

**عندما يكون الإعداد فارغاً (كما هو الآن) يعمل الموقع كاملاً بصمت:** لا أخطاء، ولا قيود على الأدوات.

## 🔄 ما الذي تغيّر تقنياً؟

- **كل صفحة HTML مفردة** → مكوّن SFC واحد (قالب + منطق + أنماط عند الحاجة)
- **`data-en` + إعادة الرسم اليدوي** → نظام i18n تفاعلي: `t('key')` و `L(عربي, English)` يعيدان الرسم تلقائياً عند تبديل اللغة
- **build دون بناء** → فحص حقيقي للأخطاء وتحليل (`vite dev` / `vite build`)
- **المنطق الرياضي** (`MathEngine`/`BaseConv`) منقول كما هو إلى `src/lib/core.js` دون تغيير