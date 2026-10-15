// اختبارات طبقة الشبكة (src/services/cloud.js): الحفظ والعرض والرسائل وملف المستخدم.
// نستبدل خدمة المصادقة بعميل Supabase وهمي، فلا يحدث أي اتصال شبكي،
// ونتأكد من أن كل الفشل «صامت وآمن» كما يوعد رأس الملف.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const h = vi.hoisted(() => {
  const state = {
    rows: [], insertError: null, selectError: null, deleteError: null,
    session: null, fromThrows: false
  }
  const calls = { from: [], inserts: [], deletes: [], selects: 0, setName: [] }
  const currentUser = { value: null }

  // سلسلة استعلام قابلة للانتظار تحاكي واجهة Supabase.
  // maybeSingle() يعيد صفًا واحدًا (أو null) كما يفعل Supabase فعليًا.
  const chain = (get) => {
    const o = {}
    let one = false
    const pass = () => o
    o.eq = pass
    o.order = pass
    o.limit = pass
    o.maybeSingle = () => { one = true; return o }
    const settle = () => {
      const r = get()
      if (one && Array.isArray(r.data)) r.data = r.data[0] ?? null
      return r
    }
    o.then = (res, rej) => Promise.resolve().then(settle).then(res, rej)
    o.catch = (rej) => Promise.resolve().then(settle).catch(rej)
    return o
  }

  const db = {
    from(table) {
      if (state.fromThrows) throw new Error('boom')
      calls.from.push(table)
      return {
        insert: (payload) => {
          calls.inserts.push({ table, payload })
          return Promise.resolve({ error: state.insertError })
        },
        select: () => { calls.selects++; return chain(() => ({ data: state.rows, error: state.selectError })) },
        delete: () => { calls.deletes.push(table); return chain(() => ({ error: state.deleteError })) }
      }
    },
    auth: { getSession: async () => ({ data: { session: state.session } }) }
  }

  const reset = () => {
    state.rows = []; state.insertError = null; state.selectError = null
    state.deleteError = null; state.session = null; state.fromThrows = false
    calls.from = []; calls.inserts = []; calls.deletes = []; calls.selects = 0; calls.setName = []
    currentUser.value = null
  }

  return { state, calls, currentUser, db, reset }
})

vi.mock('../src/services/auth.js', () => ({
  db: h.db,
  currentUser: h.currentUser,
  setName: (n) => { h.calls.setName.push(n) }
}))

import {
  saveTool, saveContact, loadProfile, useSavedHistory, refreshAll
} from '../src/services/cloud.js'

const flush = () => new Promise(r => setTimeout(r, 0))

beforeEach(async () => {
  h.reset()
  await flush() // يفرّغ refreshAll عند الإقلاع
  h.calls.setName = []
})

describe('cloud — saveTool', () => {
  it('لا يحفظ شيئًا بلا مستخدم', async () => {
    await saveTool('calculator', '2+2', '4')
    expect(h.calls.inserts).toHaveLength(0)
  })

  it('لا يحفظ إدخالًا فارغًا', async () => {
    h.currentUser.value = { id: 'u1' }
    await saveTool('calculator', '   ', '4')
    expect(h.calls.inserts).toHaveLength(0)
  })

  it('يحفظ العملية مقصوصة بحد 300 محرف', async () => {
    h.currentUser.value = { id: 'u1' }
    await saveTool('calculator', '  2+2  ', 'y'.repeat(400))
    expect(h.calls.inserts).toHaveLength(1)
    expect(h.calls.inserts[0]).toEqual({
      table: 'tool_history',
      payload: { user_id: 'u1', tool: 'calculator', input: '2+2', output: 'y'.repeat(300) }
    })
  })

  it('يقصّ الإدخال الطويل أيضًا', async () => {
    h.currentUser.value = { id: 'u1' }
    await saveTool('calculator', 'x'.repeat(400), '4')
    expect(h.calls.inserts[0].payload.input).toHaveLength(300)
  })

  it('يعرض آخر النتائج المحفوظة بعد نجاح الحفظ', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.rows = [{ id: 1, input: '2+2', output: '4' }]
    await saveTool('calculator', '2+2', '4')
    await flush()

    const { entries, visible } = useSavedHistory('calculator')
    expect(visible.value).toBe(true)
    expect(entries.value).toEqual([{ id: 1, input: '2+2', output: '4' }])
  })

  it('يبقى صامتًا عند فشل الحفظ فلا يقرأ النتائج من جديد', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.insertError = { message: 'denied' }
    const before = h.calls.selects
    await expect(saveTool('calculator', '2+2', '4')).resolves.toBeUndefined()
    await flush()
    expect(h.calls.selects).toBe(before) // لا تحديث للوحة المحفوظات بعد إدراج فاشل
  })

  it('يبقى صامتًا عند فشل قراءة النتائج', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.selectError = { message: 'timeout' }
    await saveTool('calculator', '2+2', '4')
    await flush()
    const { entries, visible } = useSavedHistory('calculator')
    expect(visible.value).toBe(false)
    expect(entries.value).toEqual([])
  })

  it('يبقى صامتًا إذا رمى العميل استثناءً', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.fromThrows = true
    await expect(saveTool('calculator', '2+2', '4')).resolves.toBeUndefined()
  })
})

