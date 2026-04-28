import { createContext } from 'react'
import type { Note, NoteAction } from '@app-types/index'

interface NotesContextType {
  notes: Note[]
  dispatch: React.Dispatch<NoteAction>
  draggingId: string | null
  setDraggingId: (id: string | null) => void
}

export const NotesContext = createContext<NotesContextType | null>(null)
