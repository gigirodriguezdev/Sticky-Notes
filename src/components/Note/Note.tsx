import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useDrag } from '@hooks/useDrag'
import { useResize } from '@hooks/useResize'
import { useDebouncedCallback } from '@hooks/useDebouncedCallback'
import { useNotes } from '@hooks/useNotes'
import { useNotesSync } from '@hooks/useNotesSync'
import {
  MINI_TOOLBAR_CLEARANCE_PX,
  NOTE_COLORS,
  TEXT_DEBOUNCE_MS,
} from '@constants/notes'
import { ActionType } from '@app-types/index'
import type { Note as NoteType } from '@app-types/index'
import { sanitizeHtml } from '@utils/sanitizeHtml'
import styles from './Note.module.css'

interface NoteProps {
  note: NoteType
}

type FormatCommand = 'bold' | 'italic' | 'underline'

export const Note = memo(function Note({ note }: NoteProps) {
  const { dispatch, draggingId } = useNotes()
  const { persistNote, bringNoteToFront, changeNoteColor } = useNotesSync()
  const editorRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [livePos, setLivePos] = useState({ x: note.x, y: note.y })
  const [liveSize, setLiveSize] = useState({ width: note.width, height: note.height })
  const isInteractingRef = useRef(false)

  useEffect(() => {
    if (!isInteractingRef.current) {
      setLivePos({ x: note.x, y: note.y })
    }
  }, [note.x, note.y])

  useEffect(() => {
    if (!isInteractingRef.current) {
      setLiveSize({ width: note.width, height: note.height })
    }
  }, [note.width, note.height])

  const debouncedPersist = useDebouncedCallback(persistNote, TEXT_DEBOUNCE_MS)

  const initialTextRef = useRef(note.text)
  useEffect(() => {
    const editor = editorRef.current
    if (editor) editor.innerHTML = initialTextRef.current
  }, [])

  const handleMove = useCallback((x: number, y: number) => {
    isInteractingRef.current = true
    setLivePos({ x, y })
  }, [])

  const handleMoveCommit = useCallback(
    (x: number, y: number) => {
      isInteractingRef.current = false
      dispatch({ type: ActionType.MOVE_NOTE, payload: { id: note.id, x, y } })
      void persistNote({ ...note, x, y })
    },
    [dispatch, persistNote, note],
  )

  const focusEditorAtEnd = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [])

  const handleClick = useCallback(() => {
    setIsEditing(true)
    bringNoteToFront(note.id)
    requestAnimationFrame(focusEditorAtEnd)
  }, [bringNoteToFront, note.id, focusEditorAtEnd])

  const onDragMouseDown = useDrag({
    id: note.id,
    initialX: livePos.x,
    initialY: livePos.y,
    onMove: handleMove,
    onCommit: handleMoveCommit,
    onClick: handleClick,
  })

  const handleResize = useCallback((width: number, height: number) => {
    isInteractingRef.current = true
    setLiveSize({ width, height })
  }, [])

  const handleResizeCommit = useCallback(
    (width: number, height: number) => {
      isInteractingRef.current = false
      dispatch({ type: ActionType.RESIZE_NOTE, payload: { id: note.id, width, height } })
      void persistNote({ ...note, width, height })
    },
    [dispatch, persistNote, note],
  )

  const onResizeMouseDown = useResize({
    initialWidth: liveSize.width,
    initialHeight: liveSize.height,
    onResize: handleResize,
    onCommit: handleResizeCommit,
  })

  const handleEditorInput = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const sanitized = sanitizeHtml(editor.innerHTML)
    dispatch({ type: ActionType.UPDATE_TEXT, payload: { id: note.id, text: sanitized } })
    debouncedPersist({ ...note, text: sanitized })
  }, [dispatch, debouncedPersist, note])

  const handleEditorBlur = useCallback(() => {
    setIsEditing(false)
    const editor = editorRef.current
    if (!editor) return
    const sanitized = sanitizeHtml(editor.innerHTML)
    if (sanitized !== editor.innerHTML) {
      editor.innerHTML = sanitized
      dispatch({ type: ActionType.UPDATE_TEXT, payload: { id: note.id, text: sanitized } })
    }
  }, [dispatch, note.id])

  const handleEditorPaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  const stopMouseDown = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
  }, [])

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      bringNoteToFront(note.id)
      onDragMouseDown(event)
    },
    [bringNoteToFront, note.id, onDragMouseDown],
  )

  const handleColorChange = useCallback(
    (color: string) => {
      changeNoteColor(note.id, color)
      requestAnimationFrame(focusEditorAtEnd)
    },
    [changeNoteColor, note.id, focusEditorAtEnd],
  )

  const handleFormat = useCallback(
    (command: FormatCommand) => {
      const editor = editorRef.current
      if (!editor) return
      editor.focus()
      document.execCommand('styleWithCSS', false, 'false')
      document.execCommand(command, false)
      handleEditorInput()
    },
    [handleEditorInput],
  )

  const isDragging = draggingId === note.id
  const noteClassName = `${styles.note} ${isDragging ? styles.dragging : ''}`
  const miniToolbarClass = `${styles.miniToolbar} ${
    livePos.y < MINI_TOOLBAR_CLEARANCE_PX ? styles.miniToolbarBelow : ''
  }`

  return (
    <div
      className={noteClassName}
      style={{
        left: livePos.x,
        top: livePos.y,
        width: liveSize.width,
        height: liveSize.height,
        zIndex: note.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {isEditing && (
        <div
          className={miniToolbarClass}
          onMouseDown={stopMouseDown}
          aria-label="Note formatting"
        >
          <div className={styles.formatGroup} role="group" aria-label="Text format">
            <button
              type="button"
              className={styles.formatButton}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleFormat('bold')}
              aria-label="Bold"
            >
              <span className={styles.formatBold}>B</span>
            </button>
            <button
              type="button"
              className={styles.formatButton}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleFormat('italic')}
              aria-label="Italic"
            >
              <span className={styles.formatItalic}>I</span>
            </button>
            <button
              type="button"
              className={styles.formatButton}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleFormat('underline')}
              aria-label="Underline"
            >
              <span className={styles.formatUnderline}>U</span>
            </button>
          </div>
          <div className={styles.miniDivider} aria-hidden="true" />
          <div className={styles.colorGroup} role="radiogroup" aria-label="Note color">
            {NOTE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={note.color === color}
                aria-label={`Color ${color}`}
                className={`${styles.miniDot} ${
                  note.color === color ? styles.miniDotActive : ''
                }`}
                style={{ background: color }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
        </div>
      )}
      <div className={styles.surface} style={{ backgroundColor: note.color }}>
        <div
          ref={editorRef}
          className={styles.editor}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onBlur={handleEditorBlur}
          onPaste={handleEditorPaste}
          onMouseDown={isEditing ? stopMouseDown : undefined}
          data-placeholder="Write something here..."
          spellCheck={isEditing}
        />
        <span className={styles.curl} aria-hidden="true" />
        <div className={styles.resizeHandle} onMouseDown={onResizeMouseDown} />
      </div>
    </div>
  )
})
