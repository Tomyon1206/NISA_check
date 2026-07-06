import { describe, it, expect } from 'vitest'
import { isHolding, parseHoldingsJson } from './holdingsIO'

const validHolding = {
  id: '1',
  name: 'テスト銘柄',
  ticker: '0000',
  nisaType: 'growth',
  quantity: 10,
  purchasePrice: 1000,
  currentPrice: 1200,
  purchaseDate: '2026-01-15',
}

describe('isHolding', () => {
  it('正しい形式のオブジェクトはtrueを返す', () => {
    expect(isHolding(validHolding)).toBe(true)
  })

  it('nisaTypeが不正な値の場合はfalseを返す', () => {
    expect(isHolding({ ...validHolding, nisaType: 'invalid' })).toBe(false)
  })

  it('必須フィールドが欠けている場合はfalseを返す', () => {
    const { name: _name, ...rest } = validHolding
    expect(isHolding(rest)).toBe(false)
  })

  it('数値であるべきフィールドが文字列の場合はfalseを返す', () => {
    expect(isHolding({ ...validHolding, quantity: '10' })).toBe(false)
  })

  it('nullやプリミティブ値はfalseを返す', () => {
    expect(isHolding(null)).toBe(false)
    expect(isHolding('string')).toBe(false)
    expect(isHolding(42)).toBe(false)
  })
})

describe('parseHoldingsJson', () => {
  it('正しいJSON配列をパースできる', () => {
    const json = JSON.stringify([validHolding])
    expect(parseHoldingsJson(json)).toEqual([validHolding])
  })

  it('不正なJSON文字列の場合はエラーを投げる', () => {
    expect(() => parseHoldingsJson('{invalid json')).toThrow()
  })

  it('配列でない場合はエラーを投げる', () => {
    expect(() => parseHoldingsJson(JSON.stringify(validHolding))).toThrow()
  })

  it('要素の形式が不正な場合はエラーを投げる', () => {
    expect(() => parseHoldingsJson(JSON.stringify([{ foo: 'bar' }]))).toThrow()
  })

  it('空配列は許容する', () => {
    expect(parseHoldingsJson('[]')).toEqual([])
  })
})
