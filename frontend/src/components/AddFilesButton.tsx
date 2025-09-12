import React, { Fragment, useState } from 'react'
import Image from 'next/image'

import { useGoogleDriveSync } from '@/hooks/useGoogleDriveSync'
import { Workspace, Connector } from '@/types/rms.type'
import { useConnector } from '@/hooks/useConnector'

interface AddFilesButtonProps {
  workspace: Workspace
  onAddConnector: () => void
  onError?: (error: string | null) => void
}

const AddFilesButton: React.FC<AddFilesButtonProps> = ({
  workspace,
  onAddConnector,
  onError,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { connectorInfo } = useConnector({ scope: workspace })

  const { handleGoogleDriveClick } = useGoogleDriveSync({
    onError: onError || (() => {}),
    workspace,
    closeMenu: () => setIsOpen(false),
  })

  const isGoogleDriveConnected = connectorInfo?.[Connector.GoogleDrive]?.connected ?? false

  const handleAddConnector = () => {
    setIsOpen(false)
    onAddConnector()
  }

  const handleGoogleDriveSelection = () => {
    handleGoogleDriveClick()
    // Note: closeMenu is called automatically by the hook
  }

  return (
    <div className="relative inline-block text-left shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center bg-black text-white text-sm font-medium rounded-md px-3 py-2 hover:bg-gray-800 focus:ring-2 focus:ring-blue-500"
      >
        + Add Files
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {/* Google Drive Option - only show if connected */}
              {isGoogleDriveConnected && (
                <button
                  onClick={handleGoogleDriveSelection}
                  className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Image
                    src="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png"
                    alt="Google Drive"
                    width={19}
                    height={19}
                    className="w-5 h-5 mr-3"
                  />
                  <span className="text-sm font-medium">Google Drive</span>
                </button>
              )}
              
              {/* Add Connector Option */}
              <button
                onClick={handleAddConnector}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Add a connector</span>
              </button>

              {/* Info when no connectors are available */}
              {!isGoogleDriveConnected && (
                <div className="px-4 py-3 text-xs text-gray-500 border-b border-gray-100">
                  Connect to upload files
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AddFilesButton