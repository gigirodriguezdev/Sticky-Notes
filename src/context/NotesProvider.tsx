import { useReducer, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { NotesContext } from '@context/NotesContext'
import { notesReducer, initialState } from '@context/notesReducer'

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, dispatch] = useReducer(notesReducer, initialState)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const value = useMemo(
    () => ({ notes, dispatch, draggingId, setDraggingId }),
    [notes, draggingId],
  )

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}
