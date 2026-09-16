import { Link, NavLink, Outlet } from 'react-router-dom'
import { Compass, ArrowUpRight } from 'lucide-react'
import { useAuth } from '../features/auth/AuthProvider'
export function Layout() {
  const { user } = useAuth()
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Gunita home">
          <Compass size={36} strokeWidth={1.3} />
          <span>GUNITA</span>
        </Link>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            Discover
          </NavLink>
          <Link to="/#how-it-works">How to play</Link>
          <NavLink to="/archive">
            The archive <span className="tiny-dot" />
          </NavLink>
        </nav>
        <div className="header-actions">
          <details className="mobile-menu">
            <summary>Menu</summary>
            <div>
              <Link to="/">Discover</Link>
              <Link to="/play">Play</Link>
              <Link to="/#how-it-works">How to play</Link>
              <Link to="/archive">The archive</Link>
            </div>
          </details>
          <Link to="/auth" className="sign-in">
            {user ? 'My account' : 'Sign in'} <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <Link to="/" className="footer-brand">
          <Compass size={19} /> GUNITA
        </Link>
        <span>The past has a story. Find your way into it.</span>
        <span>Made with curiosity. Rooted in history.</span>
        <Link to="/admin" className="admin-footer-link">
          Admin
        </Link>
      </footer>
    </>
  )
}
