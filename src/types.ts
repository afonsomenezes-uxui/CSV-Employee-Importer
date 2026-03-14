export type RowStatus = 'valid' | 'error' | 'duplicate'

export interface EmployeeRow {
  id: string
  fullName: string
  email: string
  team: string
  status: RowStatus
  errors: Record<string, string>
  duplicateOf?: string
}

export type FilterTab = 'all' | 'errors' | 'duplicates' | 'valid'
export type AppScreen = 'upload' | 'review' | 'success'
