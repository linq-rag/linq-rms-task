// API configuration - Based on src/api/rms_v2_processing/config.ts
// Simplified for MVP with Google Drive only

import axios, { AxiosError, AxiosResponse } from 'axios'

const API = axios.create({
  baseURL: process.env.BACKEND_API_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Add request interceptor - extracted from existing pattern
API.interceptors.request.use(
  function (config: any) {
    config.headers = {
      ...config.headers,
      'X-Forwarded-Host': typeof window !== 'undefined' && window.location.hostname,
    }
    config.headers = config.headers ?? {}
    config.withCredentials = true

    return config
  },
  function (error: any) {
    console.log(error)
    return Promise.reject(error)
  }
)

// Add response interceptor - extracted from existing pattern
API.interceptors.response.use(
  function (response) {
    return response
  },
  function (error) {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Response wrapper - extracted from src/api/rms_v2_processing/config.ts lines 43-77
export const responseWrapper = async <T = any>(
  block: () => Promise<AxiosResponse<any>>,
  isAlert = true
): Promise<any> => {
  try {
    const res = await block()

    // Check if response data follows the DTO format with 'response' field
    if (
      res.data &&
      typeof res.data === 'object' &&
      'response' in res.data &&
      'success' in res.data
    ) {
      // Handle error in the standardized format
      if (!res.data.success) {
        const errorMessage = res.data.message || 'Unknown error'
        console.error(`API Error: ${res.data.code || 500}`, errorMessage)
        throw new Error(errorMessage)
      }

      // Return only the response field for backward compatibility
      return res.data.response
    }

    // Return original data if it doesn't match the new format
    return res.data
  } catch (error) {
    const { response } = error as AxiosError
    if (response && isAlert) {
      console.error(`API Error: ${response.status}`, response.data)
    }
    throw error
  }
}

// RMS path - simplified for MVP
export const rmsPath = '/rms'
export default API