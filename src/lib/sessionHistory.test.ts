import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearSessionHistory,
  loadSessionHistory,
  saveSessionHistoryEntry,
} from './sessionHistory'

const memory = new Map<string, string>()

function installLocalStorageMock() {
  memory.clear()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, String(value))
      },
      removeItem: (key: string) => {
        memory.delete(key)
      },
    },
  })
}

describe('sessionHistory', () => {
  beforeEach(() => {
    installLocalStorageMock()
    clearSessionHistory()
  })

  it('ignores sessions shorter than 15 seconds', () => {
    const next = saveSessionHistoryEntry({
      durationMs: 5_000,
      goodPercent: 80,
      alertCount: 0,
      averageScore: 90,
    })
    expect(next).toEqual([])
    expect(loadSessionHistory()).toEqual([])
  })

  it('stores recent sessions newest first', () => {
    saveSessionHistoryEntry({
      durationMs: 30_000,
      goodPercent: 70,
      alertCount: 1,
      averageScore: 75,
    })
    saveSessionHistoryEntry({
      durationMs: 45_000,
      goodPercent: 90,
      alertCount: 0,
      averageScore: 88,
    })

    const history = loadSessionHistory()
    expect(history).toHaveLength(2)
    expect(history[0]?.goodPercent).toBe(90)
    expect(history[1]?.goodPercent).toBe(70)
  })
})
