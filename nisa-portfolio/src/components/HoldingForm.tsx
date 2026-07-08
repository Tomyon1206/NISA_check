import { useEffect, useMemo, useRef, useState } from 'react'
import type { Holding, NisaType } from '../types'
import { calcProjectedNisaUsage, formatCurrency, isOverNisaLimit } from '../utils/calculations'
import { fetchCurrentPrice, fetchHistoricalPrice, searchTickers, type TickerSearchResult } from '../utils/priceApi'

interface Props {
  existingHoldings: Holding[]
  editingHolding?: Holding | null
  onAdd: (holding: Omit<Holding, 'id'>) => void
  onCancel: () => void
}

const defaultDetails = {
  nisaType: 'growth' as NisaType,
  quantity: '',
  purchasePrice: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
}

export function HoldingForm({ existingHoldings, editingHolding, onAdd, onCancel }: Props) {
  // 銘柄検索・選択（編集時は編集対象の銘柄を初期選択状態にしておく）
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TickerSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selected, setSelected] = useState<TickerSearchResult | null>(
    editingHolding ? { symbol: editingHolding.ticker, name: editingHolding.name } : null,
  )
  const debounceRef = useRef<number | undefined>(undefined)

  // 数量等の入力（編集時は既存の値を初期値として引き継ぐ）
  const [details, setDetails] = useState(
    editingHolding
      ? {
          nisaType: editingHolding.nisaType,
          quantity: String(editingHolding.quantity),
          purchasePrice: String(editingHolding.purchasePrice),
          purchaseDate: editingHolding.purchaseDate,
        }
      : defaultDetails,
  )
  const [errors, setErrors] = useState<Partial<typeof defaultDetails>>({})
  const [submitting, setSubmitting] = useState(false)
  const [priceNotice, setPriceNotice] = useState<string | null>(null)

  // 購入日の終値の自動取得（銘柄・購入日が編集時の初期値のまま変わっていない間はスキップし、
  // 既存の購入単価を上書きしないようにする）
  const [fetchingHistorical, setFetchingHistorical] = useState(false)
  const [historicalNotice, setHistoricalNotice] = useState<string | null>(null)
  const [historicalError, setHistoricalError] = useState<string | null>(null)
  const initialSignatureRef = useRef(
    editingHolding ? `${editingHolding.ticker}|${editingHolding.purchaseDate}` : null,
  )

  useEffect(() => {
    if (selected) return
    if (!query.trim()) {
      setResults([])
      setSearchError(null)
      setSearching(false)
      return
    }
    setSearching(true)
    setSearchError(null)
    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await searchTickers(query)
        setResults(r)
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : '検索に失敗しました')
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => window.clearTimeout(debounceRef.current)
  }, [query, selected])

  useEffect(() => {
    if (!selected || !details.purchaseDate) return

    const signature = `${selected.symbol}|${details.purchaseDate}`
    if (initialSignatureRef.current === signature) {
      // 編集時の初期値（銘柄・購入日とも未変更）なら、既存の購入単価を保持する
      return
    }

    let cancelled = false
    setFetchingHistorical(true)
    setHistoricalError(null)
    setHistoricalNotice(null)

    fetchHistoricalPrice(selected.symbol, details.purchaseDate)
      .then((result) => {
        if (cancelled) return
        setDetails((f) => ({ ...f, purchasePrice: String(result.price) }))
        setHistoricalNotice(
          result.matchedDate === details.purchaseDate
            ? `購入日の終値（${formatCurrency(result.price)}）を自動取得しました`
            : `指定日は非営業日のため、直近の取引日（${result.matchedDate}）の終値（${formatCurrency(result.price)}）を取得しました`,
        )
      })
      .catch((err) => {
        if (cancelled) return
        setHistoricalError(err instanceof Error ? err.message : '購入日の終値取得に失敗しました。手動で入力してください')
      })
      .finally(() => {
        if (!cancelled) setFetchingHistorical(false)
      })

    return () => { cancelled = true }
  }, [selected, details.purchaseDate])

  const nisaWarning = useMemo(() => {
    const quantity = Number(details.quantity)
    const purchasePrice = Number(details.purchasePrice)
    if (!Number.isFinite(quantity) || !Number.isFinite(purchasePrice) || quantity <= 0 || purchasePrice <= 0) {
      return null
    }
    const year = new Date(details.purchaseDate || Date.now()).getFullYear()
    const projected = calcProjectedNisaUsage(existingHoldings, year, {
      nisaType: details.nisaType,
      amount: quantity * purchasePrice,
    })
    const over = isOverNisaLimit(projected)
    if (over.total) return `この取引を追加すると合計枠（${formatCurrency(3_600_000)}）を超過します`
    if (details.nisaType === 'growth' && over.growth) return `この取引を追加すると成長投資枠を超過します`
    if (details.nisaType === 'tsumitate' && over.tsumitate) return `この取引を追加すると、つみたて投資枠を超過します`
    return null
  }, [existingHoldings, details.nisaType, details.purchaseDate, details.purchasePrice, details.quantity])

  function validate() {
    const e: Partial<typeof defaultDetails> = {}
    if (!details.quantity || !Number.isInteger(Number(details.quantity)) || Number(details.quantity) <= 0) {
      e.quantity = '1以上の整数を入力してください'
    }
    if (!details.purchasePrice || Number(details.purchasePrice) <= 0) e.purchasePrice = '正の数を入力してください'
    if (!details.purchaseDate) e.purchaseDate = '日付は必須です'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) {
      setSearchError('銘柄を検索して選択してください')
      return
    }
    if (!validate()) return

    setSubmitting(true)
    setPriceNotice(null)

    const purchasePrice = Number(details.purchasePrice)
    let currentPrice = purchasePrice

    try {
      currentPrice = await fetchCurrentPrice(selected.symbol)
    } catch (err) {
      setPriceNotice(
        `現在値の自動取得に失敗したため、購入単価を仮の現在値として設定しました（${err instanceof Error ? err.message : '不明なエラー'}）`,
      )
    }

    onAdd({
      name: selected.name,
      ticker: selected.symbol,
      nisaType: details.nisaType,
      quantity: Number(details.quantity),
      purchasePrice,
      currentPrice,
      purchaseDate: details.purchaseDate,
    })

    setQuery('')
    setSelected(null)
    setResults([])
    setDetails(defaultDetails)
    setSubmitting(false)
  }

  function field(label: string, key: keyof typeof defaultDetails, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
      <div className="form-field">
        <label htmlFor={key}>{label}</label>
        <input
          id={key}
          type={type}
          value={details[key]}
          onChange={(e) => setDetails((f) => ({ ...f, [key]: e.target.value }))}
          {...extra}
        />
        {errors[key] && <span className="error">{errors[key]}</span>}
      </div>
    )
  }

  return (
    <form className="holding-form" onSubmit={handleSubmit}>
      <h2>{editingHolding ? '銘柄を編集' : '銘柄を追加'}</h2>

      <div className="form-field">
        <label htmlFor="stock-search">銘柄検索（銘柄名 or ティッカー）*</label>
        <input
          id="stock-search"
          type="text"
          value={selected ? `${selected.name}（${selected.symbol}）` : query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
          placeholder="例: トヨタ または 7203"
          disabled={submitting}
          readOnly={!!selected}
        />
        {searching && <span className="search-status">検索中…</span>}
        {searchError && <span className="error">{searchError}</span>}
        {!selected && results.length > 0 && (
          <ul className="search-results">
            {results.map((r) => (
              <li key={r.symbol}>
                <button
                  type="button"
                  onClick={() => { setSelected(r); setQuery(''); setResults([]); setSearchError(null) }}
                >
                  <span className="search-result-name">{r.name}</span>
                  <span className="search-result-symbol">{r.symbol}{r.exchange ? ` ・ ${r.exchange}` : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <>
          <div className="selected-ticker">
            <div>
              <strong>{selected.name}</strong>
              <span className="holding-ticker">{selected.symbol}</span>
            </div>
            <button type="button" className="btn-secondary" onClick={() => setSelected(null)} disabled={submitting}>
              変更
            </button>
          </div>

          <div className="form-field">
            <label htmlFor="nisaType">NISA種別</label>
            <select
              id="nisaType"
              value={details.nisaType}
              onChange={(e) => setDetails((f) => ({ ...f, nisaType: e.target.value as NisaType }))}
            >
              <option value="growth">成長投資枠</option>
              <option value="tsumitate">つみたて投資枠</option>
            </select>
          </div>

          {field('購入日 *', 'purchaseDate', 'date')}

          {field('購入単価（円）* （購入日の終値を自動取得）', 'purchasePrice', 'number', { min: '0.01', step: '0.01' })}
          {fetchingHistorical && <span className="search-status">購入日の終値を取得中…</span>}
          {historicalNotice && <p className="form-hint">{historicalNotice}</p>}
          {historicalError && <span className="error">{historicalError}</span>}

          {field('数量（口）*', 'quantity', 'number', { min: '1', step: '1', inputMode: 'numeric' })}

          {nisaWarning && <p className="form-warning" role="alert">⚠ {nisaWarning}</p>}
          {priceNotice && <p className="form-warning" role="status">{priceNotice}</p>}

          <p className="progress-remaining">
            現在値は追加時に自動取得します（取得できない場合は購入単価を仮設定します）
          </p>
        </>
      )}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>キャンセル</button>
        <button type="submit" className="btn-primary" disabled={submitting || !selected}>
          {submitting ? '取得中…' : editingHolding ? '更新する' : '追加する'}
        </button>
      </div>
    </form>
  )
}
