import { useCallback } from 'react'
import { useGoogleLogin, CodeResponse } from '@react-oauth/google'

import { Connector } from '@/types/rms.type'
import { connectors, getConnectorNameByType } from '@/lib/connectors'
import { handleAuthCodeExchange } from '@/lib/authHelper'
import useConnect from '@/queries/useConnect'
import { useConnector } from '@/hooks/useConnector'
import { customToast } from '@/lib/customToast'

/**
 * Hook for initiating login flows for different connectors
 * @param onSuccessCallback Optional callback function to run after successful connection
 * @param showToasts Whether to show toast notifications (default: true)
 */
export function useConnectorLogin(onSuccessCallback?: () => void, showToasts = true) {
  const { mutateAsync: connectServiceMutate } = useConnect()
  const { setConnectorInfoByConnector } = useConnector()

  // Success handler that handles both toast and callback
  const handleSuccess = (connectorName: Connector, _email: string): void => {
    if (showToasts) {
      customToast(`${getConnectorNameByType(connectorName)} connected!`, 'success')
    }
    if (onSuccessCallback) {
      onSuccessCallback()
    }
  }

  // Error handler for login failures
  const handleError = (connectorName: Connector, error: unknown): void => {
    console.error(`${connectorName} login failed:`, error)
    if (showToasts) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      customToast(
        `Failed to connect ${getConnectorNameByType(connectorName)}: ${errorMessage}`,
        'error'
      )
    }
  }

  // Helper function to create Google OAuth handlers
  const createGoogleHandler = (connectorType: Connector.GoogleDrive) => ({
    onSuccess: async (codeResponse: CodeResponse) => {
      try {
        // Wrapper function to match expected interface
        const connectWrapper = async (params: {
          connector: string
          auth_code: string
          code_verifier?: string
        }) => {
          return await connectServiceMutate({
            connector: connectorType,
            auth_code: params.auth_code,
            code_verifier: params.code_verifier,
          })
        }

        await handleAuthCodeExchange(
          connectorType,
          codeResponse.code,
          connectWrapper,
          (email: string) => handleSuccess(connectorType, email),
          (error: unknown) => handleError(connectorType, error),
          undefined, // codeVerifier
          setConnectorInfoByConnector // updateConnectorState
        )
      } catch (error) {
        handleError(connectorType, error)
      }
    },
    onError: (error: unknown) => handleError(connectorType, error || 'Login failed'),
    scope: connectors[connectorType].oauthScope,
    flow: 'auth-code' as const,
    select_account: true,
    include_granted_scopes: false,
  })

  // Create Google OAuth handler
  const googleDriveLoginHandler = useGoogleLogin(createGoogleHandler(Connector.GoogleDrive))

  // Main login function that routes to the appropriate handler
  const initiateLogin = useCallback(
    (source: Connector): void => {
      switch (source) {
        case Connector.GoogleDrive:
          googleDriveLoginHandler()
          break
        default:
          console.error(`No login handler available for connector: ${source}`)
          if (showToasts) {
            customToast(`Cannot authenticate with ${source}: Login not implemented`, 'error')
          }
      }
    },
    [googleDriveLoginHandler, showToasts]
  )

  return { initiateLogin }
}