import type { Holding } from '../types'
import { calcProfitLoss, formatCurrency, formatPercent } from '../utils/calculations'

interface Props {
  holding: Holding
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function HoldingCard({ holding, onEdit, onDelete }: Props) {
  const { cost, current, amount, rate } = calcProfitLoss(holding)
  const isProfit = amount >= 0

  return (
    <div className="holding-card">
      <div className="holding-header">
        <div>
          <span className="holding-name">{holding.name}</span>
          {holding.ticker && <span className="holding-ticker">{holding.ticker}</span>}
        </div>
        <span className={`nisa-badge ${holding.nisaType}`}>
          {holding.nisaType === 'growth' ? '成長' : 'つみたて'}
        </span>
      </div>

      <div className="holding-prices">
        <div className="price-row">
          <span className="label">取得価額</span>
          <span>{formatCurrency(cost)}</span>
        </div>
        <div className="price-row">
          <span className="label">評価額</span>
          <span>{formatCurrency(current)}</span>
        </div>
        <div className={`price-row profit ${isProfit ? 'positive' : 'negative'}`}>
          <span className="label">損益</span>
          <span>{formatCurrency(amount)} ({formatPercent(rate)})</span>
        </div>
      </div>

      <div className="holding-detail">
        <span>{holding.quantity}口 × {formatCurrency(holding.purchasePrice)}</span>
        <span className="purchase-date">{holding.purchaseDate}</span>
      </div>

      <div className="holding-actions">
        <button className="btn-icon" onClick={() => onEdit(holding.id)} aria-label="編集">編集</button>
        <button className="btn-icon danger" onClick={() => onDelete(holding.id)} aria-label="削除">削除</button>
      </div>
    </div>
  )
}
