import { useCallback, useRef } from 'react'
import { MIN_NOTE_SIZE } from '@constants/notes'
import { usePointerDrag } from '@hooks/usePointerDrag'

interface UseResizeProps {
  initialWidth: number
  initialHeight: number
  onResize: (width: number, height: number) => void
  onCommit?: (width: number, height: number) => void
}

export function useResize({
  initialWidth,
  initialHeight,
  onResize,
  onCommit,
}: UseResizeProps) {
  const lastSize = useRef({ width: initialWidth, height: initialHeight })

  const handleStart = useCallback(() => {
    lastSize.current = { width: initialWidth, height: initialHeight }
  }, [initialWidth, initialHeight])

  const handleMove = useCallback(
    (deltaX: number, deltaY: number) => {
      const width = Math.max(MIN_NOTE_SIZE, initialWidth + deltaX)
      const height = Math.max(MIN_NOTE_SIZE, initialHeight + deltaY)
      lastSize.current = { width, height }
      onResize(width, height)
    },
    [onResize, initialWidth, initialHeight],
  )

  const handleEnd = useCallback(() => {
    onCommit?.(lastSize.current.width, lastSize.current.height)
  }, [onCommit])

  return usePointerDrag({ onStart: handleStart, onMove: handleMove, onEnd: handleEnd })
}
