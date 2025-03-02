import { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from './integrations/supabase/client'
import { Session } from '@supabase/supabase-js'
import { AuthContextProvider } from './contexts/AuthContext'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { LandingPage } from './pages/LandingPage'
import { DashboardSkeleton } from './components/dashboard/DashboardSkeleton'
import PatientsView from "@/pages/PatientsView";

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <BrowserRouter>
      <AuthContextProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth"
            element={
              <div className="flex justify-center items-center h-screen">
                <Auth
                  supabaseClient={supabase}
                  appearance={{ theme: ThemeSupa }}
                  session={session}
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
          <Route path="/patients" element={<PatientsView />} />
        </Routes>
      </AuthContextProvider>
    </BrowserRouter>
  )
}

export default App
