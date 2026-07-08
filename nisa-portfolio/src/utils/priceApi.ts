/**
 * サーバーレス関数 /api/price, /api/stockSearch 経由で現在値・銘柄検索を行う。
 * ブラウザから証券データAPIへ直接アクセスするとCORSで失敗するため、
 * Vercel Functions（api/price.ts, api/stockSearch.ts）を経由させている（docs/stock-api-research.md参照）。
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
