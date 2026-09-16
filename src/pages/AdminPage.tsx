import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../features/auth/AuthProvider'
import { supabase } from '../lib/supabase'
import AuthPage from './AuthPage'
import { AdminWorkspace } from '../features/admin/AdminWorkspace'
export default function AdminPage() {
  const { user, loading } = useAuth()
  const [access, setAccess] = useState<{ userId: string; allowed: boolean; error: string }>({
    userId: '',
    allowed: false,
    error: '',
  })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!supabase || !user) return
    let active = true
    Promise.resolve(supabase.rpc('is_admin'))
      .then(({ data, error }) => {
        if (active)
          setAccess({
            userId: user.id,
            allowed: data === true && !error,
            error: error?.message ?? '',
          })
      })
      .catch(() => {
        if (active)
          setAccess({
            userId: user.id,
            allowed: false,
            error: 'Could not verify admin access. Please try again.',
          })
      })
    return () => {
      active = false
    }
  }, [user, retry])
  if (!supabase)
    return (
      <div className="page-container admin-setup panel">
        <ShieldCheck size={40} />
        <h1>Admin sign-in</h1>
        <p>
          Connect your Supabase project to enable secure admin accounts and question management.
        </p>
        <ol>
          <li>
            Add your project settings to <code>.env.local</code>.
          </li>
          <li>Apply the database migrations and seed.</li>
          <li>
            Create your account, then grant it the admin role using the SQL in{' '}
            <code>docs/ADMIN.md</code>.
          </li>
        </ol>
        <p>
          Admin access is verified by the database. Guest accounts cannot change the question
          library.
        </p>
        <Link className="button secondary" to="/archive">
          View the current library
        </Link>
      </div>
    )
  if (loading)
    return (
      <div className="page-container" role="status">
        Checking your account…
      </div>
    )
  if (!user) return <AuthPage admin />
  if (access.userId !== user.id)
    return (
      <div className="page-container" role="status">
        Verifying admin access…
      </div>
    )
  if (!access.allowed)
    return (
      <div className="page-container admin-setup panel">
        <ShieldCheck size={40} />
        <h1>{access.error ? 'Could not verify access.' : 'Admin access required.'}</h1>
        <p>
          {access.error ||
            `${user.email} is signed in, but this account has not been granted the admin role.`}
        </p>
        {access.error && (
          <button className="button secondary" onClick={() => setRetry((r) => r + 1)}>
            Try again
          </button>
        )}
        <Link className="button primary" to="/auth">
          Manage account or sign out
        </Link>
        <Link className="text-link" to="/">
          Return home
        </Link>
      </div>
    )
  return <AdminWorkspace />
}
