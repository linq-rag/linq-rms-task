// Icon utilities - Based on src/lib/rms_v2/icons.ts 
// Simplified for MVP with Google Drive only

import { ContentType, Connector } from '@/types/rms.type'

// Extract from lines 3-14: MIME type detection from filename
export const getMimeTypeFromFilename = (filename: string): ContentType => {
  const ext = filename.split('.').pop()?.toLowerCase()

  const mimeTypes: { [key: string]: ContentType } = {
    pdf: ContentType.PDF,
    docx: ContentType.DOCX,
    xlsx: ContentType.XLSX,
    pptx: ContentType.PPTX,
  }

  return mimeTypes[ext || ''] || ContentType.OCTET_STREAM
}

// Extract from lines 16-58: Icon URL generation based on MIME type
export const getIconUrl = (mimeType: string): string => {
  // Normalize mimeType to handle case sensitivity - line 18
  const normalizedMimeType = mimeType.toLowerCase()

  // Common MIME types and their icons - lines 21-40
  const mimeTypeIcons: { [key: string]: string } = {
    'application/vnd.google-apps.folder':
      'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.folder',
    'application/pdf': 'https://drive-thirdparty.googleusercontent.com/32/type/application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.spreadsheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.presentation',
    'application/vnd.google-apps.document':
      'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet':
      'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation':
      'https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.presentation',
    'text/plain': 'https://drive-thirdparty.googleusercontent.com/16/type/text/plain',
    'image/jpeg': 'https://drive-thirdparty.googleusercontent.com/16/type/image/jpeg',
    'image/png': 'https://drive-thirdparty.googleusercontent.com/16/type/image/png',
    'video/mp4': 'https://drive-thirdparty.googleusercontent.com/16/type/video/mp4',
    'audio/mpeg': 'https://drive-thirdparty.googleusercontent.com/16/type/audio/mp3',
  }

  // Check for general type matches - lines 43-52
  const generalType = normalizedMimeType.split('/')[0]
  if (generalType === 'image') {
    return 'https://drive-thirdparty.googleusercontent.com/16/type/image/jpeg'
  }
  if (generalType === 'video') {
    return 'https://drive-thirdparty.googleusercontent.com/16/type/video/mp4'
  }
  if (generalType === 'audio') {
    return 'https://drive-thirdparty.googleusercontent.com/16/type/audio/mp3'
  }

  // Return specific icon or generic fallback - lines 54-57
  return (
    mimeTypeIcons[normalizedMimeType] ||
    `https://drive-thirdparty.googleusercontent.com/16/type/${normalizedMimeType}`
  )
}

// Extract from lines 60-72: Source icon mapping, simplified for Google Drive only
export const getSourceIconUrl = (source: string): string | undefined => {
  const sourceIcons: { [key: string]: string } = {
    [Connector.GoogleDrive]: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png',
  }

  return sourceIcons[source]
}