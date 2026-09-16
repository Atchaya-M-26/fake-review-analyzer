const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const analyzeReview = async (data) => {
  const response = await fetch(`${API_URL}/analysis/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze review');
  }

  return response.json();
};

export const analyzeProduct = async (productId) => {
  const response = await fetch(`${API_URL}/analysis/product/${productId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to analyze product');
  }

  return response.json();
};

export const getTrustScore = async (productId) => {
  const response = await fetch(`${API_URL}/analysis/trust-score/${productId}`);

  if (!response.ok) {
    throw new Error('Failed to get trust score');
  }

  return response.json();
};

export const getReviews = async (productId) => {
  const response = await fetch(`${API_URL}/reviews/product/${productId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }

  return response.json();
};
