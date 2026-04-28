import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { NotesProvider } from '@context/NotesProvider'
import { useNotes } from '@hooks/useNotes'
import { useNotesSync } from '@hooks/useNotesSync'
import type { Note } from '@app-types/index'

vi.mock('@services/notesApi', () => ({
  notesApi: {
    getNotes: vi.fn(),
    saveNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
  },
}))

import { notesApi } from '@services/notesApi'

const mockedApi = vi.mocked(notesApi)

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

function wrapper({ children }: { children: ReactNode }) {
  return <NotesProvider>{children}</NotesProvider>
}

describe('useNotesSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Silence the expected error logs from rollback paths.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('createNote dispatches and calls the API', async () => {
    mockedApi.saveNote.mockResolvedValue(makeNote())
    const { result } = renderHook(
      () => ({ sync: useNotesSync(), state: useNotes() }),
      { wrapper },
    )

    const note = makeNote({ id: 'a' })
    await act(async () => {
      await result.current.sync.createNote(note)
    })

    expect(result.current.state.notes).toEqual([note])
    expect(mockedApi.saveNote).toHaveBeenCalledWith(note)
  })

  it('rolls back the optimistic add when saveNote fails', async () => {
    mockedApi.saveNote.mockRejectedValue(new Error('network'))
    const { result } = renderHook(
      () => ({ sync: useNotesSync(), state: useNotes() }),
      { wrapper },
    )

    const note = makeNote({ id: 'a' })
    await act(async () => {
      await result.current.sync.createNote(note)
    })

    await waitFor(() => {
      expect(result.current.state.notes).toEqual([])
    })
  })

  it('deleteNote removes locally and calls the API', async () => {
    mockedApi.saveNote.mockResolvedValue(makeNote())
    mockedApi.deleteNote.mockResolvedValue(undefined)
    const { result } = renderHook(
      () => ({ sync: useNotesSync(), state: useNotes() }),
      { wrapper },
    )

    const note = makeNote({ id: 'a' })
    await act(async () => {
      await result.current.sync.createNote(note)
    })
    await act(async () => {
      await result.current.sync.deleteNote('a')
    })

    expect(result.current.state.notes).toEqual([])
    expect(mockedApi.deleteNote).toHaveBeenCalledWith('a')
  })

  it('restores the deleted note when deleteNote fails', async () => {
    mockedApi.saveNote.mockResolvedValue(makeNote())
    mockedApi.deleteNote.mockRejectedValue(new Error('network'))
    const { result } = renderHook(
      () => ({ sync: useNotesSync(), state: useNotes() }),
      { wrapper },
    )

    const note = makeNote({ id: 'a', text: 'hi' })
    await act(async () => {
      await result.current.sync.createNote(note)
    })
    await act(async () => {
      await result.current.sync.deleteNote('a')
    })

    await waitFor(() => {
      expect(result.current.state.notes).toEqual([note])
    })
  })

  it('bringNoteToFront skips dispatch and API when already on top', async () => {
    mockedApi.saveNote.mockResolvedValue(makeNote())
    const { result } = renderHook(
      () => ({ sync: useNotesSync(), state: useNotes() }),
      { wrapper },
    )

    const top = makeNote({ id: 'a', zIndex: 5 })
    const back = makeNote({ id: 'b', zIndex: 2 })
    await act(async () => {
      await result.current.sync.createNote(back)
      await result.current.sync.createNote(top)
    })
    mockedApi.updateNote.mockClear()

    act(() => {
      result.current.sync.bringNoteToFront('a')
    })

    expect(mockedApi.updateNote).not.toHaveBeenCalled()
  })

  it('changeNoteColor skips work when the color is unchanged', async () => {
    mockedApi.saveNote.mockResolvedValue(makeNote())
    const { result } = renderHook(
      () => ({ sync: useNotesSync(), state: useNotes() }),
      { wrapper },
    )

    const note = makeNote({ id: 'a', color: '#fde4d3' })
    await act(async () => {
      await result.current.sync.createNote(note)
    })
    mockedApi.updateNote.mockClear()

    act(() => {
      result.current.sync.changeNoteColor('a', '#fde4d3')
    })

    expect(mockedApi.updateNote).not.toHaveBeenCalled()
  })
})