describe('cloud — saveContact', () => {
  it('يرسل الرسالة مقصوصة', async () => {
    const r = await saveContact('ن'.repeat(120), 'e'.repeat(200), 'م'.repeat(5000))
    expect(r).toEqual({ ok: true, tried: true })
    expect(h.calls.inserts[0].table).toBe('contact_messages')
    expect(h.calls.inserts[0].payload.name).toHaveLength(80)
    expect(h.calls.inserts[0].payload.email).toHaveLength(120)
    expect(h.calls.inserts[0].payload.message).toHaveLength(4000)
  })

  it('يعيد tried=true مع ok=false عند خطأ الخادم', async () => {
    h.state.insertError = { message: 'rls' }
    expect(await saveContact('ن', 'a@b.com', 'مرحبا')).toEqual({ ok: false, tried: true })
  })

  it('يعيد tried=true مع ok=false عند رمي استثناء', async () => {
    h.state.fromThrows = true
    expect(await saveContact('ن', 'a@b.com', 'مرحبا')).toEqual({ ok: false, tried: true })
  })
})

describe('cloud — loadProfile', () => {
  it('يعيد اسم العرض من جدول profiles', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.rows = [{ full_name: 'رونق' }]
    expect(await loadProfile()).toBe('رونق')
  })

  it('يعيد null بلا مستخدم أو عند الخطأ', async () => {
    expect(await loadProfile()).toBeNull()

    h.currentUser.value = { id: 'u1' }
    h.state.selectError = { message: 'nope' }
    expect(await loadProfile()).toBeNull()

    h.state.selectError = null
    h.state.rows = []
    expect(await loadProfile()).toBeNull()
  })

  it('ينجح حتى لو كان الاسم فارغًا في الجدول', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.rows = [{ full_name: '' }]
    expect(await loadProfile()).toBeNull()
  })
})

describe('cloud — useSavedHistory', () => {
  it('يحمّل النتائج عند الطلب', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.rows = [{ id: 5, input: '12+8', output: '20' }]
    const { entries, visible, reload } = useSavedHistory('calculator')
    await reload()
    expect(visible.value).toBe(true)
    expect(entries.value).toEqual([{ id: 5, input: '12+8', output: '20' }])
  })

  it('يخفي اللوحة بلا مستخدم', async () => {
    const { visible, reload } = useSavedHistory('calculator')
    await reload()
    expect(visible.value).toBe(false)
  })

  it('يخفي اللوحة عند خطأ القراءة', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.selectError = { message: 'timeout' }
    const { visible } = useSavedHistory('calculator')
    await useSavedHistory('calculator').reload()
    expect(visible.value).toBe(false)
  })

  it('يحذف عنصرًا محليًا ويرسل نداء الحذف', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.rows = [{ id: 1, input: '2+2', output: '4' }, { id: 2, input: '3+3', output: '6' }]
    const { entries, reload, remove } = useSavedHistory('calculator')
    await reload()
    expect(entries.value).toHaveLength(2)

    await remove(1)
    expect(entries.value).toEqual([{ id: 2, input: '3+3', output: '6' }])
    expect(h.calls.deletes).toContain('tool_history')
  })

  it('يفرّغ كل نتائج الأداة', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.rows = [{ id: 1, input: '2+2', output: '4' }]
    const { entries, reload, clearAll } = useSavedHistory('calculator')
    await reload()
    await clearAll()
    expect(entries.value).toEqual([])
    expect(h.calls.deletes).toContain('tool_history')
  })

  it('لا يلمس الشبكة بلا مستخدم عند الحذف والتفريغ', async () => {
    const { remove, clearAll } = useSavedHistory('calculator')
    await remove(1)
    await clearAll()
    expect(h.calls.deletes).toHaveLength(0)
  })

  it('يشير إلى خطأ القراءة ولا يعرض النتائج', async () => {
    h.currentUser.value = { id: 'u1' }
    h.state.rows = []
    const { entries, visible, reload } = useSavedHistory('calculator')
    await reload() // تهيئة نظيفة قبل محاكاة الخطأ
    expect(entries.value).toEqual([])

    h.state.selectError = { message: 'boom' }
    await reload()
    expect(visible.value).toBe(false)
    expect(entries.value).toEqual([])
  })
})

describe('cloud — refreshAll', () => {
  it('يجلب اسم العرض عند وجود جلسة', async () => {
    h.state.session = { user: { id: 'u1' } }
    h.currentUser.value = { id: 'u1' }
    h.state.rows = [{ full_name: 'رونق' }]
    await refreshAll()
    expect(h.calls.setName).toContain('رونق')
  })

  it('يصفّر الاسم بلا جلسة', async () => {
    await refreshAll()
    expect(h.calls.setName).toEqual([null])
  })
})

describe('cloud — بلا مفاتيح Supabase', () => {
  it('يمرّ كل شيء بسلام دون اتصال', async () => {
    vi.resetModules()
    vi.doMock('../src/services/auth.js', () => ({
      db: null,
      currentUser: { value: { id: 'u1' } },
      setName: () => {}
    }))
    const c = await import('../src/services/cloud.js')

    await expect(c.saveTool('calculator', '2+2', '4')).resolves.toBeUndefined()
    expect(await c.saveContact('ن', 'a@b.com', 'مرحبا')).toEqual({ ok: false, tried: false })
    expect(await c.loadProfile()).toBeNull()
    await expect(c.refreshAll()).resolves.toBeUndefined()
    await expect(c.useSavedHistory('calculator').reload()).resolves.toBeUndefined()
    expect(c.useSavedHistory('calculator').visible.value).toBe(false)
    expect(h.calls.inserts).toHaveLength(0)
  })
})
