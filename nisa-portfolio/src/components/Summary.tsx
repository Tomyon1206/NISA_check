import { formatCurrency, formatPercent } from '../utils/calculations'

interface Props {
  totalCost: number
  totalCurrent: number
  totalProfitLoss: number
  totalRate: number
}

export function Summary({ totalCost, totalCurrent, totalProfitLoss, totalRate }: Props) {
  const isProfit = totalProfitLoss >= 0

  return (
    <section className="summary card">
      <h2>ポートフォリオ サマリー</h2>
      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">投資額合計</span>
          <span className="summary-value">{formatCurrency(totalCost)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">評価額合計</span>
          <span className="summary-value">{formatCurrency(totalCurrent)}</span>
        </div>
        <div className={`summary-item highlight ${isProfit ? 'positive' : 'negative'}`}>
          <span className="summary-label">損益</span>
          <span className="summary-value large">
            {formatCurrency(totalProfitLoss)}
          </span>
          <span className="summary-rate">{formatPercent(totalRate)}</span>
        </div>
      </div>
    </section>
  )
}
