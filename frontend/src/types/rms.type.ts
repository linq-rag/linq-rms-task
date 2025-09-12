// Simplified types for RMS MVP
// Based on src/types/rms_v2.type.ts but reduced for MVP scope

// Core workspace types
export type Workspace = 'personal' | 'organization'
export type Tabs = Workspace | 'connectors'

// Connector types - simplified to Google Drive only
export enum Connector {
  GoogleDrive = 'googleDrive',
}

// File status types
export enum StatusType {
  SYNCING = 'Syncing...',
  SYNCED = 'Synced',
  SYNCING_FAILED = 'Syncing Failed',
  DELETING = 'Deleting...',
  DELETING_FAILED = 'Deleting Failed',
}

// Content types for file identification
export enum ContentType {
  PDF = 'application/pdf',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  GOOGLE_DOC = 'application/vnd.google-apps.document',
  GOOGLE_SHEET = 'application/vnd.google-apps.spreadsheet',
  GOOGLE_PRESENTATION = 'application/vnd.google-apps.presentation',
  GOOGLE_FOLDER = 'application/vnd.google-apps.folder',
  OCTET_STREAM = 'application/octet-stream',
}

// Item types
export enum ItemType {
  DOCUMENT = 'document',
  CONTAINER = 'container',
}

// Core file information interface
export interface FileInfo {
  id: string
  name: string
  contentType: ContentType | string
  itemType: ItemType
  source: Connector
  status: StatusType
  workspace: Workspace
  
  // Optional metadata
  url?: string
  parentId?: string
  rmsId?: string
  iconUrl?: string
  sourceIconUrl?: string
  
  // Timestamps
  lastContributionTimeStamp?: string
  syncedTimeStamp?: string
  
  // Search content
  content?: string
  
  // Error information
  error?: string
}

// Breadcrumb navigation
export interface BreadcrumbItem {
  id: string | null
  name: string
}

// Connector state
export interface ConnectorState {
  connected: boolean
  email?: string
}

// User connectors mapping
export type UserConnectors = Record<Connector, ConnectorState>

// File selection for chat context
export interface SelectedItemsState {
  [key: string]: {
    item: FileInfo
    category: {
      tab: Workspace
      folder: string | null
      folderName: string
    }
  }
}

// API parameter types
export interface BrowseParams {
  workspace: Workspace
  folderId?: string | null
  page?: number
  per_page?: number
  filter?: {
    keyword?: string
    status?: StatusType[]
  }
  sort?: {
    fields: Array<{
      field: string
      order: 'asc' | 'desc'
    }>
  }
}

export interface ConnectParams {
  connector: Connector
  auth_code: string
  code_verifier?: string
}

export interface SyncParams {
  items: FileInfo[]
  workspace: Workspace
  browseParams?: BrowseParams
}

export interface DeleteParams {
  items: FileInfo[]
  workspace: Workspace
}

export interface UploadParams {
  items: FileInfo[]
  workspace: Workspace
}

// API response types
export interface BrowseResponse {
  items: FileInfo[]
  page: number
  per_page: number
  total: number
  total_pages: number
  connector?: UserConnectors
}

export interface OperationResult {
  id: string
  status: string
  error?: string
}

export interface OperationResponse {
  results: OperationResult[]
}

// OAuth and authentication types
export interface OAuthTokens {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
}

export interface AuthCodeResponse {
  code: string
  scope: string
  authuser: string
  prompt: string
}

// Error types
export interface ApiError {
  message: string
  status?: number
  code?: string
}

// Utility types
export type CredentialSource = keyof Pick<UserConnectors, Connector.GoogleDrive>

// Navigation context
export interface NavContextType {
  navVisible: boolean
  setNavVisible: (visible: boolean) => void
  isMobile: boolean
  panelState: PanelState
  setPanelState: (state: PanelState) => void
}

export enum PanelState {
  Closed = 'closed',
  PartialOpen = 'partial',
  FullOpen = 'full',
}

// Chat context types (for future chat integration)
export interface ChatContextType {
  selectedFiles: FileInfo[]
  addFile: (file: FileInfo) => void
  removeFile: (fileId: string) => void
  clearFiles: () => void
}

// Filter and sort types
export interface SortField {
  field: string
  order: 'asc' | 'desc'
}

// Component prop types
export interface FileTableProps {
  items: FileInfo[]
  workspace: Workspace
  selectedItemsMap: SelectedItemsState
  onSelectItem: (item: FileInfo, selected: boolean) => void
  selectAllInView: boolean
  onSelectAllInView: (selected: boolean) => void
  onFolderClick: (folder: FileInfo) => void
  onBreadcrumbClick: (breadcrumb: BreadcrumbItem, index: number) => void
  breadcrumbs: BreadcrumbItem[]
  loading?: boolean
  isDebugMode?: boolean
}

export interface ConnectorsTabProps {
  connectorInfo: UserConnectors | null
  onConnectorChange: () => void
}

export interface SearchBarProps {
  onSearch: (keyword: string) => void
}

export interface AddFilesButtonProps {
  workspace: Workspace
  onError: (error: string | null) => void
}

// Store types
export interface FileStoreState {
  // Navigation state
  workspace: Workspace
  activeTab: Tabs
  currentFolderId: string | null
  page: number
  
  // Search and filter state
  searchText: string | null
  searchQuery: string | null
  
  // UI state
  breadcrumbs: BreadcrumbItem[]
  error: string | null
  loading: boolean
  
  // File selection state
  selectedItemsMap: SelectedItemsState
  chatSelectedFiles: FileInfo[]
}

export interface FileStoreActions {
  // Navigation actions
  setWorkspace: (workspace: Workspace) => void
  setActiveTab: (tab: Tabs) => void
  setCurrentFolderId: (folderId: string | null) => void
  setPage: (page: number) => void
  
  // Search actions
  setSearchText: (searchText: string) => void
  setSearchQuery: (query: string) => void
  
  // UI actions
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  
  // Selection actions
  setSelectedItemsMap: (items: SelectedItemsState) => void
  toggleItemSelection: (item: FileInfo) => void
  clearSelection: () => void
  
  // Chat selection actions
  toggleChatFileSelection: (file: FileInfo) => void
  clearChatSelection: () => void
  
  // Reset actions
  resetState: (keys?: Array<keyof FileStoreState>) => void
}