-- ============================================================================
-- حاسباتي — مخطط قاعدة البيانات (Postgres / Supabase)
-- ----------------------------------------------------------------------------
-- شغّل هذا الملف كاملاً في Supabase:  SQL Editor ← New query ← الصق ← Run
--
-- يحتوي على ثلاثة أقسام:
--   1) profiles        ملفات المستخدمين (مرتبطة بحسابات Supabase Auth)
--   2) contact_messages رسائل نموذج "تواصل معنا"
--   3) tool_history    سجل نتائج الأدوات لكل مستخدم مسجّل
--
-- الأمان: يُفعَّل RLS (Row Level Security) على كل جدول،
-- فلا يمكن لأي مستخدم قراءة أو تعديل بيانات غيره،
-- ويبقى المفتاح anon العام آمناً للنشر في المتصفح.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) ملفات المستخدمين
--    • يُنشأ صفٌّ تلقائياً لكل حساب جديد (الترغر أدناه)
--    • الاسم المعروض في شريط التنقل يُقرأ من هذه الجدولة
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- كل مستخدم يدير ملفه فقط
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- إنشاء الملف تلقائياً عند تسجيل حساب جديد
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'user'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- تحديث updated_at تلقائياً
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) رسائل نموذج التواصل
--    • أي زائر (حتى غير المسجّل) يمكنه الإرسال
--    • القراءة تُترك للوحة تحكم Supabase فقط (service_role)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 80),
  email      text not null check (char_length(email) between 3 and 120),
  message    text not null check (char_length(message) between 2 and 4000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- الإدخال العام مسموح؛ لا قراءة عبر anon (الرسائل تُشاهد من لوحة Supabase)
create policy "contact_insert_public" on public.contact_messages
  for insert to anon, authenticated
  with check (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) سجل نتائج الأدوات (آلة حاسبة / أنظمة رقمية / هندسة)
--    • خاص بكل مستخدم مسجّل الدخول فقط
--    • قراءة / إضافة / حذف لبيانات نفسه فقط (RLS صارم)
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists public.tool_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  tool       text not null check (tool in ('calculator', 'numbers', 'geometry')),
  input      text not null check (char_length(input) between 1 and 300),
  output     text not null check (char_length(output) between 1 and 300),
  created_at timestamptz not null default now()
);

alter table public.tool_history enable row level security;

create policy "tool_history_insert_own" on public.tool_history
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "tool_history_select_own" on public.tool_history
  for select to authenticated
  using (auth.uid() = user_id);

create policy "tool_history_delete_own" on public.tool_history
  for delete to authenticated
  using (auth.uid() = user_id);

create index if not exists tool_history_user_idx
  on public.tool_history (user_id, created_at desc);