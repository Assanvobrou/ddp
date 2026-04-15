import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import { CaisseProvider } from '@/context/CaisseContext'
import AppRouter from '@/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CaisseProvider>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '13px',
                fontWeight: '600',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              },
            }}
          />
        </CaisseProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
