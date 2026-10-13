// اختبارات محوّل الأنظمة الرقمية (BaseConv) — الدقة عبر BigInt
import { describe, it, expect } from 'vitest'
import { BaseConv } from '../src/lib/core.js'

describe('BaseConv — التحليل (parse)', () => {
  it('يحلل الأعداد الصحيحة باختلاف الأنظمة', () => {
    expect(BaseConv.parse('FF', 16).int).toBe(255n)
    expect(BaseConv.parse('1010', 2).int).toBe(10n)
    expect(BaseConv.parse('17', 8).int).toBe(15n)
    expect(BaseConv.parse('255', 10).int).toBe(255n)
  })

  it('يتعامل مع البادئات 0x / 0b / 0o', () => {
    expect(BaseConv.parse('0xFF', 16).int).toBe(255n)
    expect(BaseConv.parse('0b1010', 2).int).toBe(10n)
    expect(BaseConv.parse('0o17', 8).int).toBe(15n)
  })

  it('يتعامل مع الأعداد السالبة', () => {
    const p = BaseConv.parse('-1010', 2)
    expect(p.neg).toBe(true)
    expect(p.int).toBe(10n)
  })

  it('يحلل الكسور إلى بسط/مقام', () => {
    const p = BaseConv.parse('0.5', 10)
    expect(p.int).toBe(0n)
    expect(p.num).toBe(5n)
    expect(p.den).toBe(10n)
  })

  it('يرفض المدخلات غير الصحيحة', () => {
    expect(BaseConv.parse('', 10)).toEqual({ error: 'required' })
    expect(BaseConv.parse('xyz', 16)).toEqual({ error: 'invalid' })
    expect(BaseConv.parse('2', 2)).toEqual({ error: 'invalid' })
    expect(BaseConv.parse('8', 8)).toEqual({ error: 'invalid' })
    expect(BaseConv.parse('A', 10)).toEqual({ error: 'invalid' })
  })

  it('يحفظ الدقة الكاملة خارج حدود Number (BigInt)', () => {
    // 2^53 + 1 — يتعذّر تمثيله بدقة في Number العادي
    const p = BaseConv.parse('9007199254740993', 10)
    expect(p.int).toBe(9007199254740993n)
    expect(BaseConv.toBase(p, 16).intText).toBe('20000000000001')
  })
})

describe('BaseConv — التحويل (toBase)', () => {
  it('يحوّل صحيحاً بين الأنظمة', () => {
    expect(BaseConv.toBase(BaseConv.parse('255', 10), 16).text).toBe('FF')
    expect(BaseConv.toBase(BaseConv.parse('255', 10), 2).text).toBe('11111111')
    expect(BaseConv.toBase(BaseConv.parse('10', 10), 2).text).toBe('1010')
    expect(BaseConv.toBase(BaseConv.parse('1010', 2), 10).text).toBe('10')
  })

  it('يحوّل الكسور المنتهية', () => {
    expect(BaseConv.toBase(BaseConv.parse('0.5', 10), 2).text).toBe('0.1')
    expect(BaseConv.toBase(BaseConv.parse('0.25', 10), 2).text).toBe('0.01')
  })

  it('يقتطع الكسور الدورية ويعلّم ذلك', () => {
    const r = BaseConv.toBase(BaseConv.parse('0.1', 10), 2, 10)
    expect(r.truncated).toBe(true)
    expect(r.frac.length).toBe(10)
  })

  it('bitInfo يحسب البتات والبايتات', () => {
    expect(BaseConv.bitInfo(BaseConv.parse('255', 10))).toEqual({ bits: 8, bytes: 1 })
    expect(BaseConv.bitInfo(BaseConv.parse('0', 10))).toEqual({ bits: 1, bytes: 1 })
  })
})
