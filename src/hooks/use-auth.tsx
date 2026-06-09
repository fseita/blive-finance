import { type PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isMockMode } from '../lib/app-mode'
import { isMockLoggedIn, mockLogin, mockLogout } from '../lib/mock-store'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  login: async () => undefined,
  logout: async () => undefined,
})

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isMockMode) {
      setSession(isMockLoggedIn() ? ({ user: { email: 'demo@blive.local' } } as Session) : null)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    login: async (email, password) => {
      if (isMockMode) {
        if (!email || !password) throw new Error('Credenciais inválidas')
        mockLogin()
        setSession({ user: { email } } as Session)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setSession(data.session)
    },
    logout: async () => {
      if (isMockMode) {
        mockLogout()
        setSession(null)
        return
      }
      await supabase.auth.signOut()
      setSession(null)
    },
  }), [loading, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
