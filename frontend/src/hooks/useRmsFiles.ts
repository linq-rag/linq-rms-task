// RMS Files hook - Based on src/hooks/rms_v2/useRmsV2Files.ts
// Simplified for MVP

import { useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import {
  FileInfo,
  BrowseParams,
  Workspace,
  BreadcrumbItem,
} from '@/types/rms.type'
import { useFileStore, useFileStoreActions } from '@/store/fileStore'
import { getIconUrl, getSourceIconUrl } from '@/lib/icons'
import useBrowse from '@/queries/useBrowse'

// RMS Files management hook - extracted from lines 14-137
export const useRmsFiles = () => {
  // Extract store integration from lines 15-36
  const { workspace, currentFolderId, page, searchQuery, breadcrumbs } = useFileStore(
    useShallow((state) => ({
      workspace: state.workspace,
      currentFolderId: state.currentFolderId,
      page: state.page,
      searchQuery: state.searchQuery,
      breadcrumbs: state.breadcrumbs,
    }))
  )

  // Extract actions from lines 28-36
  const {
    setWorkspace,
    setCurrentFolderId,
    setPage,
    setSearchQuery,
    setBreadcrumbs,
    resetState,
  } = useFileStoreActions()

  // Extract browse params construction from lines 38-61
  const currentBrowseParams = useMemo(
    () =>
      ({
        workspace: workspace,
        folderId: currentFolderId,
        page: page,
        per_page: 10,
        filter: {
          keyword: searchQuery || undefined,
        },
        sort: {
          fields: [
            {
              field: 'syncedTimeStamp',
              order: 'desc',
            },
          ],
        },
      } as BrowseParams),
    [workspace, currentFolderId, searchQuery, page]
  )

  // Extract query integration from lines 63-69
  const {
    data: browseData,
    isLoading,
    isError,
    error,
    refetch: refetchItems,
  } = useBrowse(currentBrowseParams)

  // Extract view items transformation from lines 72-80
  const viewItems = useMemo(() => {
    if (!browseData) return []

    return browseData.items.map((item: FileInfo) => ({
      ...item,
      iconUrl: getIconUrl(item.contentType),
      sourceIconUrl: getSourceIconUrl(item.source),
    }))
  }, [browseData])

  // Extract page info from lines 82-89
  const pageInfo = useMemo(() => {
    return {
      page: browseData?.page || 1,
      per_page: browseData?.per_page || 10,
      total: browseData?.total || 0,
      total_pages: browseData?.total_pages || 0,
    }
  }, [browseData])

  // Extract file operation functions from lines 91-136
  const fetchWorkspaceItems = useCallback(
    async (newWorkspace: Workspace) => {
      resetState(['currentFolderId', 'page', 'searchQuery'])
      setWorkspace(newWorkspace)
      // Update breadcrumbs for new workspace
      setBreadcrumbs([{ 
        id: null, 
        name: newWorkspace === 'personal' ? 'My Files' : 'Org Files' 
      }])
    },
    [setWorkspace, setBreadcrumbs, resetState]
  )

  const fetchFolderItems = useCallback(
    async (folderId: string, folderName: string) => {
      setCurrentFolderId(folderId)
      
      // Update breadcrumbs - don't add duplicate folders
      const existingIndex = breadcrumbs.findIndex(crumb => crumb.id === folderId)
      if (existingIndex === -1) {
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }])
      } else {
        // Truncate breadcrumbs to this folder
        setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1))
      }
    },
    [setCurrentFolderId, setBreadcrumbs, breadcrumbs]
  )

  const fetchItemsWithPage = useCallback(
    async (page: number) => {
      setPage(page)
    },
    [setPage]
  )

  const handleBreadcrumbClick = useCallback(
    (breadcrumb: BreadcrumbItem, index: number) => {
      // Truncate breadcrumbs to clicked item
      setBreadcrumbs(breadcrumbs.slice(0, index + 1))
      
      if (breadcrumb.id === null) {
        // Root level
        setCurrentFolderId(null)
      } else {
        // Navigate to specific folder
        setCurrentFolderId(breadcrumb.id)
      }
      
      // Reset page when navigating
      setPage(1)
    },
    [setBreadcrumbs, setCurrentFolderId, setPage, breadcrumbs]
  )

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      setPage(1) // Reset to first page when searching
    },
    [setSearchQuery, setPage]
  )

  return {
    // Data
    currentBrowseParams,
    viewItems,
    pageInfo,
    isLoading,
    isError,
    error,
    
    // Navigation state
    workspace,
    currentFolderId,
    breadcrumbs,
    searchQuery,
    
    // Actions
    refetchItems,
    fetchWorkspaceItems,
    fetchFolderItems,
    fetchItemsWithPage,
    handleBreadcrumbClick,
    handleSearch,
  }
}