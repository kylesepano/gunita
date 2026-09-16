import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  Compass,
  Sparkles,
  RotateCw,
  BookOpen,
  Flag,
  MoveUpRight,
} from 'lucide-react'
import { Roulette } from '../features/roulette/Roulette'
import { categories } from '../game/roulette'
import { CategoryIcon } from '../components/CategoryIcon'
import { useGame } from '../stores/gameStore'
export default function LandingPage() {
  const ongoing = useGame((s) => s.deck.length > 0 && s.phase !== 'completed')
  return (
    <div className="landing">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> A NEW WAY TO EXPLORE THE PAST
          </div>
          <h1>
            History takes
            <br />
            an unexpected <em>turn.</em>
          </h1>
          <p className="hero-description">
            Six ways to discover. Play your way.
            <br />
            Follow the clues, connect the moments, and see
            <br className="desktop-break" /> how much of history you remember.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/play">
              Let’s play <ArrowRight size={19} />
            </Link>
            <a className="text-link" href="#how-it-works">
              How it works <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="guest-note">
            <span className="status-dot" /> Free to play <span>·</span> No account needed{' '}
            <span>·</span> Endlessly curious
          </div>
          {ongoing && (
            <Link to="/game" className="continue-link">
              Continue your expedition <ArrowRight size={16} />
            </Link>
          )}
        </div>
        <div className="hero-art">
          <div className="atlas-grid" />
          <span className="atlas-coordinate">EXPLORE PLACES. CONNECT MOMENTS.</span>
          <span className="atlas-north">
            N<br />
            <span>↑</span>
          </span>
          <div className="floating-note note-top">
            <Sparkles size={16} /> Let curiosity choose your path.
          </div>
          <Roulette decorative />
          <div className="floating-note note-bottom">
            <span className="note-icon">
              <RotateCw size={20} />
            </span>
            <div>
              Choose your own perspective.<small>Places, dates, or a little of everything.</small>
            </div>
          </div>
          <span className="atlas-edition">THE GUNITA COLLECTION &nbsp; / &nbsp; VOL. 01</span>
        </div>
      </section>
      <section className="feature-strip" aria-label="Game features">
        <span>
          <Globe2 /> History from around the world
        </span>
        <i />
        <span>
          <Compass /> 6 unique ways to play
        </span>
        <i />
        <span>
          <Flag /> 10 rounds of discovery
        </span>
        <i />
        <span>
          <BookOpen /> A little wiser with every turn
        </span>
      </section>
      <section className="category-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">SIX QUESTIONS. COUNTLESS STORIES.</div>
            <h2>There’s more than one way to remember.</h2>
          </div>
          <p>
            Not just what happened.
            <br />
            The who, where, when, why, and how.
          </p>
        </div>
        <div className="category-grid">
          {categories.map((c) => (
            <Link to={`/play?category=${c.type}`} className="category-card" key={c.type}>
              <span
                className="category-symbol"
                style={{ color: c.color, backgroundColor: `${c.color}15` }}
              >
                <CategoryIcon type={c.type} size={25} />
              </span>
              <h3>{c.english}</h3>
              <p>{c.description}</p>
              <MoveUpRight size={15} className="card-arrow" />
            </Link>
          ))}
        </div>
      </section>
      <section className="journey-section" id="how-it-works">
        <div className="journey-intro">
          <div className="eyebrow">YOUR NEXT RABBIT HOLE STARTS HERE</div>
          <h2>
            A little chance.
            <br />A lot of discovery.
          </h2>
          <p>
            From ancient cities to humanity’s first steps on the Moon. Every round opens another
            chapter.
          </p>
          <Link to="/play" className="text-link">
            Begin your journey <ArrowRight size={17} />
          </Link>
        </div>
        <div className="steps">
          {[
            {
              n: '01',
              title: 'Read the clues',
              text: 'Step into a moment from history, anywhere in the world.',
              icon: BookOpen,
            },
            {
              n: '02',
              title: 'Choose your perspective',
              text: 'Practice places or dates directly, or try all six with the roulette.',
              icon: RotateCw,
            },
            {
              n: '03',
              title: 'Make your connection',
              text: 'Pin a place, arrange a timeline, or uncover a cause. Learn with every reveal.',
              icon: Sparkles,
            },
          ].map((s) => (
            <div className="step" key={s.n}>
              <span className="step-number">{s.n}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
              <s.icon size={22} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
