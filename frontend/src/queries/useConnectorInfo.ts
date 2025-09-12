// Connector info query hook - Replaces useUserData
// Focused on connector state management

import { useQuery } from '@tanstack/react-query'

import QueryKeyGenerator from './QueryKeyGenerator'
import { getConnectorInfo } from '@/api/query'
import { UserConnectors } from '@/types/rms.type'

function useConnectorInfo() {
  return useQuery<UserConnectors>({
    queryKey: QueryKeyGenerator.connectors('personal'),
    queryFn: () => getConnectorInfo(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export default useConnectorInfo