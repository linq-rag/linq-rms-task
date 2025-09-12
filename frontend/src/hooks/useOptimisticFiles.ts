import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import QueryKeyGenerator from '@/queries/QueryKeyGenerator'
import { FileInfo, BrowseParams, StatusType } from '@/types/rms.type'

/**
 * Optimistic updates for file operations in MVP
 * Based on src/hooks/rms_v2/useOptimisticFiles.ts but simplified
 */
export function useOptimisticFiles() {
  const queryClient = useQueryClient()

  const addItemsOptimistically = useCallback(
    (items: FileInfo[], browseParams: BrowseParams) => {
      const queryKey = QueryKeyGenerator.browse(browseParams)
      const currentPage = browseParams.page || 1
      const perPage = browseParams.per_page || 20

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return { items, total: items.length, page: currentPage, per_page: perPage }

        // Create set of new item IDs
        const newItemIds = new Set(items.map((item) => item.id))

        // Filter existing items to avoid duplicates
        const existingItemsWithoutDuplicates = old.items.filter(
          (item: FileInfo) => !newItemIds.has(item.id)
        )

        if (currentPage === 1) {
          // First page: add new items at the beginning
          const combinedItems = [...items, ...existingItemsWithoutDuplicates]
          const paginatedItems = combinedItems.slice(0, perPage)

          return {
            ...old,
            items: paginatedItems,
            total: combinedItems.length,
          }
        } else {
          return {
            ...old,
            total: old.total + items.length,
          }
        }
      })
    },
    [queryClient]
  )

  /**
   * Update file status optimistically
   */
  const updateItemsOptimistically = useCallback(
    async (
      items: FileInfo[],
      browseParams: BrowseParams,
      status: StatusType = StatusType.SYNCING
    ) => {
      const queryKey = QueryKeyGenerator.browse(browseParams)

      // Cancel ongoing queries to prevent conflicts
      await queryClient.cancelQueries({ queryKey })

      // Backup current data for rollback
      const previousData = queryClient.getQueryData(queryKey)

      // Create set of item IDs for fast lookup
      const syncingItemIds = new Set(items.map((item) => item.id))

      // Update cached data immediately
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old

        return {
          ...old,
          items: old.items.map((item: FileInfo) =>
            syncingItemIds.has(item.id) ? { ...item, status } : item
          ),
        }
      })

      return { previousData, queryKey }
    },
    [queryClient]
  )

  /**
   * Rollback optimistic update on failure
   */
  const rollbackOptimisticUpdate = useCallback(
    (previousData: any, queryKey: any) => {
      if (previousData && queryKey) {
        queryClient.setQueryData(queryKey, previousData)
      }
    },
    [queryClient]
  )

  /**
   * Invalidate query to refetch from server
   */
  const invalidateQuery = useCallback(
    (browseParams: BrowseParams) => {
      const queryKey = QueryKeyGenerator.browse(browseParams)
      queryClient.invalidateQueries({ queryKey })
    },
    [queryClient]
  )

  return {
    addItemsOptimistically,
    updateItemsOptimistically,
    rollbackOptimisticUpdate,
    invalidateQuery,
  }
}