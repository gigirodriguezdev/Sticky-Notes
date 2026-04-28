import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotesProvider } from '@context/NotesProvider'
import { DropZoneProvider } from '@context/DropZoneProvider'
import { Note } from '@components/Note/Note'
import type { Note as NoteType } from '@app-types/index'

vi.mock('@services/notesApi', () => ({
  notesApi: {
    getNotes: vi.fn().mockResolvedValue([]),
    saveNote: vi.fn().mockResolvedValue(undefined),
    updateNote: vi.fn().mockResolvedValue(undefined),
    deleteNote: vi.fn().mockResolvedValue(undefined),
  },
}))

function makeNote(overrides: Partial<NoteType> = {}): NoteType {
  return {
    id: 'n1',
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    text: 'hello',
    color: '#fde4d3',
    zIndex: 1,
    ...overrides,
  }
}

function renderNote(note: NoteType) {
  function Providers({ children }: { children: ReactNode }) {
    return (
      <NotesProvider>
        <DropZoneProvider>{children}</DropZoneProvider>
      </NotesProvider>
    )
  }

  return render(<Note note={note} />, { wrapper: Providers })
}

describe('<Note />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with the note text and background color', () => {
    renderNote(makeNote({ text: 'remember this' }))

    expect(screen.getByText('remember this')).toBeInTheDocument()
  })

  it('positions itself using x/y/width/height', () => {
    const { container } = renderNote(
      makeNote({ x: 50, y: 80, width: 250, height: 180 }),
    )
    const noteEl = container.firstChild as HTMLElement
    expect(noteEl.style.left).toBe('50px')
    expect(noteEl.style.top).toBe('80px')
    expect(noteEl.style.width).toBe('250px')
    expect(noteEl.style.height).toBe('180px')
  })

  it('reveals the formatting toolbar after clicking into the note', async () => {
    const user = userEvent.setup()
    renderNote(makeNote({ text: 'click me' }))

    expect(screen.queryByLabelText('Bold')).not.toBeInTheDocument()

    const noteEl = screen.getByText('click me').closest('div[style]') as HTMLElement
    await user.click(noteEl)

    expect(await screen.findByLabelText('Bold')).toBeInTheDocument()
    expect(screen.getByLabelText('Italic')).toBeInTheDocument()
    expect(screen.getByLabelText('Underline')).toBeInTheDocument()
  })

  it('marks the active color in the mini-toolbar', async () => {
    const user = userEvent.setup()
    renderNote(makeNote({ color: '#fde4d3', text: 'tap' }))

    const noteEl = screen.getByText('tap').closest('div[style]') as HTMLElement
    await user.click(noteEl)

    const peach = await screen.findByLabelText('Color #fde4d3')
    expect(peach).toHaveAttribute('aria-checked', 'true')

    const lavender = screen.getByLabelText('Color #e6dffe')
    expect(lavender).toHaveAttribute('aria-checked', 'false')
  })
})
