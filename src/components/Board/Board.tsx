import { useCallback, useEffect } from 'react'
import { useNotes } from '@hooks/useNotes'
import { useNotesSync } from '@hooks/useNotesSync'
import { notesApi } from '@services/notesApi'
import { ActionType } from '@app-types/index'
import type { Note as NoteType } from '@app-types/index'
import { getNextZIndex } from '@context/notesReducer'
import { DEFAULT_NOTE_COLOR, DEFAULT_NOTE_SIZE } from '@constants/notes'
import { Note } from '@components/Note/Note'
import styles from './Board.module.css'

export function Board() {
  const { notes, dispatch } = useNotes()
  const { createNote } = useNotesSync()

  useEffect(() => {
    let cancelled = false
    notesApi.getNotes().then((loaded) => {
      if (!cancelled) {
        dispatch({ type: ActionType.LOAD_NOTES, payload: loaded })
      }
    })
    return () => {
      cancelled = true
    }
  }, [dispatch])

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return

      const rect = event.currentTarget.getBoundingClientRect()
      const localX = event.clientX - rect.left
      const localY = event.clientY - rect.top

      const note: NoteType = {
        id: crypto.randomUUID(),
        x: localX - DEFAULT_NOTE_SIZE / 2,
        y: localY - DEFAULT_NOTE_SIZE / 2,
        width: DEFAULT_NOTE_SIZE,
        height: DEFAULT_NOTE_SIZE,
        text: '',
        color: DEFAULT_NOTE_COLOR,
        zIndex: getNextZIndex(notes),
      }

      void createNote(note)
    },
    [notes, createNote],
  )

  return (
    <div className={styles.board} onDoubleClick={handleDoubleClick}>
      {notes.map((note) => (
        <Note key={note.id} note={note} />
      ))}
    </div>
  )
}
