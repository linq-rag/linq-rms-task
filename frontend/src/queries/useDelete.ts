// Delete files mutation hook - Based on existing mutation patterns
// Simplified for MVP

import { useMutation } from '@tanstack/react-query'

import { deleteFiles } from '@/api/mutate'
import { DeleteParams } from '@/types/rms.type'

function useDelete(onMutate?: (variables: any) => void) {
  return useMutation({
    mutationFn: (params: DeleteParams) =>
      deleteFiles()({
        ...params,
      }),
    onMutate,
  })
}

export default useDelete