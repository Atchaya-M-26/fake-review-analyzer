import React, { useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        boxHeight: 8,
        color: 'rgba(28, 31, 45, 0.72)',
        font: {
          size: 11,
          weight: '600',
        },
      },
    },
    tooltip: {
      backgroundColor: '#111827',
      padding: 12,
      cornerRadius: 12,
      titleFont: { size: 12, weight: '700' },
      bodyFont: { size: 12 },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(148, 163, 184, 0.16)',
      },
      ticks: {
        color: 'rgba(71, 85, 105, 0.8)',
      },
    },
    y: {
      grid: {
        color: 'rgba(148, 163, 184, 0.16)',
      },
      ticks: {
        color: 'rgba(71, 85, 105, 0.8)',
      },
    },
  },
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getProductLabel = (item) => item?.details?.productName || item?.details?.productId || 'Manual review';

function DashboardCharts({ history = [] }) {
  const chartModel = useMemo(() => {
    const sorted = [...history].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
    const latestDate = sorted.length ? new Date(sorted[sorted.length - 1].createdAt) : new Date();
    const timeline = Array.from({ length: 7 }, (_, index) => addDays(latestDate, index - 6));
    const labels = timeline.map((date) => date.toLocaleDateString([], { month: 'short', day: 'numeric' }));

    const dailyMap = new Map();
    timeline.forEach((date) => {
      dailyMap.set(toDateKey(date), {
        genuine: 0,
        suspicious: 0,
        fake: 0,
        trustSum: 0,
        sentimentSum: 0,
        count: 0,
      });
    });

    sorted.forEach((item) => {
      const key = toDateKey(new Date(item.createdAt));
      const bucket = dailyMap.get(key);
      if (!bucket) return;

      bucket.count += 1;
      bucket[item.classification] = (bucket[item.classification] || 0) + 1;
      bucket.trustSum += Number(item.trustScore || 0);
      const sentiment = Number(item.details?.sentimentScore ?? 0);
      bucket.sentimentSum += Math.abs(sentiment) <= 1 ? sentiment * 100 : sentiment;
    });

    const reviewActivity = {
      labels,
      datasets: [
        {
          label: 'Genuine',
          data: timeline.map((date) => dailyMap.get(toDateKey(date)).genuine),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.08)',
          tension: 0.35,
          fill: false,
          pointRadius: 2,
        },
        {
          label: 'Suspicious',
          data: timeline.map((date) => dailyMap.get(toDateKey(date)).suspicious),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          tension: 0.35,
          fill: false,
          pointRadius: 2,
        },
        {
          label: 'Fake',
          data: timeline.map((date) => dailyMap.get(toDateKey(date)).fake),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          tension: 0.35,
          fill: false,
          pointRadius: 2,
        },
      ],
    };

    const trustSentiment = {
      labels,
      datasets: [
        {
          label: 'Trust Score',
          data: timeline.map((date) => {
            const bucket = dailyMap.get(toDateKey(date));
            return bucket.count ? Math.round(bucket.trustSum / bucket.count) : 0;
          }),
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124, 58, 237, 0.08)',
          tension: 0.35,
          fill: false,
          pointRadius: 2,
        },
        {
          label: 'Sentiment Score',
          data: timeline.map((date) => {
            const bucket = dailyMap.get(toDateKey(date));
            return bucket.count ? Math.round(bucket.sentimentSum / bucket.count) : 0;
          }),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          tension: 0.35,
          fill: false,
          pointRadius: 2,
        },
      ],
    };

    const productMap = new Map();
    sorted.forEach((item) => {
      const label = getProductLabel(item);
      if (!productMap.has(label)) {
        productMap.set(label, { genuine: 0, suspicious: 0, fake: 0 });
      }
      const bucket = productMap.get(label);
      bucket[item.classification] = (bucket[item.classification] || 0) + 1;
    });

    const productEntries = [...productMap.entries()].sort((left, right) => {
      const leftTotal = left[1].genuine + left[1].suspicious + left[1].fake;
      const rightTotal = right[1].genuine + right[1].suspicious + right[1].fake;
      return rightTotal - leftTotal;
    });

    const productLabels = productEntries.slice(0, 5).map(([label]) => label);
    const productData = {
      labels: productLabels.length ? productLabels : ['No product metadata'],
      datasets: [
        {
          label: 'Genuine Reviews',
          data: productLabels.length ? productEntries.slice(0, 5).map(([, value]) => value.genuine) : [0],
          backgroundColor: '#22c55e',
          borderRadius: 10,
          stack: 'reviews',
        },
        {
          label: 'Suspicious Reviews',
          data: productLabels.length ? productEntries.slice(0, 5).map(([, value]) => value.suspicious) : [0],
          backgroundColor: '#f59e0b',
          borderRadius: 10,
          stack: 'reviews',
        },
        {
          label: 'Fake Reviews',
          data: productLabels.length ? productEntries.slice(0, 5).map(([, value]) => value.fake) : [0],
          backgroundColor: '#ef4444',
          borderRadius: 10,
          stack: 'reviews',
        },
      ],
    };

    const scoreBuckets = [
      { label: '0-20', min: 0, max: 20 },
      { label: '20-40', min: 20, max: 40 },
      { label: '40-60', min: 40, max: 60 },
      { label: '60-80', min: 60, max: 80 },
      { label: '80-100', min: 80, max: 100 },
    ];

    const scoreDistribution = {
      labels: scoreBuckets.map((bucket) => bucket.label),
      datasets: [
        {
          label: 'Reviews',
          data: scoreBuckets.map((bucket) => sorted.filter((item) => {
            const score = Number(item.trustScore || 0);
            const upperBound = bucket.max === 100 ? score <= bucket.max : score < bucket.max;
            return score >= bucket.min && upperBound;
          }).length),
          backgroundColor: ['#e5d4ff', '#ceb7ff', '#b592ff', '#9a5cf6', '#7c3aed'],
          borderRadius: 14,
        },
      ],
    };

    const fakeDetectionTrend = {
      labels,
      datasets: [
        {
          label: 'Genuine',
          data: timeline.map((date) => dailyMap.get(toDateKey(date)).genuine),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          tension: 0.35,
          fill: false,
          pointRadius: 2,
        },
        {
          label: 'Suspicious',
          data: timeline.map((date) => dailyMap.get(toDateKey(date)).suspicious),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          tension: 0.35,
          fill: false,
          pointRadius: 2,
        },
        {
          label: 'Fake',
          data: timeline.map((date) => dailyMap.get(toDateKey(date)).fake),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          tension: 0.35,
          fill: false,
          pointRadius: 2,
        },
      ],
    };

    return {
      reviewActivity,
      trustSentiment,
      fakeDetectionTrend,
      productData,
      scoreDistribution,
      productCount: productEntries.length,
    };
  }, [history]);

  const hasData = history.length > 0;

  return (
    <div className="charts-grid">
      <section className="chart-card chart-card-large">
        <div className="chart-card-head">
          <div>
            <h3>Review Activity Over Time</h3>
            <p>Genuine, suspicious, and fake review volume across the latest seven days.</p>
          </div>
          <span className="chart-pill">Last 7 days</span>
        </div>
        <div className="chart-surface">
          {hasData ? <Line data={chartModel.reviewActivity} options={chartOptions} /> : <div className="chart-empty">No review activity yet.</div>}
        </div>
      </section>

      <section className="chart-card chart-card-large">
        <div className="chart-card-head">
          <div>
            <h3>Trust Score & Sentiment Trend</h3>
            <p>Comparing trust scores with sentiment signals from saved analyses.</p>
          </div>
          <span className="chart-pill">Rolling trend</span>
        </div>
        <div className="chart-surface">
          {hasData ? <Line data={chartModel.trustSentiment} options={chartOptions} /> : <div className="chart-empty">No trend data yet.</div>}
        </div>
      </section>

      <section className="chart-card chart-card-wide">
        <div className="chart-card-head">
          <div>
            <h3>Trust Score Distribution</h3>
            <p>Where the current analyses sit across the $0$ to $100$ trust range.</p>
          </div>
          <span className="chart-pill">All saved analyses</span>
        </div>
        <div className="chart-surface chart-surface-tall">
          {hasData ? <Bar data={chartModel.scoreDistribution} options={chartOptions} /> : <div className="chart-empty">No score distribution yet.</div>}
        </div>
      </section>
    </div>
  );
}

export default DashboardCharts;
