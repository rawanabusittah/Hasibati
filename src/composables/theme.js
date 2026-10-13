// ============================================================
// theme — الوضع الليلي / النهاري + شريط تقدّم التمرير
// الأولوية: اختيار المستخدم المحفوظ ← تفضيل النظام.
// ============================================================
import { ref } from 'vue'

const K = 'hp_theme'
const root = () => document.documentElement

function stored() {
  try { const s = localStorage.getItem(K); return (s === 'light' || s === 'dark') ? s : null } catch { return null }
}
function sys() {
  return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const theme = ref(stored() || sys() || 'dark')

function apply(th, save = false) {
  theme.value = th
  const r = root()
  r.dataset.theme = th
  r.style.colorScheme = th
  const m = document.querySelector('meta[name="theme-color"]')
  if (m) m.content = th === 'light' ? '#f5f7fd' : '#070a12'
  if (save) {
    try { localStorage.setItem(K, th) } catch { /* تجاهل */ }
    r.classList.add('theme-anim')
    setTimeout(() => r.classList.remove('theme-anim'), 450)
  }
  document.dispatchEvent(new CustomEvent('hp:themechange', { detail: { theme: th } }))
}

export function init() {
  apply(theme.value)
}

export function toggleTheme() {
  apply(theme.value === 'light' ? 'dark' : 'light', true)
}

export function useTheme() {
  return { theme, toggleTheme, isLight: theme.value === 'light' }
}

// شريط تقدّم التمرير (مرة واحدة)
let progressReady = false
export function setupScrollProgress() {
  if (progressReady) return
  progressReady = true
  const pb = document.createElement('div')
  pb.id = 'scroll-progress'
  pb.setAttribute('aria-hidden', 'true')
  document.body.appendChild(pb)
  const upd = () => {
    const m = document.documentElement.scrollHeight - innerHeight
    pb.style.width = (m > 0 ? Math.min(100, scrollY / m * 100) : 0) + '%'
  }
  addEventListener('scroll', upd, { passive: true })
  addEventListener('resize', upd)
  upd()
}

if (window.matchMedia) {
  const mq = matchMedia('(prefers-color-scheme: light)')
  const onSys = () => { if (!stored()) apply(sys()) }
  if (mq.addEventListener) mq.addEventListener('change', onSys)
}