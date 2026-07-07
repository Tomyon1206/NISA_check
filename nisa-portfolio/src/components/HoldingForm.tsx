import { useMemo, useState } from 'react'
import type { Holding, NisaType } from '../types'
import { calcProjectedNisaUsage, formatCurrency, isOverNisaLimit } from '../utils/calculations'
import { fetchCurrentPrice } from '../utils/priceApi'

interface Props {
  existingHoldings: Holding[]
  onAdd: (holding: Omit<Holding, 'id'>) => void
  onCancel: () => void
}

const defaultForm = {
  name: '',
  ticker: '',
  nisaType: 'growth' as NisaType,
  quantity: '',
  purchasePrice: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
}

export function HoldingForm({ existingHoldings, onAdd, onCancel }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<Partial<typeof defaultForm>>({})
  const [submitting, setSubmitting] = useState(false)
  const [priceNotice, setPriceNotice] = useState<string | null>(null)

  const nisaWarning = useMemo(() => {
    const quantity = Number(form.quantity)
    const purchasePrice = Number(form.purchasePrice)
    if (!Number.isFinite(quantity) || !Number.isFinite(purchasePrice) || quantity <= 0 || purchasePrice <= 0) {
      return null
    }
    const year = new Date(form.purchaseDate || Date.now()).getFullYear()
    const projected = calcProjectedNisaUsage(existingHoldings, year, {
      nisaType: form.nisaType,
      amount: quantity * purchasePrice,
    })
    const over = isOverNisaLimit(projected)
    if (over.total) return `この取引を追加すると合計枠（${formatCurrency(3_600_000)}）を超過します`
    if (form.nisaType === 'growth' && over.growth) return `この取引を追加すると成長投資枠を超過します`
    if (form.nisaType === 'tsumitate' && over.tsumitate) return `この取引を追加すると、つみたて投資枠を超過します`
    return null
  }, [existingHoldings, form.nisaType, form.purchaseDate, form.purchasePrice, form.quantity])

  function validate() {
    const e: Partial<typeof defaultForm> = {}
    if (!form.name.trim()) e.name = '銘柄名は必須です'
    if (!form.quantity || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) <= 0) {
      e.quantity = '1以上の整数を入力してください'
    }
    if (!form.purchasePrice || Number(form.purchasePrice) <= 0) e.purchasePrice = '正の数を入力してください'
    if (!form.purchaseDate) e.purchaseDate = '日付は必須です'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setPriceNotice(null)

    const purchasePrice = Number(form.purchasePrice)
    let currentPrice = purchasePrice

    if (form.ticker.trim()) {
      try {
        currentPrice = await fetchCurrentPrice(form.ticker)
      } catch (err) {
        setPriceNotice(
          `現在値の自動取得に失敗したため、購入単価を仮の現在値として設定しました（${err instanceof Error ? err.message : '不明なエラー'}）`,
        )
      }
    } else {
      setPriceNotice('ティッカー/コード未入力のため、購入単価を仮の現在値として設定しました')
    }

    onAdd({
      name: form.name.trim(),
      ticker: form.ticker.trim(),
      nisaType: form.nisaType,
      quantity: Number(form.quantity),
      purchasePrice,
      currentPrice,
      purchaseDate: form.purchaseDate,
    })
    setForm(defaultForm)
    setSubmitting(false)
  }

  function field(label: string, key: keyof typeof defaultForm, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
      <div className="form-field">
        <label htmlFor={key}>{label}</label>
        <input
          id={key}
          type={type}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          {...extra}
        />
        {errors[key] && <span className="error">{errors[key]}</span>}
      </div>
    )
  }

  return (
    <form className="holding-form" onSubmit={handleSubmit}>
      <h2>銘柄を追加</h2>
      {field('銘柄名 *', 'name')}
      {field('ティッカー / コード', 'ticker', 'text', { placeholder: '例: 7203（現在値の自動取得に使用）' })}
      <div className="form-field">
        <label htmlFor="nisaType">NISA種別</label>
        <select
          id="nisaType"
          value={form.nisaType}
          onChange={(e) => setForm((f) => ({ ...f, nisaType: e.target.value as NisaType }))}
        >
          <option value="growth">成長投資枠</option>
          <option value="tsumitate">つみたて投資枠</option>
        </select>
      </div>
      {field('数量（整数）*', 'quantity', 'number', { min: '1', step: '1', inputMode: 'numeric' })}
      {field('購入単価（円）*', 'purchasePrice', 'number', { min: '0.01', step: '0.01' })}
      {field('購入日 *', 'purchaseDate', 'date')}

      {nisaWarning && <p className="form-warning" role="alert">⚠ {nisaWarning}</p>}
      {priceNotice && <p className="form-warning" role="status">{priceNotice}</p>}

      <p className="progress-remaining">
        現在値は追加時に自動取得します（取得できない場合は購入単価を仮設定します）
      </p>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>キャンセル</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '取得中…' : '追加する'}
        </button>
      </div>
    </form>
  )
}
