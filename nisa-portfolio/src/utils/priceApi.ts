/**
 * サーバーレス関数 /api/price, /api/stockSearch, /api/historicalPrice 経由で
 * 現在値・銘柄検索・過去の終値取得を行う。
 * ブラウザから証券データAPIへ直接アクセスするとCORSで失敗するため、
 * Vercel Functions（api/price.ts, api/stockSearch.ts, api/historicalPrice.ts）を経由させている（docs/stock-api-research.md参照）。
 */
export async function fetchCurrentPrice(ticker: string): Promise<number> {
  const trimmed = ticker.trim()
  if (!trimmed) {
    throw new Error('ティッカー/コードが未入力です')
  }

  const res = await fetch(`/api/price?ticker=${encodeURIComponent(trimmed)}`)
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `株価の取得に失敗しました（${res.status}）`)
  }

  const data = (await res.json()) as { price?: unknown }
  if (typeof data.price !== 'number' || Number.isNaN(data.price)) {
    throw new Error('株価データの形式が不正です')
  }
  return data.price
}

export interface TickerSearchResult {
  symbol: string
  name: string
  exchange?: string
}

/** 銘柄名 or ティッカーの部分一致で候補を検索する（HoldingFormの銘柄検索UIから使用） */
export async function searchTickers(query: string): Promise<TickerSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const res = await fetch(`/api/stockSearch?q=${encodeURIComponent(trimmed)}`)
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `銘柄検索に失敗しました（${res.status}）`)
  }

  const data = (await res.json()) as { results?: TickerSearchResult[] }
  return Array.isArray(data.results) ? data.results : []
}

export interface HistoricalPriceResult {
  price: number
  /** 実際に終値が採れた日（指定日が非営業日の場合は直近の取引日になる） */
  matchedDate: string
}

/** 指定日（非営業日なら直近の取引日）の終値を取得する。HoldingFormの購入単価の自動入力に使用 */
export async function fetchHistoricalPrice(ticker: string, date: string): Promise<HistoricalPriceResult> {
  const trimmed = ticker.trim()
  if (!trimmed) {
    throw new Error('ティッカー/コードが未入力です')
  }
  if (!date) {
    throw new Error('購入日が未入力です')
  }

  const res = await fetch(`/api/historicalPrice?ticker=${encodeURIComponent(trimmed)}&date=${encodeURIComponent(date)}`)
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `購入日の終値取得に失敗しました（${res.status}）`)
  }

  const data = (await res.json()) as { price?: unknown; matchedDate?: unknown }
  if (typeof data.price !== 'number' || Number.isNaN(data.price) || typeof data.matchedDate !== 'string') {
    throw new Error('終値データの形式が不正です')
  }
  return { price: data.price, matchedDate: data.matchedDate }
}
