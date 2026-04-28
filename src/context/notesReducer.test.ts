import { describe, it, expect } from 'vitest'
import { getNextZIndex, notesReducer, initialState } from '@context/notesReducer'
import { ActionType } from '@app-types/index'
import type { Note } from '@app-types/index'

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    text: '',
    color: '#fde4d3',
    zIndex: 1,
    ...overrides,
  }
}

describe('getNextZIndex', () => {
  it('returns 1 for an empty array', () => {
    expect(getNextZIndex([])).toBe(1)
  })

  it('returns max + 1 across notes', () => {
    expect(
      getNextZIndex([
        makeNote({ id: 'a', zIndex: 1 }),
        makeNote({ id: 'b', zIndex: 5 }),
        makeNote({ id: 'c', zIndex: 3 }),
      ]),
    ).toBe(6)
  })
})

describe('notesReducer', () => {
  it('replaces state on LOAD_NOTES', () => {
    const seeded = [makeNote({ id: 'x' })]
    const result = notesReducer(initialState, {
      type: ActionType.LOAD_NOTES,
      payload: seeded,
    })
    expect(result).toEqual(seeded)
  })

  it('appends on ADD_NOTE without mutating the previous state', () => {
    const note = makeNote({ id: 'a' })
    const before = [makeNote({ id: 'b' })]
    const after = notesReducer(before, { type: ActionType.ADD_NOTE, payload: note })

    expect(after).toHaveLength(2)
    expect(after[1]).toBe(note)
    expect(before).toHaveLength(1)
  })

  it('removes a note by id on DELETE_NOTE', () => {
    const before = [makeNote({ id: 'a' }), makeNote({ id: 'b' })]
    const after = notesReducer(before, { type: ActionType.DELETE_NOTE, payload: 'a' })
    expect(after).toEqual([before[1]])
  })

  it('updates only the targeted note on MOVE_NOTE', () => {
    const before = [makeNote({ id: 'a', x: 0, y: 0 }), makeNote({ id: 'b', x: 10, y: 10 })]
    const after = notesReducer(before, {
      type: ActionType.MOVE_NOTE,
      payload: { id: 'a', x: 100, y: 50 },
    })
    expect(after[0]).toMatchObject({ id: 'a', x: 100, y: 50 })
    expect(after[1]).toBe(before[1])
  })

  it('updates size on RESIZE_NOTE', () => {
    const before = [makeNote({ id: 'a', width: 200, height: 200 })]
    const after = notesReducer(before, {
      type: ActionType.RESIZE_NOTE,
      payload: { id: 'a', width: 300, height: 250 },
    })
    expect(after[0]).toMatchObject({ width: 300, height: 250 })
  })

  it('updates text on UPDATE_TEXT', () => {
    const before = [makeNote({ id: 'a', text: 'old' })]
    const after = notesReducer(before, {
      type: ActionType.UPDATE_TEXT,
      payload: { id: 'a', text: 'new' },
    })
    expect(after[0].text).toBe('new')
  })

  it('changes color on CHANGE_COLOR', () => {
    const before = [makeNote({ id: 'a', color: '#fde4d3' })]
    const after = notesReducer(before, {
      type: ActionType.CHANGE_COLOR,
      payload: { id: 'a', color: '#d6f0e0' },
    })
    expect(after[0].color).toBe('#d6f0e0')
  })

  describe('BRING_TO_FRONT', () => {
    it('promotes a note to max + 1', () => {
      const before = [
        makeNote({ id: 'a', zIndex: 1 }),
        makeNote({ id: 'b', zIndex: 3 }),
        makeNote({ id: 'c', zIndex: 2 }),
      ]
      const after = notesReducer(before, {
        type: ActionType.BRING_TO_FRONT,
        payload: 'a',
      })
      expect(after.find((n) => n.id === 'a')?.zIndex).toBe(4)
    })

    it('returns the same state reference when the note is already on top', () => {
      const before = [makeNote({ id: 'a', zIndex: 5 }), makeNote({ id: 'b', zIndex: 2 })]
      const after = notesReducer(before, {
        type: ActionType.BRING_TO_FRONT,
        payload: 'a',
      })
      expect(after).toBe(before)
    })

    it('returns the same state reference when the note is missing', () => {
      const before = [makeNote({ id: 'a', zIndex: 1 })]
      const after = notesReducer(before, {
        type: ActionType.BRING_TO_FRONT,
        payload: 'missing',
      })
      expect(after).toBe(before)
    })
  })

  it('does not mutate the input array', () => {
    const before = [makeNote({ id: 'a' })]
    const snapshot = JSON.parse(JSON.stringify(before))
    notesReducer(before, {
      type: ActionType.MOVE_NOTE,
      payload: { id: 'a', x: 999, y: 999 },
    })
    expect(before).toEqual(snapshot)
  })
})
