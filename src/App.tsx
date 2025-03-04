import { lazy, Suspense, useEffect, useState } from 'react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from './integrations/supabase/client'
import { Session } from '@supabase/supabase-js'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardSkeleton } from './components/dashboard/DashboardSkeleton'
import { AuthProvider } from './contexts/AuthContext'
import { Navbar } from './components/Navbar'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })))
const PatientsView = lazy(() => import('@/pages/PatientsView'))

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [initError, setInitError] = useState<Error | null>(null)

  useEffect(() => {
    console.log('App component mounting...');
    setIsMounted(true)
    
    const getSession = async () => {
      try {
        console.log('Fetching Supabase session...');
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Session fetch error:", error)
          setInitError(error)
          return
        }
        
        setSession(data.session)
        console.log('Session fetch successful:', data.session ? 'Session exists' : 'No session');
      } catch (error) {
        console.error("Failed to get session:", error)
        setInitError(error instanceof Error ? error : new Error(String(error)))
      } finally {
        setIsLoading(false)
      }

      try {
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log('Auth state changed:', _event);
          setSession(session)
        })

        return () => {
          console.log('Cleaning up auth listener');
          authListener?.subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error setting up auth listener:", error)
      }
    }

    getSession()
  }, [])

  if (!isMounted) {
    console.log('App waiting for mount');
    return null
  }

  if (initError) {
    console.error('App initialization error:', initError);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
        <p className="mb-4">Sorry, there was a problem initializing the application.</p>
        <p className="text-sm text-gray-600">{initError.message}</p>
        <button 
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    )
  }

  if (isLoading) {
    console.log('App in loading state');
    return <DashboardSkeleton />
  }

  console.log('App rendering routes');
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen">
          <Navbar />
          <Suspense fallback={<DashboardSkeleton />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />
              <Route 
                path="/patients" 
                element={
                  session ? (
                    <PatientsView />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              /> 
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
