interface SuccessScreenProps {
  importedCount: number
  onReset: () => void
}

export default function SuccessScreen({ importedCount, onReset }: SuccessScreenProps) {
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
          <span className="flex items-center gap-1.5 text-stone-400">
            <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-500 text-[10px] flex items-center justify-center">✓</span>
            Upload file
          </span>
          <span className="text-stone-300 mx-1">›</span>
          <span className="flex items-center gap-1.5 text-stone-400">
            <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-500 text-[10px] flex items-center justify-center">✓</span>
            Review validation
          </span>
          <span className="text-stone-300 mx-1">›</span>
          <span className="flex items-center gap-1.5 font-medium text-stone-900">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">✓</span>
            Confirm &amp; import
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-8 py-24">
        <div className="max-w-xs w-full text-center">
          {/* Success icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M5 14l6 6L23 8" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight mb-2">Import complete</h1>

          <p className="text-stone-500 text-sm mb-1 leading-relaxed">
            <span className="font-semibold text-stone-900 text-lg tabular-nums">{importedCount}</span>
            {' '}employee record{importedCount !== 1 ? 's were' : ' was'} successfully added to the system.
          </p>
          <p className="text-xs text-stone-400 mb-10">
            Onboarding tasks and welcome emails have been queued for delivery.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={onReset}
              className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800 transition-colors shadow-sm"
            >
              Import another file
            </button>
            <button
              onClick={onReset}
              className="w-full py-2.5 text-stone-500 text-sm hover:text-stone-700 transition-colors"
            >
              Go to People dashboard →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
