import type { Holding, NisaType } from '../types'

const NISA_TYPES: readonly NisaType[] = ['growth', 'tsumitate']

/** インポートされたJSONの1要素がHoldingとして妥当かを検証する型ガード */
export function isHolding(value: unknown): value is Holding {
  if (typeof value !== 'object' || value === null) return false
  const h = value as Record<string, unknown>
  return (
    typeof h.id === 'string' &&
    typeof h.name === 'string' &&
    typeof h.ticker === 'string' &&
    NISA_TYPES.includes(h.nisaType as NisaType) &&
    typeof h.quantity === 'number' &&
    typeof h.purchasePrice === 'number' &&
    typeof h.currentPrice === 'number' &&
    typeof h.purchaseDate === 'string'
  )
}

/**
 * エクスポートされたJSON文字列をHolding[]としてパース・検証する。
 * 形式が不正な場合はErrorを投げる。
 */
export function parseHoldingsJson(json: string): Holding[] {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('JSONとして解析できませんでした')
  }
  if (!Array.isArray(data) || !data.every(isHolding)) {
    throw new Error('保有銘柄データの形式が不正です')
  }
  return data
}
