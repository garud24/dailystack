import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-3xl font-bold text-blue-600">DailyStack</h1>
        <p className="text-gray-500">{mode === 'signin' ? 'Sign in' : 'Create an account'}</p>

        <input
          type="email" placeholder="Email" required value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg p-3"
        />
        <input
          type="password" placeholder="Password (min 6 chars)" required minLength={6} value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border rounded-lg p-3"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button disabled={busy} className="w-full bg-blue-600 text-white rounded-lg p-3 disabled:opacity-50">
          {busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full text-sm text-blue-600"
        >
          {mode === 'signin' ? "No account? Sign up" : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}