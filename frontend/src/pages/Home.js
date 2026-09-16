import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const signalCards = [
  {
    title: 'Trust score',
    value: '74 / 100',
    copy: 'Balances sentiment, repetition, and model confidence.'
  },
  {
    title: 'Classification',
    value: 'Suspicious',
    copy: 'Pushes uncertain reviews away from high-confidence genuine.'
  },
  {
    title: 'Signals tracked',
    value: 'Sentiment + patterns',
    copy: 'Reviews are scored with text quality and behavior clues.'
  }
];

const inspectionPoints = [
  'Negative sentiment with low model confidence gets downgraded.',
  'Repetition, caps, punctuation, and promo language add risk.',
  'Manual review input and product-level batch analysis both work.'
];

function Home() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◇
          </span>
          <span className="brand-text">Review Trust Lab</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          <a href="#product">Product</a>
          <a href="#explore">Explore</a>
          <a href="#workflow">Pricing</a>
          <a href="#support">Support</a>
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="nav-link-text">
            Sign in
          </Link>
          <Link to="/login" className="nav-cta">
            Get started <span aria-hidden="true">↓</span>
          </Link>
        </div>
      </header>

      <section className="hero" id="product">
        <div className="hero-copy">
          <p className="eyebrow">Fake Review Analyzer</p>
          <h1>
            Reviews,
            <br />
            made clear.
          </h1>
          <p className="hero-description">
            Score product reviews with NLP, sentiment, pattern detection, and ML confidence so you can spot genuine,
            suspicious, and fake feedback faster.
          </p>
          <Link to="/login" className="hero-button">
            Start now <span aria-hidden="true">↓</span>
          </Link>
          <p className="hero-footnote">Paste a review, inspect the score, then save the result to history.</p>
        </div>

        <div className="hero-panel" aria-label="Analysis preview">
          <p className="panel-label">Live analysis preview</p>
          <div className="panel-summary">
            <div className="score-badge" aria-hidden="true">
              <span className="score-number">74</span>
              <span className="score-suffix">/ 100</span>
            </div>
            <div className="summary-copy">
              <h2>Suspicious</h2>
              <p>Low-confidence genuine prediction with a strong negative tone.</p>
              <span>Balanced by language quality, repetition, and model output.</span>
            </div>
          </div>

          <div className="metric-grid">
            {signalCards.map((card) => (
              <article className="metric-card" key={card.title}>
                <h3>{card.title}</h3>
                <strong>{card.value}</strong>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="insights-section" id="explore">
        <div className="section-heading">
          <p>What the review lab checks</p>
          <h2>Built for reviews that look real, but feel off.</h2>
        </div>

        <div className="insight-grid">
          {inspectionPoints.map((point, index) => (
            <article className="insight-card" key={point}>
              <span className="insight-index">0{index + 1}</span>
              <p>{point}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="workflow-panel">
          <p className="section-kicker">Simple workflow</p>
          <h2>Paste a review, read the score, then decide.</h2>
          <div className="workflow-steps">
            <div>
              <span>1</span>
              <h3>Enter text</h3>
              <p>Add a product review manually or from a product page.</p>
            </div>
            <div>
              <span>2</span>
              <h3>Score</h3>
              <p>The backend merges sentiment, model confidence, and pattern signals.</p>
            </div>
            <div>
              <span>3</span>
              <h3>Review results</h3>
              <p>Get a trust score, classification, and supporting detail cards.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="support-section" id="support">
        <div>
          <p className="section-kicker">Need help?</p>
          <h2>Sign in to inspect saved reviews and monitor trust scores.</h2>
        </div>
        <Link to="/login" className="support-button">
          Go to sign in <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}

export default Home;
