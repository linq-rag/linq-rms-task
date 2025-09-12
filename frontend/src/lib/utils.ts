import { format, parseISO } from 'date-fns'

/**
 * Format UTC timestamp to local time string
 * Based on src/lib/utils.ts
 */
export function formatUtcToLocal(
  utcTimestamp: string | number,
  formatString: string = 'MMM dd, yyyy HH:mm'
): string {
  try {
    const date = typeof utcTimestamp === 'string' ? parseISO(utcTimestamp) : new Date(utcTimestamp)
    return format(date, formatString)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

/**
 * Create presigned URL (simplified for MVP)
 */
export function createPresignedUrl(baseUrl: string, params: Record<string, string>): string {
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })
  return url.toString()
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}