import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CatalogEntry } from '../../lib/catalog'
import type { HistoricalEvent } from '../../types/history'
import { validateEvent } from './eventValidation'
export function AdminEventForm({
  entry,
  busy,
  onSave,
  onCancel,
}: {
  entry: CatalogEntry | null
  busy: boolean
  onSave: (event: HistoricalEvent, published: boolean) => Promise<void>
  onCancel: () => void
}) {
  const e = entry?.event
  const [errors, setErrors] = useState<string[]>([])
  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    const data = new FormData(formEvent.currentTarget)
    const text = (name: string) => String(data.get(name) ?? '').trim()
    const lines = (name: string) =>
      text(name)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    const number = (name: string) => (text(name) === '' ? NaN : Number(text(name)))
    const id =
      e?.id ??
      text('title')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    const event: HistoricalEvent = {
      id,
      title: text('title'),
      clue: text('clue'),
      description: text('description'),
      year: number('year'),
      location: text('location'),
      coordinates: [number('latitude'), number('longitude')],
      scope: text('scope') as HistoricalEvent['scope'],
      country: text('country'),
      source: text('source'),
      note: text('note') || undefined,
      wherePrompt: text('wherePrompt') || undefined,
      role: text('role'),
      person: {
        id: e?.person.id ?? `person-${id}`,
        name: text('personName'),
        bio: text('personBio'),
        image: text('personImage'),
        imagePosition: text('imagePosition') || '50% 25%',
      },
      causes: lines('causes'),
      distractors: lines('distractors'),
      sequence: lines('sequence'),
    }
    const issues = validateEvent(event)
    setErrors(issues)
    if (!issues.length) await onSave(event, data.get('published') === 'on')
  }
  return (
    <form className="admin-form panel" onSubmit={submit}>
      <h2>{e ? 'Edit question' : 'Add a question'}</h2>
      <p>
        One historical event powers all six question types. Write clear clues and verify the answer
        key before publishing.
      </p>
      {errors.length > 0 && (
        <div role="alert" className="info-banner">
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <fieldset disabled={busy}>
        <legend>Event & clues</legend>
        <label>
          Event title
          <input name="title" defaultValue={e?.title} required maxLength={200} />
        </label>
        {e && <p className="small-note">Question ID: {e.id}</p>}
        <div className="admin-form-grid">
          <label>
            Year (use a negative number for BCE)
            <input
              name="year"
              type="number"
              step="1"
              min="-10000"
              max="3000"
              required
              defaultValue={e?.year}
            />
          </label>
          <label>
            Collection
            <select name="scope" defaultValue={e?.scope ?? 'world'}>
              <option value="world">World history</option>
              <option value="philippines">Philippine history</option>
            </select>
          </label>
        </div>
        <label>
          Clue shown before answering
          <textarea name="clue" rows={3} defaultValue={e?.clue} required />
        </label>
        <label>
          Historical explanation
          <textarea name="description" rows={4} defaultValue={e?.description} required />
        </label>
        <label>
          Source URL
          <input
            name="source"
            type="url"
            placeholder="https://…"
            defaultValue={e?.source}
            required
          />
        </label>
        <label>
          Uncertainty or interpretation note (optional)
          <textarea name="note" rows={2} defaultValue={e?.note} />
        </label>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Where · Location answer</legend>
        <label>
          Location name
          <input name="location" defaultValue={e?.location} required />
        </label>
        <label>
          Country or geographic region
          <input
            name="country"
            defaultValue={e?.country ?? (e?.scope === 'philippines' ? 'Philippines' : '')}
            required
          />
        </label>
        <div className="admin-form-grid">
          <label>
            Latitude
            <input
              name="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              defaultValue={e?.coordinates[0]}
              required
            />
          </label>
          <label>
            Longitude
            <input
              name="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              defaultValue={e?.coordinates[1]}
              required
            />
          </label>
        </div>
        <label>
          Specific map question (optional)
          <input
            name="wherePrompt"
            defaultValue={e?.wherePrompt}
            placeholder="Where did this story unfold?"
          />
        </label>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Who · Portrait answer</legend>
        <label>
          Question about the person
          <input
            name="role"
            defaultValue={e?.role}
            required
            placeholder="Who led this expedition?"
          />
        </label>
        <div className="admin-form-grid">
          <label>
            Person’s name
            <input name="personName" defaultValue={e?.person.name} required />
          </label>
          <label>
            Short context
            <input name="personBio" defaultValue={e?.person.bio} required />
          </label>
        </div>
        <label>
          Neutral portrait URL or local image path
          <input
            name="personImage"
            defaultValue={e?.person.image}
            required
            placeholder="https://… or /portraits/person.jpg"
          />
        </label>
        <p className="small-note">
          Choose a plain portrait without a uniform, tools, insignia or a setting that reveals the
          answer. Use a licensed image you control and retain its credit.
        </p>
        <label>
          Portrait focus
          <select name="imagePosition" defaultValue={e?.person.imagePosition ?? '50% 25%'}>
            <option value="50% 0%">Top</option>
            <option value="50% 25%">Upper center</option>
            <option value="50% 50%">Center</option>
          </select>
        </label>
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Why & how · Causes and sequence</legend>
        <label>
          Correct causes (1–4, one per line)
          <textarea name="causes" rows={3} defaultValue={e?.causes.join('\n')} required />
        </label>
        <label>
          Clearly incorrect causes (2–4, one per line)
          <textarea
            name="distractors"
            rows={3}
            defaultValue={e?.distractors?.join('\n')}
            required
          />
        </label>
        <label>
          Stages in the correct chronological order (2–8, one per line)
          <textarea name="sequence" rows={5} defaultValue={e?.sequence.join('\n')} required />
        </label>
      </fieldset>
      <label className="publish-checkbox">
        <input
          name="published"
          type="checkbox"
          defaultChecked={entry?.published ?? false}
          disabled={busy}
        />
        <span>Publish this question so it appears in new games</span>
      </label>
      <div className="admin-form-actions">
        <button type="button" className="button secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="button primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save question'}
        </button>
      </div>
    </form>
  )
}
