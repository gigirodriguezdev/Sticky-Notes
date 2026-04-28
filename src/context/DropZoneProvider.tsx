import { useCallback, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { DropZoneContext } from '@context/DropZoneContext'
import type { DropZone, DropZoneRegistry } from '@context/DropZoneContext'

export function DropZoneProvider({ children }: { children: ReactNode }) {
  const zonesRef = useRef<Map<string, DropZone>>(new Map())

  const register = useCallback((zone: DropZone) => {
    zonesRef.current.set(zone.id, zone)
    return () => {
      zonesRef.current.delete(zone.id)
    }
  }, [])

  const resolveDrop = useCallback(
    (point: { x: number; y: number }, draggingId: string) => {
      for (const zone of zonesRef.current.values()) {
        const rect = zone.getRect()
        if (!rect) continue
        const inside =
          point.x >= rect.left &&
          point.x <= rect.right &&
          point.y >= rect.top &&
          point.y <= rect.bottom
        if (inside) {
          zone.onDrop(draggingId)
          return true
        }
      }
      return false
    },
    [],
  )

  const value = useMemo<DropZoneRegistry>(
    () => ({ register, resolveDrop }),
    [register, resolveDrop],
  )

  return <DropZoneContext.Provider value={value}>{children}</DropZoneContext.Provider>
}
