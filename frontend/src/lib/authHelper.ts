// Auth Helper - Based on src/lib/rms_v2/authHelper.ts
// Simplified for MVP with Google Drive only

import { getCredential, isTokenExpired, setCredential } from './credentialManager'
import { Connector } from '@/types/rms.type'

/**
 * Ensure a valid token exists for a connector - from lines 10-39
 * Simplified for MVP
 */
export async function ensureValidToken(
  connectorId: Connector,
  refreshMutate: (params: { connector: string }) => Promise<any>,
  skipCredential = false
): Promise<string | null> {
  if (!skipCredential) {
    // Check if we have a valid token in local storage
    const token = getCredential(connectorId)
    // If token exists and isn't expired, use it
    if (token && !isTokenExpired(connectorId)) {
      return token
    }
  }
  
  // If no token or expired, try to refresh it
  try {
    const response = await refreshMutate({
      connector: connectorId,
    })
    
    if (response.requires_login) {
      // Token couldn't be refreshed, user needs to re-authenticate
      return null
    }
    
    // Store the new token and return it (token from backend is encrypted)
    setCredential(connectorId, response.access_token, response.expires_in, true)
    return getCredential(connectorId)
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

/**
 * Handle the authentication code exchange - from lines 139-178
 * Simplified for Google Drive only
 */
export async function handleAuthCodeExchange(
  connectorId: Connector,
  authCode: string,
  connectMutate: (params: {
    connector: string
    auth_code: string
    code_verifier?: string
  }) => Promise<any>,
  onSuccess?: (email: string) => void,
  onError?: (error: any) => void,
  codeVerifier?: string,
  updateConnectorState?: (connector: Connector, connected: boolean, email?: string) => void
): Promise<string | null> {
  try {
    // Send the auth code to the backend for exchange
    const response = await connectMutate({
      connector: connectorId,
      auth_code: authCode,
      code_verifier: codeVerifier,
    })
    
    if (response.status === 'success' && response.access_token) {
      // Store token in local storage (token from backend is encrypted)
      setCredential(connectorId, response.access_token, response.expires_in, true)
      
      // Update connector state in React Query cache
      if (updateConnectorState && response.email) {
        updateConnectorState(connectorId, true, response.email)
      }
      
      // Call success callback if provided
      if (onSuccess && response.email) {
        onSuccess(response.email)
      }
      
      return response.email || null
    }
    
    throw new Error('Invalid response from server')
  } catch (error) {
    console.error(`Authentication failed for ${connectorId}:`, error)
    if (onError) {
      onError(error)
    }
    return null
  }
}

/**
 * Verify tokens for connectors - simplified from lines 101-127
 * For MVP, only supports Google Drive
 */
export async function verifySourceTokens(
  sources: Connector[],
  tokenRefreshMutate: (params: { connector: string }) => Promise<any>
): Promise<Record<Connector, { valid: boolean; error?: string }>> {
  // Initialize result object
  const results = sources.reduce((acc, sourceId) => {
    acc[sourceId] = { valid: false }
    return acc
  }, {} as Record<Connector, { valid: boolean; error?: string }>)
  
  // Process sources sequentially
  for (const source of sources) {
    try {
      const token = await ensureValidToken(source, tokenRefreshMutate, true)
      results[source] = {
        valid: !!token,
        error: token ? undefined : 'Token refresh failed. You may need to reconnect this service.',
      }
    } catch (error) {
      console.error(`Error validating token for ${source}:`, error)
      results[source] = {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error validating token',
      }
    }
  }
  
  return results
}