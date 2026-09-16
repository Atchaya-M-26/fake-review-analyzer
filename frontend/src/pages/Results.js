import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js';
import ReviewTrustLabShell from '../components/ReviewTrustLabShell';
import './Results.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const autoSaveKey = useRef(null);
  const saveInProgress = useRef(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const sidebarItems = [
    { key: 'overview', label: 'Overview', to: '/dashboard' },
    { key: 'trust-analysis', label: 'Trust Analysis', to: '/analyzer' },
    { key: 'patterns', label: 'Suspicious Patterns', to: '/dashboard#patterns' },
    { key: 'products', label: 'Products', to: '/dashboard#products' },
    { key: 'reports', label: 'Reports', to: '/dashboard#reports' },
    { key: 'alerts', label: 'Alerts', to: '/dashboard#alerts' },
    { key: 'settings', label: 'Settings', to: '/dashboard#settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('userLoggedOut'));
    navigate('/');
  };

  const saveToHistory = useCallback(async (analysisData, reviewText, token, productId = '') => {
    if (!analysisData || saveInProgress.current) return;
    saveInProgress.current = true;

    try {
      const response = await axios.post(
        `${API_URL}/history/save`,
        {
          reviewText: reviewText || analysisData.reviewText || '',
          trustScore: analysisData.trustScore,
          trustLevel: analysisData.trustLevel,
          classification: analysisData.classification,
          flags: analysisData.flags || [],
          details: {
            ...(analysisData.details || {}),
            ...(productId ? { productId } : {})
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSaved(true);
        setSaveMessage('✓ Analysis saved to your history');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      console.log('Note: Sign in to save analysis to history');
    } finally {
      saveInProgress.current = false;
    }
  }, [API_URL]);

  useEffect(() => {
    const analysisData = location.state?.analysis;
    const reviewText = location.state?.reviewText;
    const productId = location.state?.productId || '';
    if (analysisData) {
      setAnalysis(analysisData);
      // Auto-save if user is logged in
      const token = localStorage.getItem('token');
      const currentAutoSaveKey = token && reviewText
        ? `${token}:${productId}:${reviewText}:${analysisData.trustScore}:${analysisData.classification}`
        : null;
      if (token && reviewText && autoSaveKey.current !== currentAutoSaveKey) {
        autoSaveKey.current = currentAutoSaveKey;
        saveToHistory(analysisData, reviewText, token, productId);
      }
    }
  }, [location.state, saveToHistory]);

  const handleSaveManually = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSaveMessage('Please login to save analysis');
      return;
    }
    await saveToHistory(analysis, location.state?.reviewText || '', token, location.state?.productId || '');
  };

  const chartDetails = analysis?.details || {};
  const sentimentScore = Number(chartDetails.sentimentScore ?? 0);
  const languageQuality = Number(chartDetails.languageQuality ?? 0);
  const patternScore = Number(chartDetails.patternScore ?? 0);
  const modelConfidence = Number(chartDetails.modelConfidence ?? 0);
  const analysisChartData = {
    labels: ['Trust score', 'Sentiment', 'Language quality', 'Pattern safety', 'Model confidence'],
    datasets: [
      {
        label: 'Analysis score',
        data: [
          Number(analysis?.trustScore || 0),
          Math.round(((sentimentScore + 1) / 2) * 100),
          Math.round(languageQuality * 100),
          Math.round((1 - patternScore) * 100),
          Math.round(modelConfidence * 100),
        ],
        backgroundColor: ['#7c3aed', '#3b82f6', '#14b8a6', '#f59e0b', '#ec4899'],
        borderRadius: 8,
        barThickness: 18,
      },
    ],
  };
  const analysisChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.raw}/100`,
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20, color: '#64748b' },
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
      },
      y: {
        ticks: { color: '#334155', font: { size: 11, weight: '600' } },
        grid: { display: false },
      },
    },
  };

  if (!analysis) {
    return (
      <ReviewTrustLabShell
        user={user}
        onLogout={handleLogout}
        headerTitle="Review Trust Lab"
        headerSubtitle="Analysis Results"
        sidebarItems={sidebarItems}
        activeSidebarKey="trust-analysis"
      >
        <div className="results-loading">Loading results...</div>
      </ReviewTrustLabShell>
    );
  }

  return (
    <ReviewTrustLabShell
      user={user}
      onLogout={handleLogout}
      headerTitle="Review Trust Lab"
      headerSubtitle="Analysis Results"
      sidebarItems={sidebarItems}
      activeSidebarKey="trust-analysis"
    >
      <div className="results">
        <div className="results-container">

          {saveMessage && <div className="save-message">{saveMessage}</div>}

        <div className="results-overview">
          <div className="trust-score-card">
            <h2>Trust Score</h2>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-value">{analysis.trustScore || 0}</span>
                <span className="score-label">/ 100</span>
              </div>
              <div className="score-info">
                <p className="classification">{analysis.classification || 'Unknown'}</p>
                {analysis.trustLevel && (
                  <p className="description">Trust level: {analysis.trustLevel}</p>
                )}
                <p className="description">
                  {analysis.classification === 'genuine'
                    ? 'Likely genuine review'
                    : analysis.classification === 'fake'
                      ? 'Likely fake review'
                      : 'Likely suspicious review'}
                </p>
              </div>
            </div>
            {!saved && localStorage.getItem('token') && (
              <button className="save-btn" onClick={handleSaveManually}>
                💾 Save to History
              </button>
            )}
          </div>

          <div className="analysis-chart-card">
            <div className="chart-heading">
              <div>
                <p className="chart-kicker">Analysis breakdown</p>
                <h2>Signals behind the score</h2>
              </div>
              <span className="chart-scale">0–100</span>
            </div>
            <div className="analysis-chart">
              <Bar data={analysisChartData} options={analysisChartOptions} />
            </div>
          </div>
        </div>

        {analysis.flags && analysis.flags.length > 0 && (
          <div className="flags-card">
            <h3>Detected Issues</h3>
            <ul className="flags-list">
              {analysis.flags.map((flag, idx) => (
                <li key={idx} className="flag-item">
                  <span className="flag-icon">⚠️</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.details && (
          <div className="details-card">
            <h3>Analysis Details</h3>
            <div className="details-grid">
              {analysis.details.wordCount && (
                <div className="detail-item">
                  <label>Word Count</label>
                  <value>{analysis.details.wordCount}</value>
                </div>
              )}
              {analysis.details.sentimentScore !== undefined && (
                <div className="detail-item">
                  <label>Sentiment Score</label>
                  <value>{(analysis.details.sentimentScore * 100).toFixed(1)}%</value>
                </div>
              )}
              {analysis.details.languageQuality !== undefined && (
                <div className="detail-item">
                  <label>Language Quality</label>
                  <value>{(analysis.details.languageQuality * 100).toFixed(1)}%</value>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </ReviewTrustLabShell>
  );
}

export default Results;
