import { useState } from 'react'
import type { Holding } from '../types'
import { calcProfitLoss, formatCurrency, formatPercent } from '../utils/calculations'
import { fetchCurrentPrice } from '../utils/priceApi'

interface Props {
  holding: Holding
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onUpdatePrice: (id: string, price: number) => void
}

export function HoldingCard({ holding, onEdit, onDelete, onUpdatePrice }: Props) {
  const { cost, current, amount, rate } = calcProfitLoss(holding)
  const isProfit = amount >= 0
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  async function handleRefreshPrice() {
    if (!holding.ticker.trim()) {
      setStatus('error')
      setStatusMessage('ティッカー/コード未登録のため取得できません')
      return
    }
    setStatus('loading')
    setStatusMessage(null)
    try {
      const price = await fetchCurrentPrice(holding.ticker)
      onUpdatePrice(holding.id, price)
      setStatus('idle')
      setStatusMessage(`更新しました（${formatCurrency(price)}）`)
    } catch (err) {
      setStatus('error')
      setStatusMessage(err instanceof Error ? err.message : '取得に失敗しました')
    }
  }

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
        {statusMessage && (
          <span className={`price-fetch-status ${status === 'error' ? 'error' : ''}`}>{statusMessage}</span>
        )}
        <button
          className="btn-icon"
          onClick={handleRefreshPrice}
          disabled={status === 'loading'}
          aria-label="現在値を更新"
        >
          {status === 'loading' ? '更新中…' : '現在値更新'}
        </button>
        <button className="btn-icon" onClick={() => onEdit(holding.id)} aria-label="編集">編集</button>
        <button className="btn-icon danger" onClick={() => onDelete(holding.id)} aria-label="削除">削除</button>
      </div>
    </div>
  )
}
