import { useState } from 'react'
import { useHoldings } from './hooks/useHoldings'
import { HoldingCard } from './components/HoldingCard'
import { HoldingForm } from './components/HoldingForm'
import { Summary } from './components/Summary'
import { NisaGauge } from './components/NisaGauge'
import { DataActions } from './components/DataActions'
import { calcPortfolioSummary, calcNisaUsage } from './utils/calculations'
import './index.css'

export default function App() {
  const { holdings, addHolding, updateHolding, removeHolding, importHoldings } = useHoldings()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const year = new Date().getFullYear()
  const summary = calcPortfolioSummary(holdings)
  const nisaUsage = calcNisaUsage(holdings, year)

  function handleEdit(id: string) {
    setEditingId(id)
    setShowForm(true)
  }

  function handleDelete(id: string) {
    if (confirm('この銘柄を削除しますか？')) {
      removeHolding(id)
    }
  }

  function handleFormAdd(holding: Parameters<typeof addHolding>[0]) {
    if (editingId) {
      updateHolding(editingId, holding)
      setEditingId(null)
    } else {
      addHolding(holding)
    }
    setShowForm(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>NISAポートフォリオ</h1>
        <button
          className="btn-primary"
          onClick={() => { setEditingId(null); setShowForm(true) }}
        >
          ＋ 銘柄追加
        </button>
      </header>

      <main className="app-main">
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <HoldingForm
                existingHoldings={holdings.filter((h) => h.id !== editingId)}
                onAdd={handleFormAdd}
                onCancel={() => { setShowForm(false); setEditingId(null) }}
              />
            </div>
          </div>
        )}

        {holdings.length > 0 ? (
          <>
            <Summary {...summary} />
            <NisaGauge growthUsed={nisaUsage.growthUsed} tsumitateUsed={nisaUsage.tsumitateUsed} />
            <section className="holdings-section">
              <h2>保有銘柄</h2>
              <div className="holdings-grid">
                {holdings.map((h) => (
                  <HoldingCard
                    key={h.id}
                    holding={h}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUpdatePrice={(id, price) => updateHolding(id, { currentPrice: price })}
                  />
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state">
            <p>まだ銘柄が登録されていません。</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>最初の銘柄を追加する</button>
          </div>
        )}

        <DataActions holdings={holdings} onImport={importHoldings} />
      </main>
    </div>
  )
}
