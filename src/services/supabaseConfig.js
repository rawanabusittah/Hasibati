// ============================================================
// supabaseConfig — إعداد Supabase (قاعدة بيانات المستخدمين)
//
// المفاتيح تُقرأ من متغيرات بيئة Vite ولا تُخزَّن في الكود إطلاقًا:
//   • محليًا:       انسخ ملف  .env.example  إلى  .env  واملأ القيمتين.
//   • على GitHub:   Settings ← Secrets and variables ← Actions،
//                   أضف:  VITE_SUPABASE_URL  و  VITE_SUPABASE_ANON_KEY
//                   وسيُحقنها سير العمل تلقائيًا أثناء البناء.
//
// القيم الاحتياطية أدناه تبقى على الشكل الافتراضي عن قصد:
// عند غياب المفاتيح يعمل الموقع كاملًا بصمت (بلا حسابات) دون أي أخطاء،
// لأنّ auth.js يعتبر الإعداد «غير جاهز» ويوقف كل عمليات السحابة.
//
// ملاحظة أمان: المفتاح anon/public مُصمَّم للظهور في المتصفح؛
// الحماية الحقيقية من سياسات RLS داخل الجداول (supabase/schema.sql).
// ============================================================

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://YOUR-PROJECT-REF.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR-ANON-PUBLIC-KEY-HERE'
