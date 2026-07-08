// Vercel Serverless Function: /api/stockSearch?q=トヨタ
//
// 銘柄名またはティッカーの部分一致でYahoo Financeの検索エンドポイントを叩き、
// 候補一覧（symbol/name/exchange）を返す。HoldingFormの銘柄検索UIから使用する。
// ブラウザから直接叩くとCORSで弾かれるため、api/price.tsと同様にサーバー側で代理実行する。

interface VercelLikeRequest {
  query: Record<string, string | string[] | undefined>
}

interface VercelLikeResponse {
  status(code: number): VercelLikeResponse
  json(body: unknown): void
  setHeader(name: string, value: string): void
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  const rawQuery = req.query.q
  const q = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery

  if (!q || !q.trim()) {
    res.status(400).json({ error: 'q is required' })
    return
  }

  try {
    const upstream = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; nisa-portfolio/1.0)' } },
    )

    if (!upstream.ok) {
      res.status(502).json({ error: `upstream error (${upstream.status})` })
      return
    }

    const data = (await upstream.json()) as {
      quotes?: Array<{
        symbol?: string
        shortname?: string
        longname?: string
        exchDisp?: string
        quoteType?: string
      }>
    }

    const results = (data.quotes ?? [])
      .filter((item) => item.symbol && (item.shortname || item.longname))
      .filter((item) => item.quoteType === 'EQUITY' || item.quoteType === 'ETF' || item.quoteType === 'MUTUALFUND')
      .map((item) => ({
        symbol: item.symbol as string,
        name: (item.shortname ?? item.longname) as string,
        exchange: item.exchDisp,
      }))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    res.status(200).json({ results })
  } catch (err) {
    res.status(502).json({
      error: 'stock search failed',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
