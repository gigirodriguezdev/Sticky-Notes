import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedCallback } from '@hooks/useDebouncedCallback'

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not invoke before the delay elapses', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(fn, 200))

    act(() => result.current('a'))
    act(() => vi.advanceTimersByTime(199))

    expect(fn).not.toHaveBeenCalled()
  })

  it('invokes once after the delay with the latest arguments', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(fn, 200))

    act(() => result.current('a'))
    act(() => vi.advanceTimersByTime(200))

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('a')
  })

  it('resets the timer on subsequent calls (only the last call fires)', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(fn, 200))

    act(() => result.current('a'))
    act(() => vi.advanceTimersByTime(150))
    act(() => result.current('b'))
    act(() => vi.advanceTimersByTime(150))

    expect(fn).not.toHaveBeenCalled() // 150 + 150 = 300 total but the second call reset

    act(() => vi.advanceTimersByTime(50))
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('b')
  })

  it('uses the latest callback reference even if it changes between calls', () => {
    const first = vi.fn()
    const second = vi.fn()

    const { result, rerender } = renderHook(
      ({ cb }: { cb: (x: string) => void }) => useDebouncedCallback(cb, 200),
      { initialProps: { cb: first } },
    )

    act(() => result.current('hello'))
    rerender({ cb: second })
    act(() => vi.advanceTimersByTime(200))

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('hello')
  })

  it('flush() cancels a pending invocation', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(fn, 200))

    act(() => result.current('a'))
    act(() => result.current.flush())
    act(() => vi.advanceTimersByTime(500))

    expect(fn).not.toHaveBeenCalled()
  })

  it('cleans up pending invocations on unmount', () => {
    const fn = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 200))

    act(() => result.current('a'))
    unmount()
    act(() => vi.advanceTimersByTime(500))

    expect(fn).not.toHaveBeenCalled()
  })
})
