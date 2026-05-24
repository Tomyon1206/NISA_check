import type { Holding } from '../types'

export function calcProfitLoss(holding: Holding) {
  const cost = holding.purchasePrice * holding.quantity
  const current = holding.currentPrice * holding.quantity
  const amount = current - cost
  const rate = cost > 0 ? (amount / cost) * 100 : 0
  return { cost, current, amount, rate }
}

export function calcPortfolioSummary(holdings: Holding[]) {
  const totalCost = holdings.reduce((sum, h) => sum + h.purchasePrice * h.quantity, 0)
  const totalCurrent = holdings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0)
  const totalProfitLoss = totalCurrent - totalCost
  const totalRate = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0
  return { totalCost, totalCurrent, totalProfitLoss, totalRate }
}

export function calcNisaUsage(holdings: Holding[], year: number) {
  const thisYear = holdings.filter((h) => new Date(h.purchaseDate).getFullYear() === year)
  const growthUsed = thisYear
    .filter((h) => h.nisaType === 'growth')
    .reduce((sum, h) => sum + h.purchasePrice * h.quantity, 0)
  const tsumitateUsed = thisYear
    .filter((h) => h.nisaType === 'tsumitate')
    .reduce((sum, h) => sum + h.purchasePrice * h.quantity, 0)
  return { growthUsed, tsumitateUsed }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}
