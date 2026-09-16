import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider } from './features/auth/AuthProvider'
import LandingPage from './pages/LandingPage'
const PlayPage = lazy(() => import('./pages/PlayPage'))
const GamePage = lazy(() => import('./pages/GamePage'))
const ResultsPage = lazy(() => import('./pages/ResultsPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ArchivePage = lazy(() => import('./pages/ArchivePage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    } else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollManager />
        <Suspense
          fallback={
            <div className="loading-page" role="status">
              Opening a new chapter…
            </div>
          }
        >
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="play" element={<PlayPage />} />
              <Route path="game" element={<GamePage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="archive" element={<ArchivePage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route
                path="*"
                element={
                  <div className="page-container page-title">
                    <h1>A page lost to history.</h1>
                    <p>Let’s find your way back.</p>
                    <Link to="/" className="button primary">
                      Return home
                    </Link>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
