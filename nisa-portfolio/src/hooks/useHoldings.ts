import { useState, useCallback } from 'react'
import type { Holding } from '../types'

const STORAGE_KEY = 'nisa-portfolio-holdings'

function loadFromStorage(): Holding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Holding[]) : []
  } catch {
    return []
  }
}

function saveToStorage(holdings: Holding[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
}

export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>(loadFromStorage)

  const addHolding = useCallback((holding: Omit<Holding, 'id'>) => {
    setHoldings((prev) => {
      const next = [...prev, { ...holding, id: crypto.randomUUID() }]
      saveToStorage(next)
      return next
    })
  }, [])

  const updateHolding = useCallback((id: string, updates: Partial<Omit<Holding, 'id'>>) => {
    setHoldings((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
      saveToStorage(next)
      return next
    })
  }, [])

  const removeHolding = useCallback((id: string) => {
    setHoldings((prev) => {
      const next = prev.filter((h) => h.id !== id)
      saveToStorage(next)
      return next
    })
  }, [])

  /**
   * インポートしたデータを取り込む。
   * mode: 'replace' で既存データを置き換え、'merge' で既存データに追加する。
   * どちらの場合もID衝突を避けるためIDを振り直す。
   */
  const importHoldings = useCallback((imported: Holding[], mode: 'replace' | 'merge') => {
    setHoldings((prev) => {
      const withNewIds = imported.map((h) => ({ ...h, id: crypto.randomUUID() }))
      const next = mode === 'replace' ? withNewIds : [...prev, ...withNewIds]
      saveToStorage(next)
      return next
    })
  }, [])

  return { holdings, addHolding, updateHolding, removeHolding, importHoldings }
}
