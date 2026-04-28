import { useCallback, useEffect, useRef } from 'react'
import { useNotes } from '@hooks/useNotes'
import { notesApi } from '@services/notesApi'
import { ActionType } from '@app-types/index'
import type { Note } from '@app-types/index'

export function useNotesSync() {
  const { notes, dispatch } = useNotes()
  const notesRef = useRef(notes)

  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  const findNote = useCallback(
    (id: string) => notesRef.current.find((n) => n.id === id),
    [],
  )

  const createNote = useCallback(
    async (note: Note) => {
      dispatch({ type: ActionType.ADD_NOTE, payload: note })
      try {
        await notesApi.saveNote(note)
      } catch (error) {
        console.error('[useNotesSync] saveNote failed, rolling back', error)
        dispatch({ type: ActionType.DELETE_NOTE, payload: note.id })
      }
    },
    [dispatch],
  )

  const deleteNote = useCallback(
    async (id: string) => {
      const previous = findNote(id)
      dispatch({ type: ActionType.DELETE_NOTE, payload: id })
      try {
        await notesApi.deleteNote(id)
      } catch (error) {
        console.error('[useNotesSync] deleteNote failed, rolling back', error)
        if (previous) dispatch({ type: ActionType.ADD_NOTE, payload: previous })
      }
    },
    [dispatch, findNote],
  )

  const persistNote = useCallback(async (note: Note) => {
    try {
      await notesApi.updateNote(note)
    } catch (error) {
      console.error('[useNotesSync] updateNote failed', error)
    }
  }, [])

  const bringNoteToFront = useCallback(
    (id: string) => {
      const target = findNote(id)
      if (!target) return

      const maxZ = notesRef.current.reduce((acc, n) => (n.zIndex > acc ? n.zIndex : acc), 0)
      if (target.zIndex === maxZ) return

      dispatch({ type: ActionType.BRING_TO_FRONT, payload: id })
      void persistNote({ ...target, zIndex: maxZ + 1 })
    },
    [dispatch, persistNote, findNote],
  )

  const changeNoteColor = useCallback(
    (id: string, color: string) => {
      const target = findNote(id)
      if (!target || target.color === color) return

      dispatch({ type: ActionType.CHANGE_COLOR, payload: { id, color } })
      void persistNote({ ...target, color })
    },
    [dispatch, persistNote, findNote],
  )

  return { createNote, deleteNote, persistNote, bringNoteToFront, changeNoteColor }
}
