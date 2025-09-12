// File store implementation using Zustand
// Based on src/store/rms_v2/fileStore.ts but simplified for MVP

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  FileStoreState,
  FileStoreActions,
  Workspace,
  Tabs,
  BreadcrumbItem,
  SelectedItemsState,
  FileInfo,
} from '@/types/rms.type'

// Combined store type
export type FileStore = FileStoreState & { actions: FileStoreActions }

// Initial state
const initialState: FileStoreState = {
  // Navigation state
  workspace: 'personal',
  activeTab: 'personal',
  currentFolderId: null,
  page: 1,
  
  // Search and filter state
  searchText: null,
  searchQuery: null,
  
  // UI state
  breadcrumbs: [{ id: null, name: 'My Files' }],
  error: null,
  loading: false,
  
  // File selection state
  selectedItemsMap: {},
  chatSelectedFiles: [],
}

// Create the store
export const useFileStore = create<FileStore>()(
  devtools(
    (set) => ({
      ...initialState,
      actions: {
        // Navigation actions
        setWorkspace: (workspace: Workspace) =>
          set((state) => ({
            ...state,
            workspace,
            breadcrumbs: [{ 
              id: null, 
              name: workspace === 'personal' ? 'My Files' : 'Org Files' 
            }],
            currentFolderId: null,
            page: 1,
          })),

        setActiveTab: (tab: Tabs) =>
          set((state) => {
            const newState = { ...state, activeTab: tab }
            
            // Reset navigation when switching between file tabs
            if (tab !== 'connectors' && tab !== state.activeTab) {
              newState.workspace = tab as Workspace
              newState.breadcrumbs = [{ 
                id: null, 
                name: tab === 'personal' ? 'My Files' : 'Org Files' 
              }]
              newState.currentFolderId = null
              newState.page = 1
            }
            
            return newState
          }),

        setCurrentFolderId: (folderId: string | null) =>
          set((state) => ({
            ...state,
            currentFolderId: folderId,
            page: 1, // Reset pagination when changing folders
          })),

        setPage: (page: number) =>
          set((state) => ({
            ...state,
            page,
          })),

        // Search actions
        setSearchText: (searchText: string) =>
          set((state) => ({
            ...state,
            searchText,
          })),

        setSearchQuery: (query: string) =>
          set((state) => ({
            ...state,
            searchQuery: query,
            page: 1, // Reset pagination when searching
          })),

        // UI actions
        setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) =>
          set((state) => ({
            ...state,
            breadcrumbs,
          })),

        setError: (error: string | null) =>
          set((state) => ({
            ...state,
            error,
          })),

        setLoading: (loading: boolean) =>
          set((state) => ({
            ...state,
            loading,
          })),

        // Selection actions
        setSelectedItemsMap: (selectedItemsMap: SelectedItemsState) =>
          set((state) => ({
            ...state,
            selectedItemsMap,
          })),

        toggleItemSelection: (item: FileInfo) =>
          set((state) => {
            const newMap = { ...state.selectedItemsMap }
            const isSelected = !!newMap[item.id]
            
            if (isSelected) {
              delete newMap[item.id]
            } else {
              // Add item to selection
              newMap[item.id] = {
                item,
                category: {
                  tab: state.workspace,
                  folder: state.currentFolderId,
                  folderName: state.currentFolderId
                    ? state.breadcrumbs.find((b) => b.id === state.currentFolderId)?.name || 'Unknown Folder'
                    : state.workspace === 'personal'
                    ? 'My Files'
                    : 'Org Files',
                },
              }
            }
            
            return {
              ...state,
              selectedItemsMap: newMap,
            }
          }),

        clearSelection: () =>
          set((state) => ({
            ...state,
            selectedItemsMap: {},
          })),

        // Chat selection actions
        toggleChatFileSelection: (file: FileInfo) =>
          set((state) => {
            const exists = state.chatSelectedFiles.find((f) => f.id === file.id)
            const newChatSelectedFiles = exists
              ? state.chatSelectedFiles.filter((f) => f.id !== file.id)
              : [...state.chatSelectedFiles, file]
            
            return {
              ...state,
              chatSelectedFiles: newChatSelectedFiles,
            }
          }),

        clearChatSelection: () =>
          set((state) => ({
            ...state,
            chatSelectedFiles: [],
          })),

        // Reset actions
        resetState: (keys?: Array<keyof FileStoreState>) => {
          if (!keys || keys.length === 0) {
            // Reset all state
            set(initialState)
            return
          }
          
          // Reset specific keys
          set((state) => {
            const newState = { ...state }
            keys.forEach((key) => {
              // @ts-ignore - We know these keys exist in initialState
              newState[key] = initialState[key]
            })
            return newState
          })
        },
      },
    }),
    {
      name: 'rms-file-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// Selector hooks for convenience
export const useFileStoreActions = () => {
  return useFileStore((state) => state.actions)
}

// Common selectors
export const useWorkspace = () => useFileStore((state) => state.workspace)
export const useActiveTab = () => useFileStore((state) => state.activeTab)
export const useBreadcrumbs = () => useFileStore((state) => state.breadcrumbs)
export const useSelectedItems = () => useFileStore((state) => state.selectedItemsMap)
export const useChatSelectedFiles = () => useFileStore((state) => state.chatSelectedFiles)
export const useLoading = () => useFileStore((state) => state.loading)
export const useError = () => useFileStore((state) => state.error)