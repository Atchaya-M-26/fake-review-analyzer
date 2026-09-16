(function () {
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const style = document.createElement('style');
  style.textContent = '.reports-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.report-card{background:#fff;border:1px solid #e7dfea;border-radius:12px;padding:20px;text-align:left;cursor:pointer;box-shadow:0 10px 25px #76538f0d}.report-card:hover{border-color:#8ecfb4;transform:translateY(-1px)}.report-card h2{font:600 18px "Space Grotesk";margin:10px 0 6px}.report-card p{color:#7d8b86;font-size:12px}.report-score{font:600 30px "Space Grotesk";margin:18px 0 8px;color:#167b5b}.report-score small{font:11px "DM Sans";color:#89958f;margin-left:5px}.report-time{display:block;color:#89958f;margin-top:14px}@media(max-width:700px){.reports-grid{grid-template-columns:1fr}}.sentiment-chart .sentiment-0{background:linear-gradient(180deg,#59c895,#16845d)}.sentiment-chart .sentiment-1{background:linear-gradient(180deg,#a681e3,#7044bf)}.sentiment-chart .sentiment-2{background:linear-gradient(180deg,#ef9696,#d35c5c)}';
  document.head.appendChild(style);

  function history() {
    return JSON.parse(localStorage.getItem('reviewlens_history') || '[]');
  }

  function sentimentOf(text) {
    const value = String(text || '').toLowerCase();
    const positive = ['amazing', 'excellent', 'great', 'love', 'perfect', 'best', 'good', 'comfortable', 'recommend'];
    const negative = ['broken', 'poor', 'waste', 'bad', 'slow', 'disappointed', 'flimsy', 'issue', 'problem', 'return'];
    const p = positive.filter(word => value.includes(word)).length;
    const n = negative.filter(word => value.includes(word)).length;
    return p > n ? 'Positive' : n > p ? 'Negative' : 'Mixed';
  }

  function productReports(items) {
    return items.filter(item => item.type === 'Product' && item.report);
  }

  function addReportsView() {
    const nav = document.querySelector('.sidebar nav');
    if (nav && !document.querySelector('.nav-item[data-view="reports"]')) {
      const button = document.createElement('button');
      button.className = 'nav-item';
      button.dataset.view = 'reports';
      button.innerHTML = '<span>▤</span> Product reports';
      button.onclick = () => showView('reports');
      nav.appendChild(button);
    }
    if (!$('reportsView')) {
      const view = document.createElement('section');
      view.id = 'reportsView';
      view.className = 'view hidden';
      document.querySelector('.main').insertBefore(view, document.querySelector('.main footer'));
    }
  }

  function renderReports() {
    const reports = productReports(history());
    $('reportsView').innerHTML = `<div class="reports-page"><div class="dashboard-hero compact"><div><span class="pill">SAVED PRODUCT REPORTS</span><h1>Product review<br><em>reports.</em></h1><p>Open a previous product scan to review its trust score, graphs, and every analyzed review.</p></div></div>${reports.length ? `<div class="reports-grid">${reports.map((item, index) => {
      const report = item.report;
      return `<button class="report-card" data-report-index="${index}"><span class="card-kicker">PRODUCT SCAN</span><h2>${esc(item.title || report.product.title)}</h2><p>${esc(report.product.category)} · ${report.reviewsScanned} reviews scanned</p><div class="report-score">${report.trustScore}<small>/100 trust</small></div><span class="tag ${item.label !== 'Likely genuine' ? 'suspicious' : ''}">${esc(item.label)}</span><small class="report-time">${esc(item.time || '')}</small></button>`;
    }).join('')}</div>` : '<div class="table-card history-empty">No product reports yet. Scan a product URL and its complete report will appear here.</div>'}</div>`;
    $('reportsView').querySelectorAll('[data-report-index]').forEach(button => {
      button.onclick = () => {
        const item = reports[Number(button.dataset.reportIndex)];
        showView('url');
        $('urlInput').value = item.text || '';
        $('urlBtn').click();
      };
    });
  }

  function renderDashboard() {
    const items = history();
    const products = productReports(items);
    const manual = items.filter(item => item.type === 'Review');
    const scores = items.map(item => Number(item.score || 0));
    const avg = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : '—';
    const classification = ['Likely genuine', 'Suspicious', 'Likely fake'].map(label => items.filter(item => item.label === label).length);
    const bands = [0, 0, 0, 0, 0];
    scores.forEach(score => bands[Math.min(4, Math.floor(score / 20))]++);
    const allTexts = manual.map(item => item.text || '').concat(products.flatMap(item => (item.report.reviews || []).map(review => review.text)));
    const sentiments = ['Positive', 'Mixed', 'Negative'].map(label => allTexts.filter(text => sentimentOf(text) === label).length);
    const maxBand = Math.max(1, ...bands);
    const maxSentiment = Math.max(1, ...sentiments);
    const percentage = count => items.length ? Math.round(count / items.length * 100) : 0;

    $('dashboardView').innerHTML = `<div class="review-dashboard"><div class="dashboard-hero"><div><span class="pill">REVIEWLENS OVERVIEW</span><h1>Your trust intelligence.</h1><p>Understand the reviews you have analyzed and compare product-level results.</p></div><div class="dashboard-top-actions"><button class="dashboard-action secondary" id="dashboardNewReview">＋ New review</button><button class="dashboard-action" id="dashboardScanUrl">Scan product URL →</button></div></div><div class="dashboard-kpis"><div class="dashboard-kpi kpi-total"><div class="kpi-icon">◉</div><span>Total analyses</span><strong>${items.length}</strong><span class="kpi-foot">Reviews and product scans</span></div><div class="dashboard-kpi kpi-genuine"><div class="kpi-icon">✓</div><span>Likely genuine</span><strong>${classification[0]}</strong><span class="kpi-foot">${percentage(classification[0])}% of analyses</span></div><div class="dashboard-kpi kpi-suspicious"><div class="kpi-icon">!</div><span>Suspicious</span><strong>${classification[1]}</strong><span class="kpi-foot">Needs closer attention</span></div><div class="dashboard-kpi kpi-fake"><div class="kpi-icon">×</div><span>Likely fake</span><strong>${classification[2]}</strong><span class="kpi-foot">High-risk patterns</span></div><div class="dashboard-kpi kpi-score"><div class="kpi-icon">✦</div><span>Average trust score</span><strong>${avg}${avg === '—' ? '' : '/100'}</strong><span class="kpi-foot">Across saved analyses</span></div></div><div class="dashboard-columns"><div class="dashboard-main-panels"><div class="dashboard-panel"><h3>Trust score distribution</h3><div class="panel-subtitle">Vertical view of analyzed scores</div><div class="bar-chart">${bands.map((count, index) => `<div class="chart-bar"><strong>${count}</strong><i style="height:${Math.max(5, count / maxBand * 105)}px"></i><small>${index * 20}–${index === 4 ? 100 : index * 20 + 19}</small></div>`).join('')}</div></div><div class="dashboard-panel"><h3>Sentiment analysis</h3><div class="panel-subtitle">Sentiment across every analyzed review</div><div class="bar-chart sentiment-chart">${sentiments.map((count, index) => `<div class="chart-bar"><strong>${count}</strong><i class="sentiment-${index}" style="height:${Math.max(5, count / maxSentiment * 105)}px"></i><small>${['Positive', 'Mixed', 'Negative'][index]}</small></div>`).join('')}</div></div><div class="dashboard-panel wide"><h3>Review classification</h3><div class="panel-subtitle">Detected risk categories in your saved analyses</div><div class="distribution"><div class="distribution-row"><span>Genuine</span><div class="track"><i class="genuine-fill" style="width:${percentage(classification[0])}%"></i></div><b>${classification[0]}</b></div><div class="distribution-row"><span>Suspicious</span><div class="track"><i class="suspicious-fill" style="width:${percentage(classification[1])}%"></i></div><b>${classification[1]}</b></div><div class="distribution-row"><span>Fake</span><div class="track"><i class="fake-fill" style="width:${percentage(classification[2])}%"></i></div><b>${classification[2]}</b></div></div></div></div><aside class="dashboard-side"><div class="side-action-card"><span class="card-kicker">ANALYSIS TOOLKIT</span><h3>Have another review?</h3><p>Paste a new review to receive a trust score and explanation.</p><button id="dashboardStartAnalysis">＋ Start analysis</button></div></aside></div></div>`;
    $('dashboardNewReview').onclick = () => showView('single');
    $('dashboardScanUrl').onclick = () => showView('url');
    $('dashboardStartAnalysis').onclick = () => showView('single');
    renderReports();
  }

  addReportsView();
  window.renderDashboard = renderDashboard;
  setTimeout(() => {
    if ($('app') && !$('app').classList.contains('hidden')) renderDashboard();
  }, 0);
}());
