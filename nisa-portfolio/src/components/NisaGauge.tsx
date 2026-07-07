import { NISA_LIMITS } from '../types'
import { formatCurrency } from '../utils/calculations'

interface Props {
  growthUsed: number
  tsumitateUsed: number
}

function ProgressBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = Math.min((used / limit) * 100, 100)
  const remaining = Math.max(limit - used, 0)
  const isOver = used > limit

  return (
    <div className="progress-bar-wrap">
      <div className="progress-label">
        <span>{label}</span>
        <span className={isOver ? 'over-limit' : ''}>{formatCurrency(used)} / {formatCurrency(limit)}</span>
      </div>
      <div className="progress-track">
        <div
          className={`progress-fill ${isOver ? 'over' : pct > 80 ? 'warning' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isOver ? (
        <p className="progress-error" role="alert">
          ⚠ 上限を{formatCurrency(used - limit)}超過しています
        </p>
      ) : (
        <div className="progress-remaining">
          残り <strong>{formatCurrency(remaining)}</strong>
        </div>
      )}
    </div>
  )
}

export function NisaGauge({ growthUsed, tsumitateUsed }: Props) {
  const totalUsed = growthUsed + tsumitateUsed

  return (
    <section className="nisa-gauge card">
      <h2>NISA枠 使用状況（{new Date().getFullYear()}年）</h2>
      <ProgressBar used={growthUsed} limit={NISA_LIMITS.growth} label="成長投資枠" />
      <ProgressBar used={tsumitateUsed} limit={NISA_LIMITS.tsumitate} label="つみたて投資枠" />
      <ProgressBar used={totalUsed} limit={NISA_LIMITS.total} label="合計" />
    </section>
  )
}
