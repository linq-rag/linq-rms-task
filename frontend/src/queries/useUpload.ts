// Upload files mutation hook - Based on existing mutation patterns
// Simplified for MVP

import { useMutation } from '@tanstack/react-query'

import { uploadFiles } from '@/api/mutate'
import { UploadParams } from '@/types/rms.type'

function useUpload(onMutate?: (variables: any) => void) {
  return useMutation({
    mutationFn: (params: UploadParams) =>
      uploadFiles()({
        ...params,
      }),
    onMutate,
  })
}

export default useUpload