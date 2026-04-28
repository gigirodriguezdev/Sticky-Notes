import { useContext } from 'react'
import { DropZoneContext } from '@context/DropZoneContext'

export function useDropZoneRegistry() {
  const ctx = useContext(DropZoneContext)
  if (!ctx) throw new Error('useDropZoneRegistry must be used within a DropZoneProvider')
  return ctx
}
