
import { lazy, Suspense, useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from './integrations/supabase/client'
import { Session } from '@supabase/supabase-js'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardSkeleton } from './components/dashboard/DashboardSkeleton'

// Lazy load components that aren't needed for initial render
const Dashboard = lazy(() => import('./pages/Dashboard'))
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })))
const PatientsView = lazy(() => import('@/pages/PatientsView'))

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
      } catch (error) {
        console.error("Failed to get session:", error)
      } finally {
        setIsLoading(false)
      }

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
      })

      return () => {
        authListener?.subscription.unsubscribe()
      }
    }

    getSession()
  }, [])

  // Don't render anything until the component is mounted
  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<DashboardSkeleton />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth"
            element={
              <div className="flex justify-center items-center h-screen">
                <Auth
                  supabaseClient={supabase}
                  appearance={{ theme: ThemeSupa }}
                  providers={['google', 'github']}
                  redirectTo="http://localhost:5173/dashboard"
                />
              </div>
            }
          />
          <Route
            path="/dashboard"
            element={
              session ? (
                <Dashboard />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route 
            path="/patients" 
            element={
              session ? (
                <PatientsView />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          /> 
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
