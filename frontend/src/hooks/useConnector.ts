// Connector management hook - Based on src/hooks/rms_v2/useConnector.ts
// Simplified for MVP with Google Drive only

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import QueryKeyGenerator from '@/queries/QueryKeyGenerator'
import useConnectorInfo from '@/queries/useConnectorInfo'
import { Connector, UserConnectors } from '@/types/rms.type'

interface UseConnectorOptions {
  scope?: string
}

// Connector management hook 
export const useConnector = (options: UseConnectorOptions = {}) => {
  const { scope } = options
  const queryClient = useQueryClient()
  const { data: connectorInfo, isLoading, isError, error } = useConnectorInfo()

  // Set connector info manually
  const setConnectorInfo = useCallback(
    (connector: UserConnectors | null) => {
      queryClient.setQueryData(QueryKeyGenerator.connectors('personal'), connector)
    },
    [queryClient]
  )

  // Set specific connector status
  const setConnectorInfoByConnector = useCallback(
    (connector: Connector, connected: boolean, email?: string) => {
      queryClient.setQueryData(QueryKeyGenerator.connectors('personal'), (old: UserConnectors | undefined) => {
        const newConnectorInfo = {
          ...old,
          [connector]: {
            connected,
            email,
          },
        }
        return newConnectorInfo
      })
    },
    [queryClient]
  )

  // Refresh connector data
  const refreshConnectorInfo = useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: QueryKeyGenerator.connectors('personal')
    })
  }, [queryClient])

  return {
    connectorInfo,
    isLoading,
    isError,
    error,
    setConnectorInfo,
    setConnectorInfoByConnector,
    refreshConnectorInfo,
  }
}