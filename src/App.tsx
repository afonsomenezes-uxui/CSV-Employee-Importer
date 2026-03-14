import { useState } from 'react'
import { AppScreen } from './types'
import UploadScreen from './components/UploadScreen'
import ReviewScreen from './components/ReviewScreen'
import SuccessScreen from './components/SuccessScreen'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('upload')
  const [importedCount, setImportedCount] = useState(0)
  const [fileName, setFileName] = useState<string | null>(null)

  function handleUpload(providedFileName?: string | null) {
    setFileName(providedFileName ?? null)
    setScreen('review')
  }

  function handleConfirm(count: number) {
    setImportedCount(count)
    setScreen('success')
  }

  function handleCancel() {
    setScreen('upload')
  }

  function handleReset() {
    setScreen('upload')
    setImportedCount(0)
  }

  if (screen === 'upload') return <UploadScreen onUpload={handleUpload} />
  if (screen === 'review') return <ReviewScreen fileName={fileName} onConfirm={handleConfirm} onCancel={handleCancel} />
  return <SuccessScreen importedCount={importedCount} onReset={handleReset} />
}
