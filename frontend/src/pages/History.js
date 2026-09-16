import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReviewTrustLabShell from '../components/ReviewTrustLabShell';
import DashboardCharts from '../components/DashboardCharts';
import './History.css';

const SCORE_RANGES = {
  '0-20': [0, 20],
  '20-40': [20, 40],
  '40-60': [40, 60],
  '60-80': [60, 80],
  '80-100': [80, 100],
};

const sidebarItems = [
  { key: 'overview', label: 'Overview', to: '/dashboard' },
  { key: 'trust-analysis', label: 'Trust Analysis', to: '/analyzer' },
  { key: 'patterns', label: 'Suspicious Patterns', to: '/dashboard#patterns' },
  { key: 'products', label: 'Products', to: '/dashboard#products' },
  { key: 'reports', label: 'Reports', to: '/dashboard#reports' },
  { key: 'alerts', label: 'Alerts', to: '/dashboard#alerts' },
  { key: 'settings', label: 'Settings', to: '/dashboard#settings' },
];

const topNavItems = [
  { key: 'overview', label: 'Overview', to: '/dashboard' },
  { key: 'trust-analysis', label: 'Trust Analysis', to: '/analyzer' },
  { key: 'patterns', label: 'Suspicious Patterns', to: '/dashboard#patterns' },
  { key: 'products', label: 'Products', to: '/dashboard#products' },
];

const getProductLabel = (item) => item?.details?.productName || item?.details?.productId || 'Manual review';
const getRating = (item) => {
  const rating = Number(item?.details?.rating ?? item?.rating);
  return Number.isFinite(rating) ? rating : null;
};
const formatShortDate = (date) => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });

