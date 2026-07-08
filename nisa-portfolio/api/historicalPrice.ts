// Vercel Serverless Function: /api/historicalPrice?ticker=7203.T&date=2026-01-15
//
// 指定日（取引がない土日・祝日の場合は直近の取引日）の終値を取得する。
// HoldingFormで購入日を入力・変更した際に、購入単価の初期値として使う。
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
  const rawTicker = req.query.ticker
  const ticker = Array.isArray(rawTicker) ? rawTicker[0] : rawTicker
  const rawDate = req.query.date
  const dateStr = Array.isArray(rawDate) ? rawDate[0] : rawDate

  if (!ticker || !ticker.trim()) {
    res.status(400).json({ error: 'ticker is required' })
    return
  }
  if (!dateStr || Number.isNaN(Date.parse(dateStr))) {
    res.status(400).json({ error: 'date (YYYY-MM-DD) is required' })
    return
  }

  const symbol = /\.[A-Za-z]+$/.test(ticker) ? ticker : `${ticker}.T`

  // 対象日を含む直近10日分を取得し、対象日以前で最新の終値を採用する（非営業日対策）
  const target = new Date(`${dateStr}T00:00:00Z`)
  const period2 = Math.floor(target.getTime() / 1000) + 24 * 60 * 60
  const period1 = period2 - 10 * 24 * 60 * 60

  try {
    const upstream = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; nisa-portfolio/1.0)' } },
    )

    if (!upstream.ok) {
      res.status(502).json({ error: `upstream error (${upstream.status})` })
      return
    }

    const data = (await upstream.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[]
          indicators?: { quote?: Array<{ close?: Array<number | null> }> }
        }>
      }
    }

    const result = data.chart?.result?.[0]
    const timestamps = result?.timestamp ?? []
    const closes = result?.indicators?.quote?.[0]?.close ?? []

    // 対象日以前で最新の終値を後ろから探す（当日が非営業日なら直近の取引日にフォールバック）
    let price: number | null = null
    let matchedDate: string | null = null
    for (let i = timestamps.length - 1; i >= 0; i -= 1) {
      const close = closes[i]
      if (typeof close === 'number') {
        price = close
        matchedDate = new Date(timestamps[i] * 1000).toISOString().slice(0, 10)
        break
      }
    }

    if (price === null) {
      res.status(404).json({ error: `historical price not found for ${symbol} around ${dateStr}` })
      return
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({ ticker, symbol, date: dateStr, matchedDate, price })
  } catch (err) {
    res.status(502).json({
      error: 'historical price fetch failed',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
