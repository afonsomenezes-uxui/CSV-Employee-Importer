import { useState, useCallback, useRef } from 'react'

interface UploadScreenProps {
  onUpload: (fileName?: string | null) => void
}

export default function UploadScreen({ onUpload }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      setFileName(file.name)
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-7 h-7 bg-stone-900 rounded flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="8" height="10" rx="1" stroke="white" strokeWidth="1.2"/>
              <line x1="3.5" y1="4.5" x2="7.5" y2="4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="3.5" y1="6.5" x2="7.5" y2="6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="3.5" y1="8.5" x2="6" y2="8.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M9.5 8.5 L12.5 8.5 M11 7 L12.5 8.5 L11 10" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-stone-900 tracking-tight">New Employees Import</span>
        </div>
      </header>

      {/* Progress steps */}
      <div className="border-b border-stone-200 bg-white px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-stone-900">
            <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
            Upload file
          </span>
          <span className="text-stone-300 mx-1">›</span>
          <span className="flex items-center gap-1.5 text-stone-400">
            <span className="w-5 h-5 rounded-full border border-stone-300 text-stone-400 text-[10px] flex items-center justify-center">2</span>
            Review validation
          </span>
          <span className="text-stone-300 mx-1">›</span>
          <span className="flex items-center gap-1.5 text-stone-400">
            <span className="w-5 h-5 rounded-full border border-stone-300 text-stone-400 text-[10px] flex items-center justify-center">3</span>
            Confirm &amp; import
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-8 pt-16 pb-24">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-semibold text-stone-900 mb-1.5 tracking-tight">Upload new employees CSV</h1>
          <p className="text-sm text-stone-500 mb-8 leading-relaxed">
            Upload your new employees CSV file to validate entries before import. We'll flag errors and duplicates for you to review.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl px-8 py-14 text-center cursor-pointer transition-all select-none
              ${isDragging
                ? 'border-stone-500 bg-stone-100 scale-[1.01]'
                : fileName
                  ? 'border-stone-400 bg-stone-50'
                  : 'border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />

            {fileName ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="1" width="13" height="18" rx="1.5" stroke="#16a34a" strokeWidth="1.4"/>
                    <line x1="5.5" y1="6.5" x2="12" y2="6.5" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="5.5" y1="9.5" x2="12" y2="9.5" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="5.5" y1="12.5" x2="9" y2="12.5" stroke="#16a34a" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800 font-mono">{fileName}</p>
                  <p className="text-xs text-stone-400 mt-0.5">Click to choose a different file</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 14V4M11 4L7 8M11 4L15 8" stroke="#78716c" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 15v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="#78716c" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-700">
                    {isDragging ? 'Drop to upload' : 'Drag & drop your CSV here'}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">or click to browse for .csv files</p>
                </div>
              </div>
            )}
          </div>

          {/* Expected columns */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-stone-400">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <circle cx="5.5" cy="5.5" r="4.5" stroke="#a8a29e" strokeWidth="1"/>
              <line x1="5.5" y1="4.5" x2="5.5" y2="7.5" stroke="#a8a29e" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="5.5" cy="3.2" r="0.5" fill="#a8a29e"/>
            </svg>
            <span>Expected columns:</span>
            <span className="font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">Full Name, Email, Team</span>
          </div>

          {/* CTA */}
          <button
            onClick={() => onUpload(fileName)}
            disabled={!fileName}
            className={`
              mt-6 w-full py-2.5 rounded-lg text-sm font-semibold transition-all
              ${fileName
                ? 'bg-stone-900 text-white hover:bg-stone-800 cursor-pointer shadow-sm'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }
            `}
          >
            {fileName ? 'Validate & Review →' : 'Select a file to continue'}
          </button>

          {/* Demo shortcut */}
          <button
            onClick={() => onUpload(null)}
            className="mt-3 w-full py-2 text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Skip upload - use sample data to preview →
          </button>
        </div>
      </main>
    </div>
  )
}
