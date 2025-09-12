import React, { useState, useCallback, memo } from 'react'
import Image from 'next/image'

import BreadcrumbNav from '@/components/BreadcrumbNav'

import { FileInfo, BreadcrumbItem, Workspace, ItemType } from '@/types/rms.type'
import { getSourceIconUrl } from '@/lib/icons'
import { formatUtcToLocal } from '@/lib/utils'


// Table header component
const FileTableHeader = memo(
  ({
    selectAllInView,
    onSelectAllInView,
  }: {
    selectAllInView: boolean
    onSelectAllInView: (selected: boolean) => void
  }) => {
    const handleSelectAll = useCallback(() => {
      onSelectAllInView(!selectAllInView)
    }, [selectAllInView, onSelectAllInView])

    return (
      <thead className="bg-gray-50">
        <tr className="border-b border-gray-200">
          <th scope="col" className="px-6 py-3 text-left">
            <input
              type="checkbox"
              checked={selectAllInView}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-300"
            />
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Source
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            File Name
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Modified
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
        </tr>
      </thead>
    )
  }
)

FileTableHeader.displayName = 'FileTableHeader'

// File row component
const FileRow = ({
  item,
  isSelected,
  onSelect,
  onFolderClick,
}: {
  item: FileInfo
  isSelected: boolean
  onSelect: (item: FileInfo, selected: boolean) => void
  onFolderClick?: (folder: FileInfo) => void
}) => {
  const handleCheckboxChange = () => {
    onSelect(item, !isSelected)
  }

  const handleNameClick = () => {
    if (item.itemType === ItemType.CONTAINER && onFolderClick) {
      onFolderClick(item)
    } else {
      // Handle file click - for MVP just log
      console.log('File clicked:', item)
    }
  }

  const FileIcon = () => {
    if (item.itemType === ItemType.CONTAINER) {
      return (
        <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      )
    }
    
    return (
      <Image
        src={getSourceIconUrl(item.contentType || 'application/octet-stream') || '/icons/file-default.png'}
        alt="file icon"
        width={20}
        height={20}
        className="h-5 w-5"
      />
    )
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          className="w-4 h-4 rounded border-gray-300"
        />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <Image
          src={getSourceIconUrl(item.source) || '/icons/source-default.png'}
          alt={item.source}
          width={16}
          height={16}
          className="h-4 w-4"
        />
      </td>
      
      <td className="px-6 py-4">
        <button
          onClick={handleNameClick}
          className="flex items-center space-x-2 text-left hover:text-blue-600"
        >
          <FileIcon />
          <span className="text-sm text-gray-900 truncate max-w-xs">{item.name}</span>
        </button>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {item.lastContributionTimeStamp ? formatUtcToLocal(item.lastContributionTimeStamp, 'MMM dd, yyyy HH:mm') : '-'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.status === 'Synced' 
            ? 'bg-green-100 text-green-800'
            : item.status === 'Syncing...'
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {item.status}
        </span>
      </td>
    </tr>
  )
}

// Empty state component
const EmptyState = ({ workspace }: { workspace: Workspace }) => (
  <div className="text-center py-12">
    <div className="text-gray-400 mb-4">
      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No files found
    </h3>
    <p className="text-gray-500">
      {workspace === 'personal' 
        ? 'Connect a service to start syncing your files'
        : 'No organization files available'
      }
    </p>
  </div>
)

// Loading state component
const LoadingState = () => (
  <div className="text-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
    <p className="text-gray-500">Loading files...</p>
  </div>
)

interface FileTableProps {
  items: FileInfo[]
  loading: boolean
  workspace: Workspace
  breadcrumbs: BreadcrumbItem[]
  onFolderClick: (folder: FileInfo) => void
  onBreadcrumbClick: (breadcrumb: BreadcrumbItem, index: number) => void
  selectedItemsMap: Record<string, any>
  onSelectItem: (item: FileInfo, selected: boolean) => void
  selectAllInView: boolean
  onSelectAllInView: (selected: boolean) => void
  onSearch: (query: string) => void
}

const FileTable: React.FC<FileTableProps> = ({
  items,
  loading,
  workspace,
  breadcrumbs,
  onFolderClick,
  onBreadcrumbClick,
  selectedItemsMap,
  onSelectItem,
  selectAllInView,
  onSelectAllInView,
  onSearch,
}) => {
  if (loading) {
    return <LoadingState />
  }

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        breadcrumbs={breadcrumbs}
        onBreadcrumbClick={onBreadcrumbClick}
      />

      {/* File Table */}
      {items.length === 0 ? (
        <EmptyState workspace={workspace} />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <FileTableHeader
              selectAllInView={selectAllInView}
              onSelectAllInView={onSelectAllInView}
            />
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <FileRow
                  key={item.id}
                  item={item}
                  isSelected={!!selectedItemsMap[item.id]}
                  onSelect={onSelectItem}
                  onFolderClick={onFolderClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected items info */}
      {Object.keys(selectedItemsMap).length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {Object.keys(selectedItemsMap).length} file(s) selected
          </p>
        </div>
      )}
    </div>
  )
}

export default FileTable