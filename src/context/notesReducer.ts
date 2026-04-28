import type { Note, NoteAction } from '@app-types/index'
import { ActionType } from '@app-types/index'

export const initialState: Note[] = []

export function getNextZIndex(notes: Note[]): number {
  if (notes.length === 0) return 1
  let max = 0
  for (const note of notes) {
    if (note.zIndex > max) max = note.zIndex
  }
  return max + 1
}

export function notesReducer(state: Note[], action: NoteAction): Note[] {
  switch (action.type) {
    case ActionType.LOAD_NOTES:
      return action.payload

    case ActionType.ADD_NOTE:
      return [...state, action.payload]

    case ActionType.DELETE_NOTE:
      return state.filter((note) => note.id !== action.payload)

    case ActionType.MOVE_NOTE:
      return state.map((note) =>
        note.id === action.payload.id
          ? { ...note, x: action.payload.x, y: action.payload.y }
          : note,
      )

    case ActionType.RESIZE_NOTE:
      return state.map((note) =>
        note.id === action.payload.id
          ? { ...note, width: action.payload.width, height: action.payload.height }
          : note,
      )

    case ActionType.UPDATE_TEXT:
      return state.map((note) =>
        note.id === action.payload.id ? { ...note, text: action.payload.text } : note,
      )

    case ActionType.CHANGE_COLOR:
      return state.map((note) =>
        note.id === action.payload.id ? { ...note, color: action.payload.color } : note,
      )

    case ActionType.BRING_TO_FRONT: {
      const target = state.find((n) => n.id === action.payload)
      if (!target) return state

      const maxZ = state.reduce((acc, n) => (n.zIndex > acc ? n.zIndex : acc), 0)
      if (target.zIndex === maxZ) return state

      return state.map((note) =>
        note.id === action.payload ? { ...note, zIndex: maxZ + 1 } : note,
      )
    }

    default:
      return state
  }
}
