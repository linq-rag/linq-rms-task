import React, { useState, useCallback, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'

import FileTable from '@/components/FileTable'
import ConnectorsTab from '@/components/ConnectorsTab'
import AddFilesButton from '@/components/AddFilesButton'
import SearchBar from '@/components/SearchBar'

import { Workspace, FileInfo, BreadcrumbItem } from '@/types/rms.type'
import { useRmsFiles } from '@/hooks/useRmsFiles'
import { useFileStore } from '@/store/fileStore'

const Dashboard: React.FC = () => {
  const [error, setError] = useState<string | null>(null)
  
  // File operations
  const {
    fetchWorkspaceItems,
    fetchFolderItems,
    isLoading,
    viewItems: items,
  } = useRmsFiles()

  // Store state
  const {
    activeTab,
    currentFolderId,
    searchQuery,
    breadcrumbs,
    workspace: currentWorkspace,
  } = useFileStore(
    useShallow((state) => ({
      activeTab: state.activeTab,
      currentFolderId: state.currentFolderId,
      searchQuery: state.searchQuery,
      breadcrumbs: state.breadcrumbs,
      workspace: state.workspace,
    }))
  )

  // Store actions
  const { setActiveTab, setCurrentFolderId, setBreadcrumbs, setSearchText } = useFileStore(state => state.actions)

  // Selection state
  const [selectedItemsMap, setSelectedItemsMap] = useState<{[key: string]: {
    item: FileInfo
    category: {
      tab: Workspace
      folder: string | null
      folderName: string
    }
  }}>({})
  const [selectAllInView, setSelectAllInView] = useState(false)

  // Update select all state when items change
  useEffect(() => {
    if (items.length === 0) {
      setSelectAllInView(false)
      return
    }
    const allSelected = items.every((item: FileInfo) => !!selectedItemsMap[item.id])
    setSelectAllInView(allSelected)
  }, [items, selectedItemsMap])

  // Handle search
  const handleSearch = async (directQuery = searchQuery) => {
    try {
      const keyword = directQuery?.trim() || undefined

      // Reset to root when searching
      if (keyword && currentFolderId !== null) {
        setBreadcrumbs([{
          id: null,
          name: activeTab === 'personal' ? 'My Files' : 'Org Files',
        }])
        setCurrentFolderId(null)
      }
      // For MVP, just fetch workspace items
      if (activeTab !== 'connectors') {
        fetchWorkspaceItems(activeTab as Workspace)
      }
    } catch (error) {
      console.error('Failed to search items:', error)
      setError('Failed to search items')
    }
  }

  // Toggle item selection
  const handleToggleItemSelection = (item: FileInfo, selected: boolean) => {
    setSelectedItemsMap((prev) => {
      const newMap = { ...prev }

      if (selected) {
        newMap[item.id] = {
          item,
          category: {
            tab: currentWorkspace as Workspace,
            folder: currentFolderId,
            folderName: currentFolderId
              ? breadcrumbs.find((b) => b.id === currentFolderId)?.name || 'Unknown Folder'
              : currentWorkspace === 'personal'
              ? 'My Files'
              : 'Org Files',
          },
        }
      } else {
        delete newMap[item.id]
      }

      return newMap
    })
  }

  // Toggle select all items in view
  const handleToggleSelectAllInView = (selected: boolean) => {
    setSelectAllInView(selected)

    setSelectedItemsMap((prev) => {
      const newMap = { ...prev }

      items.forEach((item: FileInfo) => {
        if (selected) {
          newMap[item.id] = {
            item,
            category: {
              tab: activeTab as Workspace,
              folder: currentFolderId,
              folderName: currentFolderId
                ? breadcrumbs.find((b) => b.id === currentFolderId)?.name || 'Unknown Folder'
                : activeTab === 'personal'
                ? 'My Files'
                : 'Org Files',
            },
          }
        } else {
          delete newMap[item.id]
        }
      })

      return newMap
    })
  }

  // Handle folder click
  const handleFolderClick = (folder: FileInfo) => {
    const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1]
    if (lastBreadcrumb.id === folder.id) {
      return
    }

    try {
      fetchFolderItems(folder.id, folder.name)
      setSearchText('')

      if (!breadcrumbs.some((crumb) => crumb.id === folder.id)) {
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }])
      }
    } catch (error) {
      console.error('Error fetching folder contents:', error)
      setError('Failed to fetch folder contents')
    }
  }

  // Handle breadcrumb click
  const handleBreadcrumbClick = (breadcrumb: BreadcrumbItem, index: number) => {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1))

    if (breadcrumb.id === null) {
      fetchWorkspaceItems(activeTab as Workspace)
    } else {
      fetchFolderItems(breadcrumb.id, breadcrumb.name)
    }
  }

  const changeTab = useCallback(
    (tab: Workspace | 'connectors') => {
      setActiveTab(tab)

      if (tab !== 'connectors') {
        setBreadcrumbs([{
          id: null,
          name: tab === 'personal' ? 'My Files' : 'Org Files',
        }])
        fetchWorkspaceItems(tab as Workspace)
      }
    },
    [setActiveTab, fetchWorkspaceItems, setBreadcrumbs]
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white shadow-sm rounded-lg">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mx-4 mt-4">
            {error}
            <button
              className="absolute top-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex px-6">
            <button
              className={`${
                activeTab === 'personal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => changeTab('personal')}
            >
              My Files
            </button>
            <button
              className={`${
                activeTab === 'connectors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
              onClick={() => changeTab('connectors')}
            >
              Connectors
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'connectors' && <ConnectorsTab />}
          
          {activeTab === 'personal' && (
            <div>
              {/* Filter Bar */}
              <div className="flex items-center gap-2 mb-4 flex-wrap justify-end">
                <div className="flex-1">
                  <SearchBar onSearch={handleSearch} />
                </div>
                <AddFilesButton
                  workspace={activeTab as Workspace}
                  onAddConnector={() => changeTab('connectors')}
                  onError={setError}
                />
              </div>

              {/* File Table */}
              <FileTable
                items={items}
                loading={isLoading}
                workspace={activeTab as Workspace}
                breadcrumbs={breadcrumbs}
                onFolderClick={handleFolderClick}
                onBreadcrumbClick={handleBreadcrumbClick}
                selectedItemsMap={selectedItemsMap}
                onSelectItem={handleToggleItemSelection}
                selectAllInView={selectAllInView}
                onSelectAllInView={handleToggleSelectAllInView}
                onSearch={handleSearch}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard