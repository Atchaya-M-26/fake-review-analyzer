(function () {
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
  const productId = location.pathname.match(/\/products\/([^/]+)/)?.[1];
  const reviewTemplates = [
    'The product arrived on time and matched the description. I have used it several times and it performs reliably.',
    'The quality is reasonable for the price. The design is practical, although there are a few small areas that could be improved.',
    'I have been using this for over a week and it has fit smoothly into my daily routine. Setup was straightforward.',
    'The materials feel solid and the instructions were clear. It is useful, but I would compare the size carefully before ordering.',
    'This works as expected for normal use. The finish is good and cleaning or storing it has been simple.',
    'I like the overall design and have not noticed any major problems. Delivery packaging also kept the product protected.',
    'The product is comfortable to use and the controls are easy to understand. Performance has been consistent so far.',
    'It is a decent option for everyday use. A small improvement to the accessories would make the package more complete.',
    'The item looks like the photos and feels well made. I would recommend it for someone with similar needs.',
    'After several uses, the product remains functional and easy to handle. The value depends on the current price.',
    'The size was accurate and the product was ready to use quickly. It has been dependable during normal use.',
    'I noticed a minor issue with the finish, but it does not affect the main function. Overall, it is acceptable.',
    'The instructions could include more detail, though the product itself was not difficult to operate.',
    'This is useful for my home and takes up less space than expected. The build quality feels average but durable.',
    'I tested the product in different situations and the results were generally good. It is not perfect, but it is practical.',
    'The product has been convenient for regular use and the basic features work properly. It offers fair value for a demo purchase.',
    'I am satisfied with the function and appearance. There was no complicated setup, and it has handled my usual tasks well.'
  ];
  function enrichProduct(product) {
    const reviews = [...product.reviews];
    reviewTemplates.forEach((text, offset) => {
      if (reviews.length < 20) reviews.push({
        text, rating: 3 + ((offset + Number(product.id)) % 3 === 2 ? 1 : 0),
        date: `2026-${String(5 + ((offset + Number(product.id)) % 3)).padStart(2, '0')}-${10 + offset}`,
        reviewer: `reviewer-${product.id}01${offset + product.reviews.length}`
      });
    });
    return { ...product, reviews: reviews.slice(0, 25) };
  }

  async function load() {
    const response = await fetch(productId ? `/api/demo-products/${encodeURIComponent(productId)}` : '/demo/demo_store.json');
    if (!response.ok) throw new Error('Unable to load demo catalog.');
    const data = await response.json();
    if (data.products) data.products = data.products.map(enrichProduct);
    else enrichProduct(data).reviews.forEach((review, index) => { data.reviews[index] = review; });
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
