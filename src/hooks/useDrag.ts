import { useCallback, useRef } from 'react'
import { useNotes } from '@hooks/useNotes'
import { useDropZoneRegistry } from '@hooks/useDropZoneRegistry'
import { usePointerDrag } from '@hooks/usePointerDrag'

interface UseDragProps {
  id: string
  initialX: number
  initialY: number
  onMove: (x: number, y: number) => void
  onCommit?: (x: number, y: number) => void
  onClick?: () => void
}

export function useDrag({ id, initialX, initialY, onMove, onCommit, onClick }: UseDragProps) {
  const { setDraggingId } = useNotes()
  const { resolveDrop } = useDropZoneRegistry()
  const lastPos = useRef({ x: initialX, y: initialY })

  const handleStart = useCallback(() => {
    lastPos.current = { x: initialX, y: initialY }
    setDraggingId(id)
  }, [setDraggingId, id, initialX, initialY])

  const handleMove = useCallback(
    (deltaX: number, deltaY: number) => {
      const x = initialX + deltaX
      const y = initialY + deltaY
      lastPos.current = { x, y }
      onMove(x, y)
    },
    [onMove, initialX, initialY],
  )

  const handleEnd = useCallback(
    ({ clientX, clientY }: { clientX: number; clientY: number }) => {
      setDraggingId(null)
      const consumed = resolveDrop({ x: clientX, y: clientY }, id)
      if (!consumed) {
        onCommit?.(lastPos.current.x, lastPos.current.y)
      }
    },
    [setDraggingId, resolveDrop, id, onCommit],
  )

  return usePointerDrag({
    onStart: handleStart,
    onMove: handleMove,
    onEnd: handleEnd,
    onClick,
  })
}
