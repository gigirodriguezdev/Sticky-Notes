import { createContext } from 'react'

export interface DropZone {
  id: string
  getRect: () => DOMRect | null
  onDrop: (draggingId: string) => void
}

export interface DropZoneRegistry {
  register: (zone: DropZone) => () => void
  resolveDrop: (point: { x: number; y: number }, draggingId: string) => boolean
}

export const DropZoneContext = createContext<DropZoneRegistry | null>(null)