function History() {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    product: 'all',
    classification: 'all',
    rating: 'all',
    trustRange: 'all',
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const token = localStorage.getItem('token');
  const activeSection = location.hash ? location.hash.slice(1) : 'overview';
  const isSection = (section) => activeSection === section;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userLoggedOut'));
    navigate('/');
  };

  const fetchHistory = useCallback(async () => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/history/my-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setHistory(response.data.data || []);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [API_URL, navigate, token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const deleteItem = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setHistory((currentHistory) => currentHistory.filter((item) => item._id !== id));
        setPendingDelete(null);
        setMessage('Analysis deleted successfully.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError('Failed to delete the analysis. Please try again.');
    }
  };

  const openAnalyzedReport = (item) => {
    navigate(`/results/${item.details?.productId || 'saved-analysis'}`, {
      state: {
        analysis: {
          trustScore: item.trustScore,
          trustLevel: item.trustLevel,
          classification: item.classification,
          flags: item.flags || [],
          details: item.details || {},
        },
        reviewText: item.reviewText,
        productId: item.details?.productId || '',
      },
    });
  };

  const recalculateScores = async () => {
    if (!window.confirm('Recalculate trust scores for all history items?')) return;

    try {
      setRecalculating(true);
      setMessage('');
      const response = await axios.post(
        `${API_URL}/history/recalculate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage(`Successfully recalculated ${response.data.updated} analysis items.`);
        await fetchHistory();
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      setError('Failed to recalculate scores');
    } finally {
      setRecalculating(false);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const createdAt = new Date(item.createdAt);
      if (filters.dateFrom && createdAt < new Date(filters.dateFrom)) return false;
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        if (createdAt > endDate) return false;
      }
      if (filters.classification !== 'all' && item.classification !== filters.classification) return false;
      if (filters.product !== 'all' && getProductLabel(item) !== filters.product) return false;
      const rating = getRating(item);
      if (filters.rating !== 'all' && rating !== Number(filters.rating)) return false;
      if (filters.trustRange !== 'all') {
        const [min, max] = SCORE_RANGES[filters.trustRange];
        const trustScore = Number(item.trustScore || 0);
        if (trustScore < min || trustScore > max) return false;
      }
      return true;
    });
  }, [filters, history]);

  const summary = useMemo(() => {
    const initial = { total: 0, scoreSum: 0, genuine: 0, suspicious: 0, fake: 0, flagged: 0 };
    return filteredHistory.reduce((accumulator, item) => {
      accumulator.total += 1;
      accumulator.scoreSum += Number(item.trustScore || 0);
      accumulator[item.classification] = (accumulator[item.classification] || 0) + 1;
      if ((item.flags || []).length > 0) accumulator.flagged += 1;
      return accumulator;
    }, initial);
  }, [filteredHistory]);

  const averageScore = summary.total ? Math.round(summary.scoreSum / summary.total) : 0;
  const productOptions = useMemo(
    () => Array.from(new Set(history.map((item) => getProductLabel(item)))).sort((left, right) => left.localeCompare(right)),
    [history]
  );

  const recentItems = useMemo(
    () => [...filteredHistory].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)).slice(0, 8),
    [filteredHistory]
  );

  const suspiciousItems = useMemo(
    () => [...filteredHistory]
      .filter((item) => item.classification === 'suspicious')
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [filteredHistory]
  );

  const fakeItems = useMemo(
    () => [...filteredHistory]
      .filter((item) => item.classification === 'fake')
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [filteredHistory]
  );

  const productCounts = useMemo(() => {
    const counts = new Map();
    filteredHistory.forEach((item) => {
      const product = getProductLabel(item);
      counts.set(product, (counts.get(product) || 0) + 1);
    });
    return [...counts.entries()].sort((left, right) => right[1] - left[1]);
  }, [filteredHistory]);

  const productReports = useMemo(() => {
    const latestByProduct = new Map();
    filteredHistory.forEach((item) => {
      const product = getProductLabel(item);
      const current = latestByProduct.get(product);
      if (!current || new Date(item.createdAt) > new Date(current.createdAt)) {
        latestByProduct.set(product, item);
      }
    });
    return [...latestByProduct.entries()];
  }, [filteredHistory]);

  const kpiCards = [
    { label: 'Total Reviews', value: summary.total, helper: 'All filtered analyses', tone: 'violet' },
    { label: 'Genuine Reviews', value: summary.genuine, helper: 'Positive trust signals', tone: 'green' },
    { label: 'Suspicious Reviews', value: summary.suspicious, helper: 'Needs review', tone: 'amber' },
    { label: 'Fake Reviews', value: summary.fake, helper: 'High risk', tone: 'red' },
    { label: 'Average Trust Score', value: averageScore, helper: '0 - 100 scale', tone: 'blue' },
  ];

  const mainContent = (
    <div className="dashboard-view">
      {isSection('overview') && <section className="kpi-grid">
        {kpiCards.map((card) => (
          <article key={card.label} className={`kpi-card ${card.tone}`}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.helper}</span>
          </article>
        ))}
      </section>}

      {isSection('overview') && <section className="section-card">
        <div className="section-head">
          <div>
            <h2>Analytics Overview</h2>
            <p>Real saved analyses from your existing ML pipeline.</p>
          </div>
          <span className="section-pill">{filteredHistory.length} records</span>
        </div>
        <DashboardCharts history={filteredHistory} />
      </section>}

      {isSection('patterns') && <section className="section-card" id="patterns">
        <div className="section-head">
          <div>
            <h2>Suspicious Patterns</h2>
            <p>All suspicious reviews found in your analyzed history.</p>
          </div>
          <span className="section-pill">{suspiciousItems.length} reviews</span>
        </div>
        <div className="review-list">
          {suspiciousItems.length > 0 ? suspiciousItems.map((item) => (
            <article
              key={item._id}
              className="review-card clickable-card"
              onClick={() => openAnalyzedReport(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') openAnalyzedReport(item);
              }}
              role="button"
              tabIndex="0"
            >
              <div className="review-card-head">
                <div>
                  <span className="status-badge suspicious">suspicious</span>
                  <h3>{getProductLabel(item)}</h3>
                  <p>{formatShortDate(item.createdAt)}</p>
                </div>
                <div className="score-chip">{item.trustScore}/100</div>
              </div>
              <p className="review-snippet">{item.reviewText.substring(0, 160)}{item.reviewText.length > 160 ? '...' : ''}</p>
              <div className="review-meta-row">
                <span>{item.trustLevel || 'No trust level'}</span>
                <span>{(item.flags || []).length} flags</span>
                <span>Sentiment: {Number(item.details?.sentimentScore ?? 0).toFixed(2)}</span>
              </div>
            </article>
          )) : <div className="empty-state">No suspicious reviews have been analyzed yet.</div>}
        </div>
      </section>}

      {isSection('products') && <section className="section-card" id="products">
        <div className="section-head">
          <div>
            <h2>Product Overview</h2>
            <p>Products represented in your analyzed review history.</p>
          </div>
          <button type="button" className="ghost-button" onClick={() => navigate('/analyzer')}>
            Analyze Review
          </button>
        </div>
        <div className="pattern-grid">
          {productReports.length > 0 ? productReports.map(([product, item]) => (
            <article
              key={product}
              className="pattern-card clickable-card"
              onClick={() => openAnalyzedReport(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') openAnalyzedReport(item);
              }}
              role="button"
              tabIndex="0"
            >
              <strong>{product}</strong>
              <span>{productCounts.find(([label]) => label === product)?.[1] || 0} analyzed reviews</span>
              <div className="product-score">{item.trustScore}/100 latest trust score</div>
            </article>
          )) : <div className="empty-state">No products have been analyzed in the current filter range.</div>}
        </div>
      </section>}

      {isSection('reports') && <section className="section-card" id="reports">
        <div className="section-head">
          <div>
            <h2>Analyzed Reports</h2>
            <p>History of reviews that have already been analyzed.</p>
          </div>
          <span className="section-pill">{filteredHistory.length} reports</span>
        </div>
        {recentItems.length > 0 ? (
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Review</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {recentItems.map((item) => (
                  <tr key={item._id} className="clickable-row" onClick={() => openAnalyzedReport(item)}>
                    <td><strong>{getProductLabel(item)}</strong></td>
                    <td>{item.reviewText.substring(0, 54)}{item.reviewText.length > 54 ? '...' : ''}</td>
                    <td>{formatShortDate(item.createdAt)}</td>
                    <td><span className={`status-badge ${item.classification}`}>{item.classification}</span></td>
                    <td><span className="score-chip">{item.trustScore}/100</span></td>
                    <td>
                      <button
                        type="button"
                        className="table-action"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingDelete(item);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state">No saved reviews match the current filters.</div>}
      </section>}

      {isSection('alerts') && <section className="section-card" id="alerts">
        <div className="section-head">
          <div>
            <h2>Alerts</h2>
            <p>Fake reviews requiring immediate attention.</p>
          </div>
          <span className="section-pill">{fakeItems.length} alerts</span>
        </div>
        <div className="alert-list">
          {fakeItems.length > 0 ? fakeItems.map((item) => (
            <article
              key={item._id}
              className="alert-card clickable-card"
              onClick={() => openAnalyzedReport(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') openAnalyzedReport(item);
              }}
              role="button"
              tabIndex="0"
            >
              <div className="alert-card-head">
                <div>
                  <strong>Fake review detected</strong>
                  <p>{getProductLabel(item)}</p>
                </div>
                <div className="score-chip">{item.trustScore}/100</div>
              </div>
              <span>{(item.flags || []).slice(0, 3).join(' • ')}</span>
            </article>
          )) : <div className="empty-state">No fake reviews have been detected in the selected filters.</div>}
        </div>
      </section>}

      {isSection('settings') && <section className="section-card settings-page-card" id="settings">
        <div className="section-head">
          <div>
            <h2>Website Settings</h2>
            <p>Configure the website experience.</p>
          </div>
        </div>
        <div className="settings-list">
          <label className="settings-row">
            <span>
              <strong>Review alerts</strong>
              <small>Show alerts for fake reviews</small>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="settings-row">
            <span>
              <strong>Automatic history saving</strong>
              <small>Keep analyzed reports in history</small>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="settings-row">
            <span>
              <strong>Compact dashboard</strong>
              <small>Use a denser website layout</small>
            </span>
            <input type="checkbox" />
          </label>
        </div>
      </section>}
    </div>
  );

  const rightRail = isSection('overview') ? (
    <>
      <section className="rail-card filter-card" id="filters">
        <div className="rail-head">
          <div>
            <h2>Analysis Filters</h2>
            <p>Refine the analytics view.</p>
          </div>
          <button
            type="button"
            className="clear-link"
            onClick={() => setFilters({ dateFrom: '', dateTo: '', product: 'all', classification: 'all', rating: 'all', trustRange: 'all' })}
          >
            Clear All
          </button>
        </div>

        <div className="filter-grid">
          <label className="filter-group">
            <span>Date Range</span>
            <div className="date-grid">
              <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
              <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
            </div>
          </label>
          <label className="filter-group">
            <span>Product</span>
            <select value={filters.product} onChange={(event) => setFilters((current) => ({ ...current, product: event.target.value }))}>
              <option value="all">All Products</option>
              {productOptions.map((product) => <option key={product} value={product}>{product}</option>)}
            </select>
          </label>
          <label className="filter-group">
            <span>Review Classification</span>
            <select value={filters.classification} onChange={(event) => setFilters((current) => ({ ...current, classification: event.target.value }))}>
              <option value="all">All</option>
              <option value="genuine">Genuine</option>
              <option value="suspicious">Suspicious</option>
              <option value="fake">Fake</option>
            </select>
          </label>
          <label className="filter-group">
            <span>Rating</span>
            <select value={filters.rating} onChange={(event) => setFilters((current) => ({ ...current, rating: event.target.value }))}>
              <option value="all">All Ratings</option>
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </label>
          <label className="filter-group">
            <span>Trust Score Range</span>
            <select value={filters.trustRange} onChange={(event) => setFilters((current) => ({ ...current, trustRange: event.target.value }))}>
              <option value="all">All Scores</option>
              <option value="0-20">0 - 20</option>
              <option value="20-40">20 - 40</option>
              <option value="40-60">40 - 60</option>
              <option value="60-80">60 - 80</option>
              <option value="80-100">80 - 100</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rail-card insight-card" id="alerts">
        <div className="rail-head">
          <div>
            <h2>Insights</h2>
            <p>Filter-aware summary</p>
          </div>
        </div>
        <div className="insight-list">
          <div><strong>{summary.total}</strong><span>analyses in view</span></div>
          <div><strong>{summary.flagged}</strong><span>flagged entries</span></div>
          <div><strong>{productOptions.length}</strong><span>tracked products</span></div>
        </div>
      </section>
    </>
  ) : null;

  if (loading) {
    return (
      <ReviewTrustLabShell
        user={user}
        onLogout={handleLogout}
        headerTitle="Review Trust Lab"
        headerSubtitle="Fake Review Analyzer"
        topNavItems={topNavItems}
        activeTopNavKey={activeSection === 'overview' ? 'overview' : activeSection}
        sidebarItems={sidebarItems}
        activeSidebarKey={activeSection}
        primaryAction={{ label: 'Analyze Review', to: '/analyzer' }}
        rightRail={rightRail}
      >
        <div className="loading-state">Loading dashboard...</div>
      </ReviewTrustLabShell>
    );
  }

  return (
    <ReviewTrustLabShell
      user={user}
      onLogout={handleLogout}
      headerTitle="Review Trust Lab"
      headerSubtitle="Fake Review Analyzer"
      topNavItems={topNavItems}
      activeTopNavKey={activeSection === 'overview' ? 'overview' : activeSection}
      sidebarItems={sidebarItems}
      activeSidebarKey={location.pathname === '/history' ? 'saved-analyses' : activeSection}
      primaryAction={{ label: 'Analyze Review', to: '/analyzer' }}
      rightRail={rightRail}
    >
      {error && <div className="inline-banner error-banner">{error}</div>}
      {message && <div className="inline-banner success-banner">{message}</div>}
      {mainContent}
      {pendingDelete && (
        <div className="site-modal-backdrop" role="presentation">
          <div className="site-modal" role="dialog" aria-modal="true" aria-labelledby="delete-analysis-title">
            <h2 id="delete-analysis-title">Delete this analysis?</h2>
            <p>This report will be removed from your analyzed history.</p>
            <div className="site-modal-actions">
              <button type="button" className="ghost-button" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={() => deleteItem(pendingDelete._id)}>
                Delete report
              </button>
            </div>
          </div>
        </div>
      )}
    </ReviewTrustLabShell>
  );
}

export default History;
