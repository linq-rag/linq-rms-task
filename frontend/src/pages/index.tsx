import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'

import Dashboard from '@/components/Dashboard'
import ChatPlaceholder from '@/components/ChatPlaceholder'

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

const RmsMvpLanding: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-start pt-12 px-4 lg:px-0 pb-24 mx-auto lg:max-w-[1060px] 2xl:max-w-[1060px] h-full overflow-auto">
      {/* Title Section */}
      <div className="text-center text-3xl font-medium text-gray-900 mb-8">
        Linq Alpha RMS Task
      </div>

      {/* Chat Section */}
      <div className="mt-6 w-full max-w-4xl">
        <ChatPlaceholder />
      </div>

      {/* Dashboard Section */}
      <div className="mt-10 w-full">
        <Dashboard />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">      
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID || ''}>
          <RmsMvpLanding />
        </GoogleOAuthProvider>
      </QueryClientProvider>
    </div>
  )
}