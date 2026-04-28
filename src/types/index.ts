export const ActionType = {
  ADD_NOTE:       'ADD_NOTE',
  DELETE_NOTE:    'DELETE_NOTE',
  MOVE_NOTE:      'MOVE_NOTE',
  RESIZE_NOTE:    'RESIZE_NOTE',
  UPDATE_TEXT:    'UPDATE_TEXT',
  BRING_TO_FRONT: 'BRING_TO_FRONT',
  CHANGE_COLOR:   'CHANGE_COLOR',
  LOAD_NOTES:     'LOAD_NOTES',
} as const

export type ActionType = typeof ActionType[keyof typeof ActionType]

export interface Note {
  id: string
  x: number
  y: number
  width: number
  height: number
  text: string
  color: string
  zIndex: number
}

export type NoteAction =
  | { type: typeof ActionType.ADD_NOTE;       payload: Note }
  | { type: typeof ActionType.DELETE_NOTE;    payload: string }
  | { type: typeof ActionType.MOVE_NOTE;      payload: { id: string; x: number; y: number } }
  | { type: typeof ActionType.RESIZE_NOTE;    payload: { id: string; width: number; height: number } }
  | { type: typeof ActionType.UPDATE_TEXT;    payload: { id: string; text: string } }
  | { type: typeof ActionType.BRING_TO_FRONT; payload: string }
  | { type: typeof ActionType.CHANGE_COLOR;   payload: { id: string; color: string } }
  | { type: typeof ActionType.LOAD_NOTES;     payload: Note[] }