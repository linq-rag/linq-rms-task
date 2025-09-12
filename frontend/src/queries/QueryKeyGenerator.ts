// Query Key Generator - Based on src/queries/rms_v2/RmsV2QueryKeyGenerator.ts
// Simplified for MVP

import { BrowseParams } from '@/types/rms.type'

// Helper function: remove undefined values - from lines 4-9
function removeUndefinedValues(obj: any) {
  if (!obj) return {}
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
  )
}

export default {
  // Browse query key generator - from lines 12-24
  browse: (params: BrowseParams) => {
    const cleanFilter = removeUndefinedValues(params.filter)
    return [
      'rms_mvp',
      'browse',
      params.workspace,
      params.folderId,
      params.page,
      params.per_page,
      params.sort,
      cleanFilter,
    ] as const
  },
  
  // Connector info query key - from lines 25-27
  connectors: (scope?: string) => {
    return ['rms_mvp', 'connectors', scope] as const
  },
  
  // Document query key
  document: (documentId: string, workspace: string, source: string) => {
    return ['rms_mvp', 'document', documentId, workspace, source] as const
  },
}