/**
 * サーバーレス関数 /api/price 経由で現在値を取得する。
 * ブラウザから証券データAPIへ直接アクセスするとCORSで失敗するため、
 * Vercel Functions（api/price.ts）を経由させている（docs/stock-api-research.md参照）。
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
