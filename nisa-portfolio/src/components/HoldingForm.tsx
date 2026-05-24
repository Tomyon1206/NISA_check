import { useState } from 'react'
import type { Holding, NisaType } from '../types'

interface Props {
  onAdd: (holding: Omit<Holding, 'id'>) => void
  onCancel: () => void
}

const defaultForm = {
  name: '',
  ticker: '',
  nisaType: 'growth' as NisaType,
  quantity: '',
  purchasePrice: '',
  currentPrice: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
}

export function HoldingForm({ onAdd, onCancel }: Props) {
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState<Partial<typeof defaultForm>>({})

  function validate() {
    const e: Partial<typeof defaultForm> = {}
    if (!form.name.trim()) e.name = '銘柄名は必須です'
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = '正の数を入力してください'
    if (!form.purchasePrice || Number(form.purchasePrice) <= 0) e.purchasePrice = '正の数を入力してください'
    if (!form.currentPrice || Number(form.currentPrice) <= 0) e.currentPrice = '正の数を入力してください'
    if (!form.purchaseDate) e.purchaseDate = '日付は必須です'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onAdd({
      name: form.name.trim(),
      ticker: form.ticker.trim(),
      nisaType: form.nisaType,
      quantity: Number(form.quantity),
      purchasePrice: Number(form.purchasePrice),
      currentPrice: Number(form.currentPrice),
      purchaseDate: form.purchaseDate,
    })
    setForm(defaultForm)
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
      {field('ティッカー / コード', 'ticker')}
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
      {field('数量 *', 'quantity', 'number', { min: '0.0001', step: '0.0001' })}
      {field('購入単価（円）*', 'purchasePrice', 'number', { min: '0.01', step: '0.01' })}
      {field('現在値（円）*', 'currentPrice', 'number', { min: '0.01', step: '0.01' })}
      {field('購入日 *', 'purchaseDate', 'date')}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>キャンセル</button>
        <button type="submit" className="btn-primary">追加する</button>
      </div>
    </form>
  )
}
