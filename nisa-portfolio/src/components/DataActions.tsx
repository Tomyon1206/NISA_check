import { useRef, useState } from 'react'
import type { Holding } from '../types'
import { parseHoldingsJson } from '../utils/holdingsIO'
import { downloadJson, readTextFile } from '../utils/io'

interface Props {
  holdings: Holding[]
  onImport: (holdings: Holding[], mode: 'replace' | 'merge') => void
}

export function DataActions({ holdings, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function handleExport() {
    const today = new Date().toISOString().slice(0, 10)
    downloadJson(`nisa-portfolio-${today}.json`, holdings)
  }

  function handleImportClick() {
    setError(null)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const text = await readTextFile(file)
      const imported = parseHoldingsJson(text)
      const replace = confirm(
        `${imported.length}件のデータを読み込みます。\nOK：既存データを置き換える／キャンセル：既存データに追加する`,
      )
      onImport(imported, replace ? 'replace' : 'merge')
    } catch {
      setError('ファイルの読み込みに失敗しました。書き出したJSON形式か確認してください。')
    }
  }

  return (
    <div className="data-actions">
      <button className="btn-secondary" onClick={handleExport} disabled={holdings.length === 0}>
        書き出し
      </button>
      <button className="btn-secondary" onClick={handleImportClick}>
        読み込み
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="visually-hidden"
        onChange={handleFileChange}
      />
      {error && <p className="error">{error}</p>}
    </div>
  )
}
