import CryptoJS from 'crypto-js'
import { Connector } from '@/types/rms.type'

// Secret key for encryption - must match backend
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is required but not set')
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

// Derive the 32-byte key using SHA-256, matching the backend
const getDerivedKey = (): CryptoJS.lib.WordArray => {
  return CryptoJS.SHA256(ENCRYPTION_KEY)
}

// Generate a random IV for each encryption operation
const getRandomIv = (): CryptoJS.lib.WordArray => {
  return CryptoJS.lib.WordArray.random(16) // 16 bytes (128 bits) random IV
}

// Encrypt data using parameters matching the backend (binary concatenation)
const encrypt = (data: string): string => {
  const key = getDerivedKey()
  const iv = getRandomIv() // Random IV for each encryption
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  
  // Get the raw ciphertext bytes (not Base64)
  const ciphertext = encrypted.ciphertext
  
  // Combine IV + ciphertext as binary (matching backend format)
  const combined = iv.concat(ciphertext)
  
  // Base64 encode the combined binary data
  return CryptoJS.enc.Base64.stringify(combined)
}

// Decrypt data using parameters matching the backend 
export const decrypt = (encryptedBase64: string): string => {
  const key = getDerivedKey()
  // Base64 decode to get binary data
  const encryptedBinary = CryptoJS.enc.Base64.parse(encryptedBase64)
  
  // Extract IV (first 16 bytes) and ciphertext (remaining bytes)
  const iv = CryptoJS.lib.WordArray.create(encryptedBinary.words.slice(0, 4), 16) // 16 bytes = 4 words
  const ciphertext = CryptoJS.lib.WordArray.create(encryptedBinary.words.slice(4), encryptedBinary.sigBytes - 16)
  
  // Convert ciphertext to Base64 for CryptoJS.AES.decrypt
  const ciphertextBase64 = CryptoJS.enc.Base64.stringify(ciphertext)
  
  // Decrypt using the extracted IV
  const decrypted = CryptoJS.AES.decrypt(ciphertextBase64, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}

// Token scope type for auxiliary tokens
type TokenScope = 'main' | string

// Create a more obscure key for storage with optional scope
const getStorageKey = (source: Connector, scope: TokenScope = 'main'): string => {
  const sourceHash = CryptoJS.MD5(source).toString().substring(0, 8)
  const scopeHash = scope === 'main' ? '' : `_${CryptoJS.MD5(scope).toString().substring(0, 6)}`
  return `c_${sourceHash}${scopeHash}`
}

// Create a more obscure key for expiry with optional scope
const getExpiryKey = (source: Connector, scope: TokenScope = 'main'): string => {
  const sourceHash = CryptoJS.MD5(source).toString().substring(0, 8)
  const scopeHash = scope === 'main' ? '' : `_${CryptoJS.MD5(scope).toString().substring(0, 6)}`
  return `e_${sourceHash}${scopeHash}`
}

// Get a credential token with optional scope
export const getCredential = (source: Connector, scope: TokenScope = 'main'): string | null => {
  const storageType = scope === 'main' ? localStorage : sessionStorage
  const encryptedToken = storageType.getItem(getStorageKey(source, scope))
  if (!encryptedToken) return null
  try {
    return decrypt(encryptedToken)
  } catch (error) {
    console.error(`Error decrypting ${scope} token for ${source}:`, error)
    storageType.removeItem(getStorageKey(source, scope))
    return null
  }
}

// Get expiry time for a token with optional scope
export const getTokenExpiry = (source: Connector, scope: TokenScope = 'main'): number | null => {
  const storageType = scope === 'main' ? localStorage : sessionStorage
  const encryptedExpiry = storageType.getItem(getExpiryKey(source, scope))
  if (!encryptedExpiry) return null
  try {
    const decryptedExpiry = decrypt(encryptedExpiry)
    return parseInt(decryptedExpiry)
  } catch (error) {
    console.error(`Error decrypting ${scope} expiry time for ${source}:`, error)
    storageType.removeItem(getExpiryKey(source, scope))
    return null
  }
}

// Set a credential with expiry and optional scope
export const setCredential = (
  source: Connector,
  token: string | null,
  expiresInSeconds?: number,
  isEncrypted = false, // Flag indicating if 'token' param is already encrypted (from backend)
  scope: TokenScope = 'main'
): void => {
  const storageType = scope === 'main' ? localStorage : sessionStorage

  if (token) {
    // If token is already encrypted from backend, decrypt it first to get the raw token
    let actualToken = token
    if (isEncrypted) {
      try {
        actualToken = decrypt(token)
      } catch (error) {
        console.error(
          `CRITICAL: Error decrypting ${scope} token received from backend for ${source}:`,
          error
        )
        console.error(`Received encrypted token was: ${token}`)
        storageType.removeItem(getStorageKey(source, scope))
        storageType.removeItem(getExpiryKey(source, scope))
        return
      }
    }
    // Encrypt the actual raw token before storing
    const encryptedToken = encrypt(actualToken)
    storageType.setItem(getStorageKey(source, scope), encryptedToken)
    
    // If expiry is provided, encrypt and store it
    if (expiresInSeconds !== undefined && expiresInSeconds !== null) {
      const expiryTime = Date.now() + expiresInSeconds * 1000
      const encryptedExpiry = encrypt(expiryTime.toString())
      storageType.setItem(getExpiryKey(source, scope), encryptedExpiry)
    } else {
      storageType.removeItem(getExpiryKey(source, scope))
    }
  } else {
    // Clear token and expiry if token is null
    storageType.removeItem(getStorageKey(source, scope))
    storageType.removeItem(getExpiryKey(source, scope))
  }
}

// Check if a token is expired with optional scope
export const isTokenExpired = (source: Connector, scope: TokenScope = 'main'): boolean => {
  const expiryTime = getTokenExpiry(source, scope)
  if (!expiryTime) return true
  return Date.now() > expiryTime
}

// Clear credentials for a specific source and scope
export const clearCredentials = (source: Connector, scope?: TokenScope): void => {
  if (scope) {
    // Clear specific scope
    const storageType = scope === 'main' ? localStorage : sessionStorage
    storageType.removeItem(getStorageKey(source, scope))
    storageType.removeItem(getExpiryKey(source, scope))
  } else {
    // Clear main tokens
    localStorage.removeItem(getStorageKey(source, 'main'))
    localStorage.removeItem(getExpiryKey(source, 'main'))

    // Clear all auxiliary tokens for this source
    const sourceHash = CryptoJS.MD5(source).toString().substring(0, 8)
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && (key.startsWith(`c_${sourceHash}_`) || key.startsWith(`e_${sourceHash}_`))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key))
  }
}

// Clear all credentials
export const clearAllCredentials = (): void => {
  // Get all connector values and clear each one
  const connectorValues = Object.values(Connector) as Connector[]
  for (const source of connectorValues) {
    clearCredentials(source)
  }
}