import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState<number | null>(null)

  // 1. Check if already logged in, and listen for login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // 2. When logged in, load MY categories
  useEffect(() => {
    if (!session) return
    supabase.from('categories').select('*').then(({ data }) => setCount(data?.length ?? 0))
  }, [session])

  if (loading) return <p className="p-8">Loading...</p>
  if (!session) return <Auth />

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold text-blue-600">DailyStack</h1>
      <p>Logged in as <b>{session.user.email}</b></p>
      <p>{count === null ? 'Loading categories...' : `${count} categories`}</p>
      <button onClick={() => supabase.auth.signOut()} className="border rounded-lg px-4 py-2">
        Sign out
      </button>
    </div>
  )
}