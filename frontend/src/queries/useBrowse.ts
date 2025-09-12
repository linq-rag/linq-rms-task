// Browse files query hook - Based on src/queries/rms_v2/useBrowse.ts
// Simplified for MVP

import { useQuery } from '@tanstack/react-query'

import QueryKeyGenerator from './QueryKeyGenerator'
import { browseFiles } from '@/api/mutate'
import { BrowseParams, BrowseResponse } from '@/types/rms.type'

// Browse files query - from lines 8-16
function useBrowse(params: BrowseParams) {
  return useQuery<BrowseResponse>({
    queryKey: QueryKeyGenerator.browse(params),
    queryFn: () => browseFiles()(params),
    enabled: !!params && !!params.workspace,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export default useBrowse