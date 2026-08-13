import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import supabase from '../supabaseClient'

const AuthContext = createContext(null)

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Auth request timed out')), ms)),
  ])

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    try {
      let authUser = null
      try {
        const { data: { user } } = await withTimeout(supabase.auth.getUser(), 8000)
        authUser = user
      } catch {
        const { data: { session } } = await supabase.auth.getSession()
        authUser = session?.user ?? null
      }

      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
        .timeout(8000)

      if (profile?.is_flagged) {
        await supabase.auth.signOut()
        setUser(null)
        setLoading(false)
        return
      }

      setUser(profile || null)
    } catch (err) {
      console.error('Profile fetch failed:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchProfile()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const refreshUser = async () => {
    await fetchProfile()
  }

  const applyProfile = useCallback((profile) => {
    setUser(profile || null)
    setLoading(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser, applyProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
