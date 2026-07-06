import { describe, it, expect } from 'vitest'
import {
  calcProfitLoss,
  calcPortfolioSummary,
  calcNisaUsage,
  formatCurrency,
  formatPercent,
} from './calculations'
import type { Holding } from '../types'

function makeHolding(overrides: Partial<Holding> = {}): Holding {
  return {
    id: '1',
    name: 'テスト銘柄',
    ticker: '0000',
    nisaType: 'growth',
    quantity: 10,
    purchasePrice: 1000,
    currentPrice: 1200,
    purchaseDate: '2026-01-15',
    ...overrides,
  }
}

describe('calcProfitLoss', () => {
  it('現在値が取得価額より高い場合、正の損益を返す', () => {
    const holding = makeHolding({ quantity: 10, purchasePrice: 1000, currentPrice: 1200 })
    const result = calcProfitLoss(holding)
    expect(result.cost).toBe(10_000)
    expect(result.current).toBe(12_000)
    expect(result.amount).toBe(2_000)
    expect(result.rate).toBeCloseTo(20)
  })

  it('現在値が取得価額より低い場合、負の損益を返す', () => {
    const holding = makeHolding({ quantity: 5, purchasePrice: 2000, currentPrice: 1500 })
    const result = calcProfitLoss(holding)
    expect(result.amount).toBe(-2_500)
    expect(result.rate).toBeCloseTo(-25)
  })

  it('取得価額が0の場合、rateは0を返す（ゼロ除算回避）', () => {
    const holding = makeHolding({ quantity: 0, purchasePrice: 0, currentPrice: 1000 })
    const result = calcProfitLoss(holding)
    expect(result.rate).toBe(0)
  })
})

describe('calcPortfolioSummary', () => {
  it('複数銘柄の合計損益・損益率を正しく計算する', () => {
    const holdings = [
      makeHolding({ id: '1', quantity: 10, purchasePrice: 1000, currentPrice: 1200 }),
      makeHolding({ id: '2', quantity: 5, purchasePrice: 2000, currentPrice: 1800 }),
    ]
    const result = calcPortfolioSummary(holdings)
    expect(result.totalCost).toBe(20_000)
    expect(result.totalCurrent).toBe(21_000)
    expect(result.totalProfitLoss).toBe(1_000)
    expect(result.totalRate).toBeCloseTo(5)
  })

  it('銘柄が空の場合、すべて0を返す', () => {
    const result = calcPortfolioSummary([])
    expect(result).toEqual({ totalCost: 0, totalCurrent: 0, totalProfitLoss: 0, totalRate: 0 })
  })
})

describe('calcNisaUsage', () => {
  it('指定年に購入した銘柄のみを枠計算に含める', () => {
    const holdings = [
      makeHolding({ id: '1', nisaType: 'growth', quantity: 10, purchasePrice: 1000, purchaseDate: '2026-03-01' }),
      makeHolding({ id: '2', nisaType: 'tsumitate', quantity: 4, purchasePrice: 5000, purchaseDate: '2026-06-01' }),
      makeHolding({ id: '3', nisaType: 'growth', quantity: 100, purchasePrice: 1000, purchaseDate: '2025-01-01' }),
    ]
    const result = calcNisaUsage(holdings, 2026)
    expect(result.growthUsed).toBe(10_000)
    expect(result.tsumitateUsed).toBe(20_000)
  })

  it('該当年の購入がない場合は0を返す', () => {
    const holdings = [makeHolding({ purchaseDate: '2024-01-01' })]
    const result = calcNisaUsage(holdings, 2026)
    expect(result.growthUsed).toBe(0)
    expect(result.tsumitateUsed).toBe(0)
  })
})

describe('formatCurrency', () => {
  it('日本円形式にフォーマットする', () => {
    expect(formatCurrency(12345)).toBe('￥12,345')
  })

  it('負の値も正しくフォーマットする', () => {
    expect(formatCurrency(-500)).toBe('-￥500')
  })
})

describe('formatPercent', () => {
  it('正の値には+記号を付与する', () => {
    expect(formatPercent(12.345)).toBe('+12.35%')
  })

  it('負の値には-記号がそのまま付与される', () => {
    expect(formatPercent(-5.5)).toBe('-5.50%')
  })

  it('0は+0.00%として扱う', () => {
    expect(formatPercent(0)).toBe('+0.00%')
  })
})
