import type { HistoricalEvent } from '../../types/history'
export function AdminQuestionPreview({ event }: { event: HistoricalEvent }) {
  return (
    <section className="admin-preview panel">
      <div className="eyebrow">QUESTION PREVIEW · ANSWER KEY</div>
      <h2>{event.title}</h2>
      <p className="preview-clue">{event.clue}</p>
      <dl>
        <dt>Who · {event.role}</dt>
        <dd>{event.person.name}</dd>
        <dt>Where · {event.wherePrompt || 'Where did this story unfold?'}</dt>
        <dd>
          {event.location} ({event.coordinates[0]}, {event.coordinates[1]})
        </dd>
        <dt>When · When did this moment become history?</dt>
        <dd>{event.year < 0 ? `${Math.abs(event.year)} BCE` : `${event.year} CE`}</dd>
        <dt>What · What event connects these clues?</dt>
        <dd>{event.title}</dd>
        <dt>Why · Correct causes</dt>
        <dd>
          <ul>
            {event.causes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </dd>
        <dt>Why · Incorrect options</dt>
        <dd>
          <ul>
            {event.distractors?.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </dd>
        <dt>How · Correct order</dt>
        <dd>
          <ol>
            {event.sequence.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        </dd>
      </dl>
      <h3>Explanation</h3>
      <p>{event.description}</p>
      {event.note && <p className="editorial-note">Content note: {event.note}</p>}
      <a href={event.source} target="_blank" rel="noreferrer" className="source-link">
        Historical source ↗
      </a>
    </section>
  )
}
