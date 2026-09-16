(function () {
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
  const productId = location.pathname.match(/\/products\/([^/]+)/)?.[1];

  async function load() {
    const response = await fetch(productId ? `/api/demo-products/${encodeURIComponent(productId)}` : '/demo/demo_store.json');
    if (!response.ok) throw new Error('Unable to load demo catalog.');
    const data = await response.json();
    if (productId) renderProduct(data);
    else renderCatalog(data.products);
  }

  function renderCatalog(products) {
    document.getElementById('products').innerHTML = products.map(product => `
      <article class="product-card">
        <img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
        <p class="category">${escapeHtml(product.category)}</p>
        <h2>${escapeHtml(product.title)}</h2>
        <p>${product.reviews.length} sample reviews available for analysis.</p>
        <a class="button" href="/demo/products/${encodeURIComponent(product.id)}">View reviews</a>
      </article>
    `).join('');
  }

  function renderProduct(product) {
    document.title = `${product.title} - SampleCart`;
    document.getElementById('product').innerHTML = `
      <a class="back-link" href="/demo/">← All products</a>
      <p class="eyebrow">${escapeHtml(product.category)}</p>
      <h1>${escapeHtml(product.title)}</h1>
      <img class="product-hero-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}">
      <p class="product-note">This is a controlled demo product. Copy this URL into the Review Analyzer to scan its reviews.</p>
      <div class="review-list">${product.reviews.map((review, index) => `
        <article class="review-card">
          <div class="review-heading"><strong>${review.rating}/5 stars</strong><span>Review ${index + 1}</span></div>
          <p>${escapeHtml(review.text)}</p>
          <small>By ${escapeHtml(review.reviewer)} · ${escapeHtml(review.date)}</small>
        </article>
      `).join('')}</div>
    `;
  }

  load().catch(error => {
    const target = document.getElementById('products') || document.getElementById('product');
    target.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  });
}());
