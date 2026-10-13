// ============================================================
// cloud — طبقة قاعدة البيانات (Supabase)
// • ملفات المستخدمين (profiles) → اسم العرض في شريط التنقل
// • سجل نتائج الأدوات (tool_history) → لوحة «نتائجك المحفوظة»
// • رسائل نموذج التواصل (contact_messages)
//
// كل العمليات «صامتة وآمنة»: عندما لا يكون Supabase مضبوطاً
// (أو فشل الاتصال) لا يظهر أي خطأ ولا تتوقف الأدوات عن العمل.
// ============================================================
import { ref } from 'vue'
import { db, currentUser, setName } from './auth'

const user = () => currentUser.value || null

// ═══════ الحفظ في سجلّ الأدوات ═══════
export async function saveTool(tool, input, output) {
  const d = db, u = user()
  const trimmed = String(input || '').trim()
  if (!d || !u || !trimmed) return
  try {
    const { error } = await d.from('tool_history').insert({
      user_id: u.id,
      tool,
      input: trimmed.slice(0, 300),
      output: String(output || '').slice(0, 300)
    })
    if (!error) refreshSaved(tool)
  } catch { /* صامت */ }
}

// ═══════ رسالة نموذج التواصل ═══════
export async function saveContact(name, email, message) {
  const d = db
  if (!d) return { ok: false, tried: false }
  try {
    const { error } = await d.from('contact_messages').insert({
      name: String(name).slice(0, 80),
      email: String(email).slice(0, 120),
      message: String(message).slice(0, 4000)
    })
    return { ok: !error, tried: true }
  } catch {
    return { ok: false, tried: true }
  }
}

// ═══════ اسم العرض من جدول profiles ═══════
export async function loadProfile() {
  const d = db, u = user()
  if (!d || !u) return null
  try {
    const { data, error } = await d.from('profiles').select('full_name').eq('id', u.id).maybeSingle()
    if (error || !data) return null
    return data.full_name || null
  } catch { return null }
}

// ═══════ لوحة «نتائجك المحفوظة» على صفحات الأدوات ═══════
const savedState = ref([])
const savedShown = ref(false)

function refreshSaved(tool) {
  const d = db, u = user()
  if (!d || !u || !tool) { savedShown.value = false; savedState.value = []; return }
  d.from('tool_history')
    .select('id, input, output')
    .eq('user_id', u.id)
    .eq('tool', tool)
    .order('created_at', { ascending: false })
    .limit(10)
    .then(({ data, error }) => {
      if (error) { savedShown.value = false; savedState.value = []; return }
      savedState.value = data || []
      savedShown.value = true
    })
    .catch(() => { savedShown.value = false; savedState.value = [] })
}

export function useSavedHistory(tool) {
  const visible = ref(savedShown.value)
  const d = db, u = user()

  async function reload() {
    const d0 = db, u0 = user()
    if (!d0 || !u0) { visible.value = false; return }
    try {
      const { data, error } = await d0.from('tool_history')
        .select('id, input, output').eq('user_id', u0.id).eq('tool', tool)
        .order('created_at', { ascending: false }).limit(10)
      if (error) { visible.value = false; return }
      savedState.value = data || []
      visible.value = true
    } catch { visible.value = false }
  }

  async function remove(id) {
    const d0 = db, u0 = user()
    if (!d0 || !u0) return
    try {
      await d0.from('tool_history').delete().eq('id', id).eq('user_id', u0.id)
      savedState.value = savedState.value.filter(e => e.id !== id)
    } catch { /* صامت */ }
  }

  async function clearAll() {
    const d0 = db, u0 = user()
    if (!d0 || !u0) return
    try {
      await d0.from('tool_history').delete().eq('user_id', u0.id).eq('tool', tool)
      savedState.value = []
    } catch { /* صامت */ }
  }

  return { entries: savedState, visible, reload, remove, clearAll }
}

// ═══════ التهيئة ═══════
export async function refreshAll() {
  const s = await (db ? db.auth.getSession() : null)
  if (s && s.data && s.data.session) {
    const name = await loadProfile()
    setName(name)
  } else {
    setName(null)
  }
}

refreshAll()