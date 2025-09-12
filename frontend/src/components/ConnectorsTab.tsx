import React, { useState } from 'react'
import Image from 'next/image'

import { Connector } from '@/types/rms.type'
import { useConnector } from '@/hooks/useConnector'
import { useConnectorLogin } from '@/hooks/useConnectorLogin'
import useDisconnect from '@/queries/useDisconnect'
import { customToast } from '@/lib/customToast'

interface ConnectorCardProps {
  title: string
  description: string
  isConnected: boolean
  connectorId: Connector
  onConnect: () => void
  onDisconnect: () => void
}

const ConnectorCard: React.FC<ConnectorCardProps> = ({
  title,
  description,
  isConnected,
  onConnect,
  onDisconnect,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Image
            src="https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.folder"
            alt="Google Drive"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>

        {isConnected ? (
          <div className="flex items-center space-x-2">
            <span className="px-3 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-200 rounded-md">
              Connected
            </span>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 rounded-md"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={() => {
                      setShowConfirmation(true)
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Connect
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Confirm Disconnect</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to disconnect {title}? This will remove all associated files from your account.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                onClick={() => {
                  onDisconnect()
                  setShowConfirmation(false)
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ConnectorsTab: React.FC = () => {
  const { connectorInfo, setConnectorInfoByConnector } = useConnector({ scope: 'personal' })
  const { initiateLogin } = useConnectorLogin(
    () => {
      customToast('Successfully connected to Google Drive!', 'success')
    },
    true
  )
  
  const { mutateAsync: disconnectMutate } = useDisconnect()

  const handleConnect = (connectorId: Connector) => {
    initiateLogin(connectorId)
  }

  const handleDisconnect = async (connectorId: Connector) => {
    try {
      await disconnectMutate({ connector: connectorId })
      // Update connector state in React Query cache
      setConnectorInfoByConnector(connectorId, false)
      customToast('Disconnected successfully', 'success')
    } catch (error) {
      console.error('Disconnect failed:', error)
      customToast('Failed to disconnect', 'error')
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Services</h2>
      </div>

      {/* Cloud Storage Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Drive Connectors</h3>
        
        <div className="space-y-4">
          <ConnectorCard
            title="Google Drive"
            description="Access your Google Drive files and folders"
            isConnected={connectorInfo?.[Connector.GoogleDrive]?.connected ?? false}
            connectorId={Connector.GoogleDrive}
            onConnect={() => handleConnect(Connector.GoogleDrive)}
            onDisconnect={() => handleDisconnect(Connector.GoogleDrive)}
          />
        </div>
      </div>
    </div>
  )
}

export default ConnectorsTab