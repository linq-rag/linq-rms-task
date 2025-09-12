// Custom Toast - Simplified version for MVP
// Based on existing customToast usage patterns

type ToastType = 'info' | 'success' | 'warning' | 'error'

// Simple toast implementation for MVP
// In a full implementation, you would use react-toastify or similar
export const customToast = (
  message: string,
  type: ToastType = 'info',
  duration: number = 3000
) => {
  // For MVP, we'll use console and browser alerts/notifications
  // In production, you would integrate with a proper toast library
  
  const emoji = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }

  const logLevel = {
    info: 'info',
    success: 'log',
    warning: 'warn', 
    error: 'error'
  }

  // Console output for development
  console[logLevel[type] as keyof Console](`${emoji[type]} ${message}`)

  // For demo purposes, show browser notification for errors
  if (type === 'error' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('RMS Error', {
      body: message,
      icon: '/favicon.ico'
    })
  }

  // For demo purposes, create a simple DOM toast
  if (typeof window !== 'undefined') {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50 ${
      type === 'error' ? 'bg-red-500' :
      type === 'success' ? 'bg-green-500' :
      type === 'warning' ? 'bg-yellow-500' :
      'bg-blue-500'
    }`
    toast.textContent = message
    
    document.body.appendChild(toast)
    
    // Remove toast after duration
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, duration)
  }
}

// Request notification permission on first load
if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission()
}