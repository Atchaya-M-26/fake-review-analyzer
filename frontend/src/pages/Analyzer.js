import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyzeReview } from '../services/api';
import './Analyzer.css';

function Analyzer() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manual');
  const [productUrl, setProductUrl] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyzeManual = async (e) => {
    e.preventDefault();
    
    if (!reviewText.trim()) {
      setError('Please enter review text');
      return;
    }

    if (!productId.trim()) {
      setError('Please enter a product ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await analyzeReview({ text: reviewText });
      // result.data contains the analysis with trustScore
      navigate(`/results/${productId}`, { state: { analysis: result.data, reviewText, productId } });
    } catch (err) {
      setError('Error analyzing review. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeUrl = async (e) => {
    e.preventDefault();
    
    if (!productUrl.trim()) {
      setError('Please enter a product URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: Implement URL scraping and analysis
      setError('URL analysis feature coming soon');
    } catch (err) {
      setError('Error analyzing URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyzer-page">
      <div className="analyzer-shell">
        <aside className="analyzer-visual">
          <div className="brand-block analyzer-brand-block">
            <div className="dashboard-mark analyzer-mark">◇</div>
            <div>
              <h2>Review Trust Lab</h2>
              <p>Fake Review Analyzer</p>
            </div>
          </div>

          <nav className="side-nav analyzer-side-nav">
            <Link to="/dashboard" className="side-link">Overview</Link>
            <Link to="/analyzer" className="side-link active" aria-current="page">Trust Analysis</Link>
            <Link to="/dashboard#patterns" className="side-link">Suspicious Patterns</Link>
            <Link to="/dashboard#products" className="side-link">Products</Link>
            <Link to="/dashboard#reports" className="side-link">Reports</Link>
            <Link to="/dashboard#alerts" className="side-link">Alerts</Link>
            <Link to="/dashboard#settings" className="side-link">Settings</Link>
          </nav>
        </aside>

        <section className="analyzer-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Review Trust Lab</p>
              <h2>Analysis workspace</h2>
              <p>
                Choose how you want to check a review. Manual text analysis is active now. URL analysis stays ready for
                future product scraping.
              </p>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              Manual review
            </button>
            <button
              className={`tab ${activeTab === 'url' ? 'active' : ''}`}
              onClick={() => setActiveTab('url')}
            >
              Product URL
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {activeTab === 'manual' && (
            <form onSubmit={handleAnalyzeManual} className="form">
              <div className="form-group">
                <label htmlFor="productId">Product ID *</label>
                <input
                  id="productId"
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="Enter product ID or name"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reviewText">Review Text *</label>
                <textarea
                  id="reviewText"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Paste or type the review text here..."
                  rows="8"
                  disabled={loading}
                />
                <small>{reviewText.length} characters</small>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze review'}
              </button>
            </form>
          )}

          {activeTab === 'url' && (
            <form onSubmit={handleAnalyzeUrl} className="form">
              <div className="form-group">
                <label htmlFor="productUrl">Product URL *</label>
                <input
                  id="productUrl"
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://www.amazon.com/..."
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze product'}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

export default Analyzer;
