import { NotesProvider } from '@context/NotesProvider'
import { DropZoneProvider } from '@context/DropZoneProvider'
import { Board } from '@components/Board/Board'
import { HintBar } from '@components/HintBar/HintBar'
import { TrashZone } from '@components/TrashZone/TrashZone'
import './App.css'

export default function App() {
  return (
    <NotesProvider>
      <DropZoneProvider>
        <Board />
        <HintBar />
        <TrashZone />
      </DropZoneProvider>
    </NotesProvider>
  )
}
