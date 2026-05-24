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

  return { holdings, addHolding, updateHolding, removeHolding }
}
