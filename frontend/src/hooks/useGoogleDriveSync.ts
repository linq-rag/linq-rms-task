import { useState, useEffect } from 'react'

import {
  Connector,
  FileInfo,
  StatusType,
  Workspace,
  ItemType,
} from '@/types/rms.type'
import { connectors } from '@/lib/connectors'
import { useConnectorLogin } from '@/hooks/useConnectorLogin'
import useUpload from '@/queries/useUpload'
import useTokenRefresh from '@/queries/useTokenRefresh'
import { ensureValidToken } from '@/lib/authHelper'
import { customToast } from '@/lib/customToast'
import { useRmsFiles } from '@/hooks/useRmsFiles'
import { useOptimisticFiles } from '@/hooks/useOptimisticFiles'

interface UseGoogleDriveSyncProps {
  onError: (error: string | null) => void
  workspace: Workspace
  closeMenu?: () => void
}

interface UseGoogleDriveSyncReturn {
  handleGoogleDriveClick: () => void
  pickerApiLoaded: boolean
}

export const useGoogleDriveSync = ({
  onError,
  workspace,
  closeMenu,
}: UseGoogleDriveSyncProps): UseGoogleDriveSyncReturn => {
  const [pickerApiLoaded, setPickerApiLoaded] = useState<boolean>(false)
  
  // React Query hooks
  const { mutateAsync: uploadFilesMutate } = useUpload()
  const { mutateAsync: tokenRefreshMutate } = useTokenRefresh()
  const { addItemsOptimistically } = useOptimisticFiles()
  
  // Custom hooks
  const { currentBrowseParams } = useRmsFiles()
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ''

  // This login function will be used if we need to get a new token
  const { initiateLogin } = useConnectorLogin(
    () => {
      // Success callback - open picker after login
      if (pickerApiLoaded) {
        setTimeout(() => createPicker(), 500)
      }
    },
    true // show toasts
  )

  // Load Google Picker API
  useEffect(() => {
    const loadGoogleApi = () => {
      // Check if already loaded
      if (window.gapi && window.google?.picker) {
        setPickerApiLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        window.gapi.load('picker', () => {
          setPickerApiLoaded(true)
        })
      }
      script.onerror = () => {
        console.error('Failed to load Google API script')
        onError('Failed to load Google Picker API')
      }
      document.body.appendChild(script)
    }

    loadGoogleApi()
  }, [onError])

  // Create Google Picker
  const createPicker = async () => {
    try {
      // Use auth helper to ensure we have a valid token
      const token = await ensureValidToken(Connector.GoogleDrive, tokenRefreshMutate)

      // If no token is returned, we need to authenticate
      if (!token) {
        onError('Authentication required. Please login again.')
        initiateLogin(Connector.GoogleDrive)
        return
      }

      if (!GOOGLE_API_KEY || !pickerApiLoaded) {
        onError('Google Picker API not available or API key missing')
        return
      }

      // Create different views for the picker
      const rootView = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setParent('root')
        .setOwnedByMe(true)
        .setLabel('My Drive')

      const sharedWithMeView = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setOwnedByMe(false)
        .setLabel('Shared with Me')

      const starredView = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setStarred(true)
        .setLabel('Starred')

      const picker = new window.google.picker.PickerBuilder()
        .addView(rootView)
        .addView(sharedWithMeView)
        .addView(starredView)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .setSelectableMimeTypes(
          'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet,application/vnd.google-apps.presentation,application/vnd.google-apps.folder'
        )
        .setOAuthToken(token)
        .setDeveloperKey(GOOGLE_API_KEY)
        .setCallback((data: any) => pickerCallback(data))
        .setTitle(connectors.googleDrive.name)
        .build()

      picker.setVisible(true)
    } catch (error) {
      console.error('Error creating picker:', error)
      onError('Failed to initialize picker')
    }
  }

  // Handle picker selection
  const pickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const selectedFiles: FileInfo[] = data.docs.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        contentType: doc.mimeType,
        itemType: doc.mimeType === 'application/vnd.google-apps.folder' 
          ? ItemType.CONTAINER 
          : ItemType.DOCUMENT,
        source: Connector.GoogleDrive,
        status: StatusType.SYNCING,
        workspace,
        lastModified: doc.lastEditedUtc 
          ? new Date(doc.lastEditedUtc).toISOString()
          : new Date().toISOString(),
      }))

      // Upload the selected files
      uploadItems(selectedFiles)
    }
  }

  // Upload items to backend
  const uploadItems = async (items: FileInfo[]) => {
    try {
      // Add items to UI optimistically
      addItemsOptimistically(items, currentBrowseParams)
      closeMenu?.()
      
      // Start the upload process
      uploadFilesMutate(
        {
          items,
          workspace,
        },
        {
          onSuccess: () => {
            customToast(
              `${items.length} file(s) are syncing in the background and will appear shortly.`,
              'info',
              5000
            )
          },
          onError: (error) => {
            console.error('Upload error:', error)
            customToast('Some files failed to upload. Please check status.', 'error', 5000)
          },
        }
      )
    } catch (error) {
      console.error('Error setting up upload:', error)
      onError(error instanceof Error ? error.message : 'An error occurred during upload setup')
    }
  }

  // Button click handler
  const handleGoogleDriveClick = () => {
    // Use auth helper to get a valid token
    ensureValidToken(Connector.GoogleDrive, tokenRefreshMutate)
      .then((token) => {
        if (token) {
          // We have a valid token, create the picker
          createPicker()
        } else {
          // We need to authenticate
          initiateLogin(Connector.GoogleDrive)
        }
      })
      .catch((error) => {
        console.error('Error checking token:', error)
        onError('Authentication check failed')
      })
  }

  return {
    handleGoogleDriveClick,
    pickerApiLoaded,
  }
}

// Add type declarations for the Google Picker API
declare global {
  interface Window {
    gapi: any
    google: any
  }
}