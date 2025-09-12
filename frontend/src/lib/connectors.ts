// Connectors configuration - Based on src/lib/rms_v2/connectors.config.ts
// Simplified for MVP with Google Drive only

import { Connector } from '@/types/rms.type'

interface ConnectorConfig {
  id: Connector
  name: string
  description: string
  isAvailable: boolean
  icon: string
  oauthScope: string
  pickerScope?: string
  fileBaseUrl?: string
  folderBaseUrl?: string
  downloadBaseUrl?: string
}

// Google Drive connector configuration - extracted from lines 36-49
export const googleDriveConnector: ConnectorConfig = {
  id: Connector.GoogleDrive,
  name: 'Google Drive',
  description: 'Your search results include files from Google Drive.',
  isAvailable: true,
  icon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
  oauthScope:
    'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email',
  pickerScope: 'https://www.googleapis.com/auth/drive.file',
  fileBaseUrl: 'https://drive.google.com/file/d/',
  folderBaseUrl: 'https://drive.google.com/drive/folders/',
  downloadBaseUrl: 'https://drive.google.com/uc?export=download&id=',
}

// Simplified connectors map - from lines 131-136
export const connectors = {
  [Connector.GoogleDrive]: googleDriveConnector,
}

// Helper function to get connector by ID - from lines 139-141
export const getConnectorById = (id: Connector): ConnectorConfig | undefined => {
  return connectors[id]
}

// Helper to get Name by Connector Type - from lines 151-153
export const getConnectorNameByType = (id: Connector): string | undefined => {
  return connectors[id]?.name
}

// Helper function to get all available connectors - from lines 156-158
export const getAvailableConnectors = (): ConnectorConfig[] => {
  return Object.values(connectors).filter((connector) => connector.isAvailable)
}

// Type exports
export type ConnectorsMap = typeof connectors
export type ConnectorId = Connector
export { type ConnectorConfig }