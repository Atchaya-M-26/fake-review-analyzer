# Fake Review Analyzer - API Documentation

## Overview

The Fake Review Analyzer API provides endpoints for analyzing product reviews and generating trust scores. The system uses both backend API calls and machine learning services for comprehensive analysis.

## API Endpoints

### Health Check

#### `GET /api/health`
Check if the backend is running.

**Response:**
```json
{
  "status": "UP",
  "timestamp": "2024-04-16T10:30:00Z",
  "service": "Fake Review Analyzer - Backend"
}
```

### Reviews

#### `GET /api/reviews/product/:productId`
Get all reviews for a specific product.

**Parameters:**
- `productId` (path): Product identifier

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "review_id",
      "productId": "product_123",
      "reviewText": "Great product!",
      "rating": 5,
      "trustScore": 85,
      "classification": "genuine",
      "flags": [],
      "createdAt": "2024-04-16T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### `GET /api/reviews/:id`
Get a specific review by ID.

**Response:**
```json
{
  "success": true,
  "data": { /* review object */ }
}
```

#### `POST /api/reviews`
Create a new review.

**Request Body:**
```json
{
  "productId": "product_123",
  "reviewText": "This is my review",
  "rating": 4,
  "reviewer": "John Doe",
  "verified": true,
  "source": "manual"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* created review object */ },
  "message": "Review created successfully"
}
```

#### `PUT /api/reviews/:id`
Update an existing review.

#### `DELETE /api/reviews/:id`
Delete a review.

### Analysis

#### `POST /api/analysis/review`
Analyze a single review text for authenticity.

**Request Body:**
```json
{
  "reviewText": "This product is amazing! Highly recommend!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trustScore": 65,
    "classification": "suspicious",
    "flags": [
      "Extreme sentiment language",
      "Promotional language detected"
    ],
    "details": {
      "wordCount": 8,
      "sentimentScore": 0.8,
      "languageQuality": 0.7,
      "patternScore": 0.5
    }
  }
}
```

#### `POST /api/analysis/product/:productId`
Analyze all reviews for a product and generate overall trust score.

**Response:**
```json
{
  "success": true,
  "data": {
    "trustScore": 72,
    "reviewDistribution": {
      "genuine": 8,
      "suspicious": 3,
      "fake": 1
    },
    "patterns": [
      "Duplicate reviews detected",
      "Rapid review spam burst"
    ],
    "reviewsAnalyzed": 12
  }
}
```

#### `GET /api/analysis/trust-score/:productId`
Get the pre-calculated trust score for a product.

**Response:**
```json
{
  "success": true,
  "data": {
    "trustScore": 72,
    "distribution": { /* rating distribution */ },
    "patterns": [],
    "lastAnalyzed": "2024-04-16T10:30:00Z"
  }
}
```

### Products

#### `GET /api/products/:productId`
Get product details.

**Response:**
```json
{
  "success": true,
  "data": {
    "productName": "Example Product",
    "productUrl": "https://example.com/product",
    "platform": "amazon",
    "trustScore": 72,
    "totalReviews": 12,
    "lastAnalyzed": "2024-04-16T10:30:00Z"
  }
}
```

#### `POST /api/products`
Create or update a product.

**Request Body:**
```json
{
  "productName": "Example Product",
  "productUrl": "https://example.com/product",
  "platform": "amazon",
  "sku": "SKU123"
}
```

## ML Service Endpoints

The ML service runs on port 5001 and provides analysis endpoints:

### Health Check
`GET /health` - Check ML service status

### Single Review Analysis
`POST /analyze/review`
- Input: `{ "text": "review text" }`
- Output: Analysis object with trust score

### Product Analysis
`POST /analyze/product`
- Input: `{ "reviews": [ { "id": "...", "text": "...", "rating": 5, "date": "..." } ] }`
- Output: Batch analysis with overall trust score

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Optional error details"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

Currently, no authentication is required. In production, consider implementing JWT authentication.

## Rate Limiting

Currently no rate limiting. Consider implementing in production.

## CORS

CORS is enabled for all origins. Restrict to specific domains in production.
