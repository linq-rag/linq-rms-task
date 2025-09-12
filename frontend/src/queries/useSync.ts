// Sync files mutation hook - Based on existing mutation patterns
// Simplified for MVP

import { useMutation } from '@tanstack/react-query'

import { syncFiles } from '@/api/mutate'
import { SyncParams } from '@/types/rms.type'

function useSync(onMutate?: (variables: any) => void) {
  return useMutation({
    mutationFn: (params: SyncParams) =>
      syncFiles()({
        ...params,
      }),
    onMutate,
  })
}

export default useSync