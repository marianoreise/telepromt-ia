import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionTimer } from '../useSessionTimer'

describe('useSessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial secondsLeft equal to initialSeconds', () => {
    const { result } = renderHook(() =>
      useSessionTimer({ initialSeconds: 120, onExpire: vi.fn() })
    )
    expect(result.current.secondsLeft).toBe(120)
    expect(result.current.isExpired).toBe(false)
  })

  it('formats time correctly as MM:SS', () => {
    const { result } = renderHook(() =>
      useSessionTimer({ initialSeconds: 125, onExpire: vi.fn() })
    )
    // 125s → 2m 05s → "02:05"
    expect(result.current.formattedTime).toBe('02:05')
  })

  it('formats single-digit minutes and seconds with leading zeros', () => {
    const { result } = renderHook(() =>
      useSessionTimer({ initialSeconds: 65, onExpire: vi.fn() })
    )
    expect(result.current.formattedTime).toBe('01:05')
  })

  it('counts down by 1 each second', () => {
    const { result } = renderHook(() =>
      useSessionTimer({ initialSeconds: 10, onExpire: vi.fn() })
    )
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.secondsLeft).toBe(7)
  })

  it('calls onExpire when timer reaches 0', () => {
    const onExpire = vi.fn()
    renderHook(() => useSessionTimer({ initialSeconds: 3, onExpire }))
    act(() => { vi.advanceTimersByTime(3000) })
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('sets isExpired to true when timer reaches 0', () => {
    const { result } = renderHook(() =>
      useSessionTimer({ initialSeconds: 2, onExpire: vi.fn() })
    )
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.secondsLeft).toBe(0)
    expect(result.current.isExpired).toBe(true)
  })

  it('calls onExpire immediately when initialSeconds is 0', () => {
    const onExpire = vi.fn()
    renderHook(() => useSessionTimer({ initialSeconds: 0, onExpire }))
    // onExpire triggered in the effect synchronously at mount
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('does not tick below 0', () => {
    const { result } = renderHook(() =>
      useSessionTimer({ initialSeconds: 1, onExpire: vi.fn() })
    )
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current.secondsLeft).toBe(0)
  })

  it('shows 00:00 when expired', () => {
    const { result } = renderHook(() =>
      useSessionTimer({ initialSeconds: 1, onExpire: vi.fn() })
    )
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.formattedTime).toBe('00:00')
  })
})
