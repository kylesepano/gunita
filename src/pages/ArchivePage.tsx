import { useState, useEffect } from 'react'
import { Search, ArrowUpRight, MapPin } from 'lucide-react'
import { useCatalog } from '../stores/catalogStore'
export default function ArchivePage() {
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState('all')
  const catalog = useCatalog()
  const refreshCatalog = catalog.refresh
  useEffect(() => {
    void refreshCatalog()
  }, [refreshCatalog])
  const filtered = catalog.events.filter(
    (e) =>
      (scope === 'all' || e.scope === scope) &&
      `${e.title} ${e.person.name} ${e.location}`.toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <div className="page-container archive-page">
      <div className="page-title">
        <div className="eyebrow">THE GUNITA COLLECTION · VOL. 01</div>
        <h1>Every moment has a story.</h1>
        <p>Explore the question library. Follow a source. Find a new perspective.</p>
      </div>
      <div className="archive-filters">
        <label>
          <Search size={18} />
          <span className="sr-only">Search history</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, people, places…"
          />
        </label>
        <select
          aria-label="Filter history scope"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value="all">All history</option>
          <option value="philippines">Philippine history</option>
          <option value="world">World history</option>
        </select>
      </div>
      <div className="archive-grid">
        {filtered.map((e) => (
          <article className="archive-card" key={e.id}>
            <div className="archive-year">
              {e.year}
              <span>{e.scope === 'philippines' ? 'PHILIPPINE HISTORY' : 'WORLD HISTORY'}</span>
            </div>
            <h2>{e.title}</h2>
            <div className="archive-location">
              <MapPin size={14} />
              {e.location}
            </div>
            <p>{e.description}</p>
            {e.note && (
              <details>
                <summary>Content & interpretation note</summary>
                <p>{e.note}</p>
              </details>
            )}
            <a className="text-link" href={e.source} target="_blank" rel="noreferrer">
              Explore the source <ArrowUpRight size={15} />
            </a>
          </article>
        ))}
      </div>
      {catalog.loading && <p role="status">Loading the library…</p>}
      {catalog.error && (
        <div className="info-banner" role="alert">
          {catalog.error}
          <button className="text-link" onClick={() => void catalog.refresh()}>
            Try again
          </button>
        </div>
      )}
      {!catalog.loading && !catalog.error && !filtered.length && (
        <div className="panel">No chapters match your search. Try another person or place.</div>
      )}
    </div>
  )
}
