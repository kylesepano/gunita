import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
const AuthContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
})
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!!supabase)
  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active) {
          setUser(data.user)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
