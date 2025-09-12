// Connect service mutation hook - Based on src/queries/rms_v2/useConnect.ts
// Simplified for MVP

import { useMutation } from '@tanstack/react-query'

import { connectService } from '@/api/mutate'
import { ConnectParams } from '@/types/rms.type'

// Connect service mutation - from lines 5-13
function useConnect(onMutate?: (variables: any) => void) {
  return useMutation({
    mutationFn: (params: ConnectParams) =>
      connectService()(params),
    onMutate,
  })
}

export default useConnect