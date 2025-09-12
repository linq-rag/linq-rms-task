import { useMutation } from '@tanstack/react-query'
import { tokenRefreshService } from '@/api/mutate'

// Token refresh mutation - from src/queries/rms_v2/useTokenRefresh.ts
function useTokenRefresh() {
  return useMutation({
    mutationFn: tokenRefreshService(),
    onError: (error) => {
      console.error('Token refresh failed:', error)
    },
  })
}

export default useTokenRefresh