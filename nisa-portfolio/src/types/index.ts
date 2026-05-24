export type NisaType = 'growth' | 'tsumitate'

export interface Holding {
  id: string
  name: string
  ticker: string
  nisaType: NisaType
  quantity: number
  purchasePrice: number
  currentPrice: number
  purchaseDate: string
}

export interface NisaAllocation {
  year: number
  growthUsed: number
  tsumitateUsed: number
}

export const NISA_LIMITS = {
  growth: 2_400_000,
  tsumitate: 1_200_000,
  total: 3_600_000,
} as const
