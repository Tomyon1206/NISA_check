// Vercel Serverless Function: /api/price?ticker=7203
//
// ブラウザから証券データAPIを直接呼ぶとCORSで弾かれるため、
// このサーバーレス関数を経由してYahoo Financeのチャートエンドポイントを叩き、
// 現在値のみを返す。詳細な調査経緯は docs/stock-api-research.md を参照。
//
// 型はVercelのNode.jsランタイムのreq/resに準拠した最小限のものを自前定義し、
// フロントエンド用のtsconfig（tsc -b の対象はsrcのみ）には含めていない。

interface VercelLikeRequest {
  query: Record<string, string | string[] | undefined>
}

interface VercelLikeResponse {
  status(code: number): VercelLikeResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  const rawTicker = req.query.ticker
  const ticker = Array.isArray(rawTicker) ? rawTicker[0] : rawTicker

  if (!ticker || !ticker.trim()) {
    res.status(400).json({ error: 'ticker is required' })
    return
  }

  // 日本株のティッカーはYahoo Finance上では「.T」サフィックスが必要。
  // 既に英字サフィックスが付いている場合（米国株ティッカー等）はそのまま使う。
  const symbol = /\.[A-Za-z]+$/.test(ticker) ? ticker : `${ticker}.T`

  try {
    const upstream = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; nisa-portfolio/1.0)' } },
    )

    if (!upstream.ok) {
      res.status(502).json({ error: `upstream error (${upstream.status})` })
      return
    }

    const data = (await upstream.json()) as {
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number; currency?: string; regularMarketTime?: number }
        }>
      }
    }

    const meta = data.chart?.result?.[0]?.meta
    const price = meta?.regularMarketPrice

    if (typeof price !== 'number') {
      res.status(404).json({ error: `price not found for ${symbol}` })
      return
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json({
      ticker,
      symbol,
      price,
      currency: meta?.currency ?? null,
      marketTime: meta?.regularMarketTime ?? null,
    })
  } catch (err) {
    res.status(502).json({
      error: 'price fetch failed',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
