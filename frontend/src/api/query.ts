// API query functions - Basic query interface for MVP
// Since most operations are POST in the existing API, this provides simple GET wrappers

import API, { responseWrapper, rmsPath } from './config'
import type {
  BrowseParams,
  BrowseResponse,
  UserConnectors,
} from '@/types/rms.type'

// Get connector information
export const getConnectorInfo = async (): Promise<UserConnectors> => {
  const response = await responseWrapper(() => API.get(`/auth/connector-info`))
  // Backend returns { connector: { connectors: { ... } } }
  // We want to return just the connectors object
  return response?.connector?.connectors || {}
}

// Health check
export const healthCheck = async (): Promise<{ status: string }> => {
  return responseWrapper(() => API.get(`${rmsPath}/health`))
}

// Note: Browse files is primarily a POST operation in the existing API
// This provides a GET wrapper for simple cases, but the main browse
// functionality should use the POST method from mutate.ts
export const getBrowseFiles = async (params: {
  workspace: string
  folderId?: string
  page?: number
  per_page?: number
}): Promise<BrowseResponse> => {
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString())
    }
  })
  
  return responseWrapper(() => 
    API.get(`${rmsPath}/browse?${queryParams.toString()}`)
  )
}