import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { EmployeeRow, FilterTab, RowStatus } from '../types'
import { MOCK_ROWS } from '../mockData'

interface ReviewScreenProps {
  fileName?: string | null
  onConfirm: (count: number) => void
  onCancel: () => void
}

const STATUS_CONFIG: Record<RowStatus, { label: string; badge: string; dot: string }> = {
  valid: {
    label: 'Valid',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
  },
  error: {
    label: 'Error',
    badge: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-500',
  },
  duplicate: {
    label: 'Duplicate',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-400',
  },
}

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'errors', label: 'Errors' },
  { id: 'duplicates', label: 'Duplicates' },
]

type EditableField = 'fullName' | 'email' | 'team'
type SortColumn = '#' | 'fullName' | 'email' | 'team' | 'status'
type SortDirection = 'asc' | 'desc'

function SortableTh({
  label,
  sortKey,
  activeSortColumn,
  sortDirection,
  onSort,
  className = '',
}: {
  label: string
  sortKey: SortColumn
  activeSortColumn: SortColumn | null
  sortDirection: SortDirection
  onSort: (key: SortColumn) => void
  className?: string
}) {
  const [hovered, setHovered] = useState(false)
  const showSort = hovered || activeSortColumn === sortKey

  return (
    <th
      className={`px-3 py-2.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider cursor-pointer select-none ${className}`.trim()}
      onClick={() => onSort(sortKey)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        {showSort && (
          <span className="inline-flex text-stone-400">
            {activeSortColumn === sortKey ? (
              sortDirection === 'asc' ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                  <path d="M5 2v6M3 4l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                  <path d="M5 8V2M3 6l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 opacity-70">
                <path d="M5 2v6M3 4l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
        )}
      </span>
    </th>
  )
}

export default function ReviewScreen({ fileName, onConfirm, onCancel }: ReviewScreenProps) {
  const [rows, setRows] = useState<EmployeeRow[]>(MOCK_ROWS)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [editingCell, setEditingCell] = useState<{ id: string; field: EditableField } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set())
  const [tooltip, setTooltip] = useState<{ id: string; field: string } | null>(null)
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const total = rows.length
  const validCount = rows.filter(r => r.status === 'valid').length
  const errorCount = rows.filter(r => r.status === 'error').length
  const duplicateCount = rows.filter(r => r.status === 'duplicate').length

  const filteredRows = rows
    .filter(row => {
      if (activeFilter === 'errors') return row.status === 'error'
      if (activeFilter === 'duplicates') return row.status === 'duplicate'
      if (activeFilter === 'valid') return row.status === 'valid'
      return true
    })
    .sort((a, b) => {
      if (!sortColumn) return 0
      const dir = sortDirection === 'asc' ? 1 : -1

      const getVal = (row: EmployeeRow) => {
        if (sortColumn === '#') return rows.indexOf(row)
        if (sortColumn === 'status') {
          const order: Record<RowStatus, number> = { valid: 0, error: 1, duplicate: 2 }
          return order[row.status]
        }
        return (row[sortColumn as EditableField] ?? '').toLowerCase()
      }

      const va = getVal(a)
      const vb = getVal(b)
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })

  const hasUnresolvedErrors = errorCount > 0
  const hasUnresolvedIssues = errorCount > 0 || duplicateCount > 0

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  function startEdit(row: EmployeeRow, field: EditableField) {
    setEditingCell({ id: row.id, field })
    setEditValue(row[field])
    setTooltip(null)
  }

  function commitEdit(rowId: string, field: EditableField) {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row

      const updated = { ...row, [field]: editValue.trim() }
      const newErrors = revalidate(updated)
      const newStatus: RowStatus = Object.keys(newErrors).length === 0 ? 'valid' : 'error'

      return { ...updated, errors: newErrors, status: newStatus }
    }))
    setEditingCell(null)
  }

  function revalidate(row: EmployeeRow): Record<string, string> {
    const errors: Record<string, string> = {}

    if (!row.fullName.trim()) {
      errors.fullName = 'Full name is required'
    }

    if (!row.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.email = 'Email address is missing a valid domain (e.g. ".com")'
    }

    return errors
  }

  function handleKeyDown(e: React.KeyboardEvent, rowId: string, field: EditableField) {
    if (e.key === 'Enter') commitEdit(rowId, field)
    if (e.key === 'Escape') setEditingCell(null)
  }

  function toggleDuplicateSelection(id: string) {
    setSelectedDuplicates(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function fixAllDuplicates() {
    const toRemove = selectedDuplicates.size > 0
      ? selectedDuplicates
      : new Set(rows.filter(r => r.status === 'duplicate').map(r => r.id))

    setRows(prev => prev.filter(r => !toRemove.has(r.id)))
    setSelectedDuplicates(new Set())
  }

  const duplicateRows = rows.filter(r => r.status === 'duplicate')
  const allDuplicatesSelected = duplicateRows.length > 0 && duplicateRows.every(r => selectedDuplicates.has(r.id))

  function toggleAllDuplicates() {
    if (allDuplicatesSelected) {
      setSelectedDuplicates(new Set())
    } else {
      setSelectedDuplicates(new Set(duplicateRows.map(r => r.id)))
    }
  }

  const canImport = validCount > 0 && !hasUnresolvedIssues
  const showCheckboxes = activeFilter === 'duplicates'

  function handleSort(key: SortColumn) {
    if (sortColumn === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortColumn(null)
        setSortDirection('asc')
      }
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
  }

  function scrollToRow(rowId: string) {
    setActiveFilter('all')
    setHighlightedRowId(rowId)
  }

  useEffect(() => {
    if (!highlightedRowId) return
    const t = setTimeout(() => setHighlightedRowId(null), 2500)
    return () => clearTimeout(t)
  }, [highlightedRowId])

  useEffect(() => {
    if (!highlightedRowId) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.querySelector(`tr[data-row-id="${highlightedRowId}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    })
  }, [highlightedRowId])

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white px-8 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
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
      <div className="border-b border-stone-200 bg-white px-8 py-3 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-stone-400">
            <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-500 text-[10px] flex items-center justify-center">✓</span>
            Upload file
          </span>
          <span className="text-stone-300 mx-1">›</span>
          <span className="flex items-center gap-1.5 font-medium text-stone-900">
            <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
            Review validation
          </span>
          <span className="text-stone-300 mx-1">›</span>
          <span className="flex items-center gap-1.5 text-stone-400">
            <span className="w-5 h-5 rounded-full border border-stone-300 text-stone-400 text-[10px] flex items-center justify-center">3</span>
            Confirm &amp; import
          </span>
        </div>
      </div>

      {/* Summary banner */}
      <div className={`border-b px-8 py-4 flex-shrink-0 transition-colors ${
        hasUnresolvedErrors
          ? 'bg-red-50 border-red-100'
          : hasUnresolvedIssues
            ? 'bg-amber-50 border-amber-100'
            : 'bg-emerald-50 border-emerald-100'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Status icon */}
            {hasUnresolvedErrors ? (
              <div className="w-8 h-8 rounded-full bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="#dc2626" strokeWidth="1.3"/>
                  <line x1="7" y1="4" x2="7" y2="7.5" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="7" cy="9.5" r="0.8" fill="#dc2626"/>
                </svg>
              </div>
            ) : hasUnresolvedIssues ? (
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2L12.5 11.5H1.5L7 2Z" stroke="#d97706" strokeWidth="1.3" strokeLinejoin="round"/>
                  <line x1="7" y1="5.5" x2="7" y2="8.5" stroke="#d97706" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="7" cy="10" r="0.7" fill="#d97706"/>
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7l3 3L11.5 4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}

            {/* Summary text */}
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-medium text-stone-800 m-0 leading-relaxed">
                {hasUnresolvedIssues ? (
                  <>
                    Fix{' '}
                    {errorCount > 0 && (
                      <button
                        onClick={() => setActiveFilter('errors')}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                          activeFilter === 'errors'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {errorCount} error{errorCount !== 1 ? 's' : ''}
                      </button>
                    )}
                    {errorCount > 0 && duplicateCount > 0 && ' and '}
                    {duplicateCount > 0 && (
                      <button
                        onClick={() => setActiveFilter('duplicates')}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                          activeFilter === 'duplicates'
                            ? 'bg-amber-500 text-white'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {duplicateCount} duplicate{duplicateCount !== 1 ? 's' : ''}
                      </button>
                    )}
                    {' to import all rows.'}
                  </>
                ) : (
                  'All rows look good - ready to import.'
                )}
              </h2>
              {hasUnresolvedIssues && (
                <p className="text-xs text-stone-600 m-0">
                  {hasUnresolvedErrors
                    ? 'Click any highlighted cell to edit inline.'
                    : 'Select duplicates to remove individually or use Remove all duplicates.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table area - no internal scroll so page scrolls and thead sticks to viewport */}
      <div className="flex-1 px-8 py-5 pb-28">
        <div className="max-w-6xl mx-auto">

          {/* Filter tabs + bulk actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    activeFilter === tab.id
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'all' && (
                    <span className="ml-1.5 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold px-1">{total}</span>
                  )}
                  {tab.id === 'errors' && errorCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">{errorCount}</span>
                  )}
                  {tab.id === 'duplicates' && duplicateCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold">{duplicateCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Duplicate bulk actions - only show when viewing duplicates tab */}
            {duplicateCount > 0 && activeFilter === 'duplicates' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={fixAllDuplicates}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 3h8M4 3V2a1 1 0 011-1h2a1 1 0 011 1v1M10 3l-.5 7a1 1 0 01-1 .9H3.5a1 1 0 01-1-.9L2 3" stroke="#b45309" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {selectedDuplicates.size > 0
                    ? `Remove ${selectedDuplicates.size} selected`
                    : `Delete all duplicates`
                  }
                </button>
              </div>
            )}
          </div>

          {/* Table - overflow-x-auto for wide tables; page scrolls vertically so thead sticks to viewport */}
          <div className="overflow-x-auto bg-white border border-stone-200 rounded-lg shadow-sm">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <tr className="border-b border-stone-200">
                  {showCheckboxes && duplicateCount > 0 && (
                    <th className="sticky top-0 z-10 bg-stone-50 pl-4 pr-2 py-2.5 w-8">
                      {activeFilter === 'duplicates' && (
                        <input
                          type="checkbox"
                          checked={allDuplicatesSelected}
                          onChange={toggleAllDuplicates}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-stone-900 cursor-pointer"
                        />
                      )}
                    </th>
                  )}
                  <SortableTh label="#" sortKey="#" activeSortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} className="sticky top-0 z-10 bg-stone-50 pl-4 pr-3 w-10" />
                  <SortableTh label="Full Name" sortKey="fullName" activeSortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} className="sticky top-0 z-10 bg-stone-50" />
                  <SortableTh label="Email" sortKey="email" activeSortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} className="sticky top-0 z-10 bg-stone-50" />
                  <SortableTh label="Team" sortKey="team" activeSortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} className="sticky top-0 z-10 bg-stone-50" />
                  <SortableTh label="Status" sortKey="status" activeSortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} className="sticky top-0 z-10 bg-stone-50" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRows.map((row) => (
                  <TableRow
                    key={row.id}
                    row={row}
                    rowNumber={rows.indexOf(row) + 1}
                    editingCell={editingCell}
                    editValue={editValue}
                    inputRef={inputRef}
                    tooltip={tooltip}
                    isSelected={selectedDuplicates.has(row.id)}
                    showCheckbox={showCheckboxes && duplicateCount > 0}
                    showCheckboxControl={activeFilter === 'duplicates'}
                    onStartEdit={startEdit}
                    onCommitEdit={commitEdit}
                    onKeyDown={handleKeyDown}
                    onEditValueChange={setEditValue}
                    onTooltipShow={setTooltip}
                    onTooltipHide={() => setTooltip(null)}
                    onToggleSelect={toggleDuplicateSelection}
                    onScrollToRow={scrollToRow}
                    highlightedRowId={highlightedRowId}
                  />
                ))}
              </tbody>
            </table>

            {filteredRows.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3.5 9l3.5 3.5L14.5 5" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-stone-700">
                  {activeFilter === 'errors' ? 'No errors - all rows are valid' :
                   activeFilter === 'duplicates' ? 'No duplicates - all entries are unique' :
                   'No rows in this view'}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  {activeFilter === 'errors' ? 'This file is clean of errors.' :
                   activeFilter === 'duplicates' ? 'This file is clean of duplicates.' : ''}
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-stone-400 mt-2 text-right font-mono">
            {filteredRows.length} of {total} rows
          </p>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-stone-600 border border-stone-300 rounded-md hover:bg-stone-50 hover:text-stone-800 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onConfirm(validCount)}
              disabled={!canImport}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                !canImport
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 text-white hover:bg-stone-800 cursor-pointer'
              }`}
            >
              {!canImport ? (
                hasUnresolvedIssues
                  ? 'Fix issues to import'
                  : 'Select a valid file to import'
              ) : (
                `Import ${validCount} row${validCount !== 1 ? 's' : ''} →`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TableRowProps {
  row: EmployeeRow
  rowNumber: number
  editingCell: { id: string; field: EditableField } | null
  editValue: string
  inputRef: React.RefObject<HTMLInputElement>
  tooltip: { id: string; field: string } | null
  isSelected: boolean
  showCheckbox: boolean
  showCheckboxControl: boolean
  onStartEdit: (row: EmployeeRow, field: EditableField) => void
  onCommitEdit: (rowId: string, field: EditableField) => void
  onKeyDown: (e: React.KeyboardEvent, rowId: string, field: EditableField) => void
  onEditValueChange: (val: string) => void
  onTooltipShow: (t: { id: string; field: string }) => void
  onTooltipHide: () => void
  onToggleSelect: (id: string) => void
  onScrollToRow?: (rowId: string) => void
  highlightedRowId?: string | null
}

function TableRow({
  row, rowNumber, editingCell, editValue, inputRef, tooltip, isSelected, showCheckbox, showCheckboxControl,
  onStartEdit, onCommitEdit, onKeyDown, onEditValueChange, onTooltipShow, onTooltipHide, onToggleSelect, onScrollToRow,
  highlightedRowId,
}: TableRowProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null)
  const fields: EditableField[] = ['fullName', 'email', 'team']

  useEffect(() => {
    const visible = tooltip?.id === row.id && tooltip?.field
    if (visible && triggerRef.current) {
      setTooltipRect(triggerRef.current.getBoundingClientRect())
    } else {
      setTooltipRect(null)
    }
  }, [tooltip, row.id])

  const isHighlighted = highlightedRowId === row.id
  const rowBg = isHighlighted
    ? 'bg-blue-50 border-l-4 border-l-blue-500'
    : row.status === 'error'
      ? 'bg-red-50/40 hover:bg-red-50/70'
      : row.status === 'duplicate'
        ? (isSelected ? 'bg-amber-50/70' : 'bg-amber-50/30 hover:bg-amber-50/50')
        : 'hover:bg-stone-50/80'

  const fieldLabels: Record<EditableField, string> = {
    fullName: 'Full Name',
    email: 'Email',
    team: 'Team',
  }

  return (
    <tr className={`transition-all duration-300 ${rowBg}`} data-row-id={row.id}>
      {showCheckbox && (
        <td className="pl-4 pr-2 py-2.5 w-8">
          {row.status === 'duplicate' && showCheckboxControl && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(row.id)}
              className="w-3.5 h-3.5 rounded border-stone-300 text-amber-500 cursor-pointer"
            />
          )}
        </td>
      )}
      <td className="pl-4 pr-3 py-2.5 text-xs font-mono text-stone-400 tabular-nums select-none">{rowNumber}</td>
      {fields.map(field => {
        const isEditing = editingCell?.id === row.id && editingCell?.field === field
        const hasError = field in row.errors
        const tooltipVisible = tooltip?.id === row.id && tooltip?.field === field

        return (
          <td key={field} className="px-3 py-2 relative">
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={e => onEditValueChange(e.target.value)}
                onBlur={() => onCommitEdit(row.id, field)}
                onKeyDown={e => onKeyDown(e, row.id, field)}
                className={`w-full font-mono text-xs bg-white border rounded px-2 py-1.5 outline-none shadow-sm ${
                  hasError
                    ? 'border-red-400 ring-2 ring-red-100 text-stone-900'
                    : 'border-blue-400 ring-2 ring-blue-100 text-stone-900'
                }`}
                placeholder={`Enter ${fieldLabels[field].toLowerCase()}`}
              />
            ) : (
              <div className="relative">
                <button
                  ref={tooltipVisible ? triggerRef : undefined}
                  onClick={() => onStartEdit(row, field)}
                  onMouseEnter={() => hasError && onTooltipShow({ id: row.id, field })}
                  onMouseLeave={onTooltipHide}
                  onFocus={() => hasError && onTooltipShow({ id: row.id, field })}
                  onBlur={onTooltipHide}
                  className={`
                    w-full text-left font-mono text-xs px-2 py-1.5 rounded transition-colors
                    ${hasError
                      ? 'text-red-700 bg-red-100/80 border border-red-200 hover:bg-red-100 cursor-text'
                      : row[field]
                        ? 'text-stone-700 hover:bg-stone-100/80 cursor-text'
                        : 'text-stone-300 italic hover:bg-stone-100/80 cursor-text'
                    }
                  `}
                >
                  {row[field] || <span className="not-italic text-stone-300">-</span>}
                </button>

                {/* Error tooltip - rendered via portal to avoid overflow clipping */}
                {tooltipVisible && hasError && tooltipRect && createPortal(
                  <div
                    className="fixed z-[9999] w-72 bg-stone-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-xl pointer-events-none"
                    style={{
                      left: tooltipRect.left,
                      bottom: window.innerHeight - tooltipRect.top + 8,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 mt-0.5">
                        <circle cx="6" cy="6" r="5" stroke="#ef4444" strokeWidth="1.2"/>
                        <line x1="6" y1="3.5" x2="6" y2="6.5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/>
                        <circle cx="6" cy="8.2" r="0.6" fill="#ef4444"/>
                      </svg>
                      <span className="leading-relaxed">{row.errors[field]}</span>
                    </div>
                    <div className="absolute bottom-0 left-4 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-stone-900"/>
                  </div>,
                  document.body
                )}
              </div>
            )}
          </td>
        )
      })}

      {/* Status badge */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium font-mono ${STATUS_CONFIG[row.status].badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_CONFIG[row.status].dot}`}/>
            {STATUS_CONFIG[row.status].label}
          </span>
          {row.status === 'duplicate' && row.duplicateOf && (
            <button
              type="button"
              onClick={() => onScrollToRow?.(row.duplicateOf!)}
              className="text-[10px] text-stone-500 font-mono hover:text-amber-600 hover:underline transition-colors cursor-pointer"
              title={`Go to row ${row.duplicateOf}`}
            >
              ↑ row {row.duplicateOf}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
