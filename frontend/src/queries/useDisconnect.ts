// Disconnect service mutation hook - Based on existing mutation patterns
// Simplified for MVP

import { useMutation } from '@tanstack/react-query'

import { disconnectService } from '@/api/mutate'

function useDisconnect(onMutate?: (variables: any) => void) {
  return useMutation({
    mutationFn: (params: { connector: string }) =>
      disconnectService()({
        ...params,
      }),
    onMutate,
  })
}

export default useDisconnect