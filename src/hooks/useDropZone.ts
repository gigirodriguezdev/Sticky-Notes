import { useEffect, useId, useRef } from 'react'
import { useDropZoneRegistry } from '@hooks/useDropZoneRegistry'

export function useDropZone<T extends HTMLElement>(onDrop: (draggingId: string) => void) {
  const { register } = useDropZoneRegistry()
  const ref = useRef<T | null>(null)
  const onDropRef = useRef(onDrop)
  const id = useId()

  useEffect(() => {
    onDropRef.current = onDrop
  }, [onDrop])

  useEffect(() => {
    return register({
      id,
      getRect: () => ref.current?.getBoundingClientRect() ?? null,
      onDrop: (draggingId) => onDropRef.current(draggingId),
    })
  }, [register, id])

  return ref
}
