import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Compass, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../features/auth/AuthProvider'
export default function AuthPage({ admin = false }: { admin?: boolean }) {
  const { user, loading } = useAuth()
  const [signup, setSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setMessage('')
    try {
      const { error } = signup
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth` },
          })
        : await supabase.auth.signInWithPassword({ email, password })
      setMessage(
        error
          ? error.message
          : signup
            ? 'Account created. Check your email to confirm your address before signing in.'
            : 'Welcome back. Your next discovery awaits.',
      )
    } catch {
      setMessage('We couldn’t reach the account service. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-container auth-page">
      <div className="panel auth-panel">
        <Compass size={44} strokeWidth={1} />
        <div className="eyebrow">{admin ? 'GUNITA · ADMIN' : 'YOUR PERSONAL HISTORY'}</div>
        <h1>
          {admin
            ? 'Admin sign-in'
            : user
              ? 'Welcome, explorer.'
              : signup
                ? 'Start your collection.'
                : 'Pick up your story.'}
        </h1>
        <p>
          {user
            ? user.email
            : admin
              ? 'Sign in with an account that has been granted admin access.'
              : 'A place for your discoveries, one expedition at a time.'}
        </p>
        {loading ? (
          <p role="status">Checking your session…</p>
        ) : user ? (
          <>
            <Link className="button primary" to="/play">
              Start exploring <ArrowRight size={17} />
            </Link>
            <Link className="button secondary" to="/admin">
              Open admin area
            </Link>
            <button
              className="text-link"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  const result = await supabase?.auth.signOut()
                  setMessage(result?.error?.message ?? 'You’ve signed out.')
                } catch {
                  setMessage('Sign out failed. Please try again.')
                } finally {
                  setBusy(false)
                }
              }}
            >
              Sign out
            </button>
          </>
        ) : !supabase ? (
          <div className="info-banner">
            <strong>Guest play is ready.</strong>
            <p>
              Accounts become available when this installation is connected to Supabase. You can
              enjoy the complete game right now.
            </p>
            <Link className="button primary" to="/play">
              Play as guest <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={submit}>
              <label>
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  minLength={8}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </label>
              <button className="button primary" disabled={busy}>
                {busy ? 'One moment…' : signup ? 'Create account' : 'Sign in'}
                <ArrowRight size={17} />
              </button>
            </form>
            <button
              className="text-link"
              onClick={() => {
                setSignup(!signup)
                setMessage('')
              }}
            >
              {signup ? 'Already have an account? Sign in' : 'New to Gunita? Create an account'}
            </button>
            <Link className="back-link" to="/play">
              Or continue as a guest →
            </Link>
          </>
        )}
        {message && (
          <p role="status" className="info-banner">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
