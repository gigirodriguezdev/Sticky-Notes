import { useCallback, useRef } from 'react'
import { DRAG_THRESHOLD_PX } from '@constants/notes'

interface PointerDragCallbacks {
  onStart?: () => void
  onMove: (deltaX: number, deltaY: number) => void
  onEnd?: (point: { clientX: number; clientY: number }) => void
  onClick?: () => void
}

/**
 * Low-level mouse drag primitive. Tracks delta from mousedown and invokes
 * callbacks. Used as the base for both note dragging and resizing — keeps
 * pointer plumbing in a single place so both stay consistent.
 *
 * `onClick` fires on mouseup when the threshold was never crossed (i.e. the
 * user clicked without dragging). `onEnd` only fires after a real drag.
 */
export function usePointerDrag({ onStart, onMove, onEnd, onClick }: PointerDragCallbacks) {
  const startMouse = useRef({ x: 0, y: 0 })
  const hasStarted = useRef(false)

  return useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      startMouse.current = { x: event.clientX, y: event.clientY }
      hasStarted.current = false

      const handleMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startMouse.current.x
        const deltaY = e.clientY - startMouse.current.y

        if (
          !hasStarted.current &&
          Math.abs(deltaX) < DRAG_THRESHOLD_PX &&
          Math.abs(deltaY) < DRAG_THRESHOLD_PX
        ) {
          return
        }

        if (!hasStarted.current) {
          hasStarted.current = true
          onStart?.()
        }

        onMove(deltaX, deltaY)
      }

      const handleUp = (e: MouseEvent) => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
        if (hasStarted.current) {
          onEnd?.({ clientX: e.clientX, clientY: e.clientY })
        } else {
          onClick?.()
        }
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    },
    [onStart, onMove, onEnd, onClick],
  )
}
