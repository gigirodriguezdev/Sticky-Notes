import type { Note } from '@app-types/index'

const STORAGE_KEY = 'sticky_notes'
const SIMULATED_LATENCY_MS = 200
const SIMULATED_INITIAL_LATENCY_MS = 300

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function readStorage(): Note[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) {
      console.warn('[notesApi] storage payload is not an array, resetting')
      return []
    }
    return parsed as Note[]
  } catch (error) {
    console.warn('[notesApi] failed to parse storage, resetting', error)
    return []
  }
}

function writeStorage(notes: Note[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export const notesApi = {
  async getNotes(): Promise<Note[]> {
    await delay(SIMULATED_INITIAL_LATENCY_MS)
    return readStorage()
  },

  async saveNote(note: Note): Promise<Note> {
    await delay(SIMULATED_LATENCY_MS)
    const notes = readStorage()
    writeStorage([...notes, note])
    return note
  },

  async updateNote(note: Note): Promise<Note> {
    await delay(SIMULATED_LATENCY_MS)
    const notes = readStorage()
    writeStorage(notes.map((n) => (n.id === note.id ? note : n)))
    return note
  },

  async deleteNote(id: string): Promise<void> {
    await delay(SIMULATED_LATENCY_MS)
    const notes = readStorage()
    writeStorage(notes.filter((n) => n.id !== id))
  },
}
