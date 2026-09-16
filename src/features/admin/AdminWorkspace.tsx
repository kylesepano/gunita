import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Eye, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import { fetchCatalog } from '../../lib/catalog'
import type { CatalogEntry } from '../../lib/catalog'
import type { HistoricalEvent } from '../../types/history'
import { saveAdminEvent, removeAdminEvent } from '../../lib/admin'
import { useCatalog } from '../../stores/catalogStore'
import { AdminEventForm } from './AdminEventForm'
import { AdminQuestionPreview } from './AdminQuestionPreview'
export function AdminWorkspace() {
  const [entries, setEntries] = useState<CatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'edit' | 'preview'>('list')
  const [selected, setSelected] = useState<CatalogEntry | null>(null)
  const [remove, setRemove] = useState<CatalogEntry | null>(null)
  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setEntries(await fetchCatalog(true))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load questions.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    let active = true
    fetchCatalog(true)
      .then((result) => {
        if (active) setEntries(result)
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Could not load questions.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])
  async function save(event: HistoricalEvent, published: boolean) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await saveAdminEvent(event, published, selected?.updatedAt || null)
      setView('list')
      setSelected(null)
      await reload()
      await useCatalog.getState().refresh()
      setNotice('Question saved. Published changes appear in new games.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this question.')
    } finally {
      setBusy(false)
    }
  }
  async function confirmRemove() {
    if (!remove) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await removeAdminEvent(remove.event.id, remove.updatedAt)
      setRemove(null)
      await reload()
      await useCatalog.getState().refresh()
      setNotice('Question removed from the library. Existing game records are preserved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove this question.')
    } finally {
      setBusy(false)
    }
  }
  const filtered = entries.filter((e) =>
    `${e.event.title} ${e.event.person.name} ${e.event.location}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  return (
    <div className="page-container admin-page">
      <div className="admin-heading">
        <div>
          <div className="eyebrow">GUNITA · ADMIN</div>
          <h1>Question library</h1>
          <p>View, add, edit and remove the events used in the game.</p>
        </div>
        {view === 'list' ? (
          <button
            className="button primary"
            disabled={loading}
            onClick={() => {
              setSelected(null)
              setView('edit')
              setError('')
              setNotice('')
            }}
          >
            <Plus size={18} />
            Add question
          </button>
        ) : (
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => {
              setView('list')
              setSelected(null)
              setError('')
            }}
          >
            <ArrowLeft size={17} />
            Back to library
          </button>
        )}
      </div>
      {error && (
        <div className="info-banner" role="alert">
          {error}
          {view === 'list' && (
            <button className="text-link" onClick={() => void reload()}>
              Reload library
            </button>
          )}
        </div>
      )}
      {notice && (
        <div className="success-banner" role="status">
          {notice}
        </div>
      )}
      {view === 'edit' && (
        <AdminEventForm
          key={selected?.event.id ?? 'new'}
          entry={selected}
          busy={busy}
          onSave={save}
          onCancel={() => {
            setView('list')
            setError('')
          }}
        />
      )}
      {view === 'preview' && selected && (
        <>
          <AdminQuestionPreview event={selected.event} />
          <button className="button primary" onClick={() => setView('edit')}>
            Edit this question
          </button>
        </>
      )}
      {view === 'list' && (
        <>
          <div className="admin-summary">
            <span>
              <strong>{entries.length}</strong> questions
            </span>
            <span>
              <strong>{entries.filter((e) => e.published).length}</strong> published
            </span>
            <span>
              <strong>{entries.filter((e) => !e.published).length}</strong> drafts
            </span>
          </div>
          <label className="admin-search">
            <Search size={19} />
            <span className="sr-only">Search questions</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions, people or places"
            />
          </label>
          {loading ? (
            <p role="status">Loading questions…</p>
          ) : (
            <div className="admin-question-list">
              {filtered.map((entry) => (
                <article key={entry.event.id} className="admin-question-row">
                  <div>
                    <span className={`publication-status ${entry.published ? 'published' : ''}`}>
                      {entry.published ? 'Published' : 'Draft'}
                    </span>
                    <h2>{entry.event.title}</h2>
                    <p>
                      {entry.event.year} · {entry.event.location}
                    </p>
                  </div>
                  <div className="admin-row-actions">
                    <button
                      className="button secondary"
                      aria-label={`View ${entry.event.title}`}
                      onClick={() => {
                        setSelected(entry)
                        setView('preview')
                      }}
                    >
                      <Eye size={17} />
                      View
                    </button>
                    <button
                      className="button secondary"
                      aria-label={`Edit ${entry.event.title}`}
                      onClick={() => {
                        setSelected(entry)
                        setView('edit')
                        setError('')
                      }}
                    >
                      <Pencil size={17} />
                      Edit
                    </button>
                    <button
                      className="button danger"
                      aria-label={`Remove ${entry.event.title}`}
                      onClick={() => {
                        setRemove(entry)
                        setError('')
                      }}
                    >
                      <Trash2 size={17} />
                      Remove
                    </button>
                  </div>
                  {remove?.event.id === entry.event.id && (
                    <div
                      className="remove-confirmation"
                      role="group"
                      aria-label="Confirm question removal"
                    >
                      <p>
                        Remove <strong>{entry.event.title}</strong> from the library? It will no
                        longer appear in new games.
                      </p>
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() => setRemove(null)}
                      >
                        Keep question
                      </button>
                      <button
                        className="button danger"
                        disabled={busy}
                        onClick={() => void confirmRemove()}
                      >
                        {busy ? 'Removing…' : 'Confirm removal'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {!filtered.length && (
                <p className="panel">
                  {search
                    ? 'No questions match your search.'
                    : 'Your library is empty. Add your first question to get started.'}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
