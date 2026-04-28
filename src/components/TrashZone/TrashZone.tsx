import { useCallback } from 'react'
import { useNotes } from '@hooks/useNotes'
import { useNotesSync } from '@hooks/useNotesSync'
import { useDropZone } from '@hooks/useDropZone'
import styles from './TrashZone.module.css'

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

export function TrashZone() {
  const { draggingId } = useNotes()
  const { deleteNote } = useNotesSync()

  const handleDrop = useCallback(
    (id: string) => {
      void deleteNote(id)
    },
    [deleteNote],
  )

  const ref = useDropZone<HTMLDivElement>(handleDrop)
  const isActive = draggingId !== null

  return (
    <div
      ref={ref}
      className={`${styles.dropArea} ${isActive ? styles.active : ''}`}
      aria-hidden={!isActive}
    >
      <div className={styles.pill}>
        <span className={styles.icon}>
          <TrashIcon />
        </span>
        <span className={styles.label}>{isActive ? 'Drop to delete' : 'Trash'}</span>
      </div>
    </div>
  )
}
