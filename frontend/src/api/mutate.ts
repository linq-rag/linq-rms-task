// API mutation functions - Based on src/api/rms_v2_processing/mutate.ts
// Simplified for MVP with Google Drive only

import API, { responseWrapper, rmsPath } from './config'
import type {
  Workspace,
  BrowseParams,
  ConnectParams,
  SyncParams,
  DeleteParams,
  UploadParams,
  Connector,
} from '@/types/rms.type'

// Browse/List files - extracted from lines 6-8
export const browseFiles = () => async (params: BrowseParams) => {
  return await responseWrapper(() => API.post(`${rmsPath}/browse`, { ...params }))
}

// Upload files - extracted from lines 11-17
export const uploadFiles = () => async (params: UploadParams) => {
  return await responseWrapper(() =>
    API.post(`${rmsPath}/upload`, {
      ...params,
    })
  )
}

// Delete files - extracted from lines 20-26
export const deleteFiles = () => async (params: DeleteParams) => {
  return await responseWrapper(() =>
    API.post(`${rmsPath}/delete`, {
      ...params,
    })
  )
}

// Sync folders - extracted from lines 29-35
export const syncFiles = () => async (params: SyncParams) => {
  return await responseWrapper(() =>
    API.post(`${rmsPath}/sync`, {
      ...params,
    })
  )
}

// Token refresh service - extracted from lines 37-43
export const tokenRefreshService = () => async (params: { connector: string }) => {
  return await responseWrapper(() =>
    API.post(`/auth/token-refresh`, {
      ...params,
    })
  )
}

// Connect service - extracted from lines 63-76, simplified for Google Drive
export const connectService = () => async (params: ConnectParams) => {
  return await responseWrapper(() =>
    API.post(`/auth/connect`, {
      ...params,
    })
  )
}

// Disconnect service - extracted from lines 79-85
export const disconnectService = () => async (params: { connector: string }) => {
  return await responseWrapper(() =>
    API.post(`/auth/disconnect`, {
      ...params,
    })
  )
}

// Get user data - extracted from lines 88-90
export const getUserData = () => async () => {
  return await responseWrapper(() => API.post(`${rmsPath}/user`))
}

// Get users list - extracted from lines 93-95
export const getUsers = () => async () => {
  return await responseWrapper(() => API.post(`${rmsPath}/users`))
}

// Get document - extracted from lines 97-108, simplified
export const getDocument = () => async (documentId: string, workspace: Workspace, source: Connector) => {
  return await responseWrapper<any>(() =>
    API.get(`${rmsPath}/document`, {
      params: {
        documentId,
        workspace,
        source,
      },
    })
  )
}