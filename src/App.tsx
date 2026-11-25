import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Board from './components/Board'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <p className="p-8">Loading...</p>
  if (!session) return <Auth />

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600">DailyStack</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500 hidden sm:inline">{session.user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="border border-gray-200 rounded-lg px-3 py-1 bg-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <Board />
      </main>
    </div>
  )
}