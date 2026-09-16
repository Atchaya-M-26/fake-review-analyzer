# Project Architecture

## Overview

The Fake Review Analyzer is a full-stack application consisting of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│              Running on http://localhost:3000               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ REST API Calls
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 Backend (Node.js/Express)                    │
│              Running on http://localhost:5000               │
│                                                              │
│  ├── /api/reviews       - Review management                 │
│  ├── /api/products      - Product management                │
│  └── /api/analysis      - Calls ML Service for analysis    │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴───────────────┐
        │                              │
        │ Database Queries             │ ML Service Requests
        │                              │
┌───────▼──────────────┐    ┌─────────▼────────────────────┐
│    MongoDB          │    │   ML Service (Python)       │
│ (Persistent Store)  │    │ Running on :5001            │
│                     │    │                              │
│ - Reviews           │    │ ├── Review Analysis        │
│ - Products          │    │ ├── Pattern Detection      │
│ - Analysis Results  │    │ ├── Fingerprinting         │
└─────────────────────┘    └──────────────────────────────┘
```

## Component Details

### Frontend (React)
- **Location**: `frontend/`
- **Port**: 3000
- **Key Features**:
  - Home page with project information
  - Analyzer page for review input (manual or URL)
  - Results page with trust score and detailed analysis
  - Navigation between pages

**Main Files**:
- `src/pages/` - Main pages (Home, Analyzer, Results)
- `src/components/` - Reusable components
- `src/services/api.js` - API integration
- `src/styles/` - CSS files

### Backend (Node.js/Express)
- **Location**: `backend/`
- **Port**: 5000
- **Key Features**:
  - REST API endpoints for reviews and products
  - MongoDB integration
  - Request validation and error handling
  - CORS support
  - ML service orchestration

**Main Files**:
- `src/routes/` - API route definitions
- `src/models/` - MongoDB schemas
- `src/controllers/` - Business logic
- `src/middleware/` - Custom middleware

### ML Service (Python/Flask)
- **Location**: `ml-service/`
- **Port**: 5001
- **Key Features**:
  - Review text analysis
  - Trust score calculation
  - Pattern detection
  - Review fingerprinting
  - Sentiment analysis

**Main Components**:
- `analyzer.py` - Main analysis engine
- `patterns.py` - Pattern detection logic
- `fingerprint.py` - Duplicate detection

### Database (MongoDB)
- **Default URI**: `mongodb://localhost:27017/fake-review-analyzer`
- **Collections**:
  - `reviews` - Individual review records
  - `products` - Product information and aggregate data

## Data Flow

### Analyze Single Review
1. User enters review text in frontend
2. Frontend sends POST request to `/api/analysis/review`
3. Backend receives request and forwards to ML service
4. ML service analyzes the review:
   - Sentiment analysis
   - Language quality check
   - Pattern detection
   - Authenticity scoring
5. ML service returns analysis results
6. Backend returns data to frontend
7. Frontend displays results with trust score

### Analyze Product (Multiple Reviews)
1. User selects product for analysis
2. Frontend sends POST request to `/api/analysis/product/:productId`
3. Backend fetches all reviews from MongoDB
4. Backend sends batch request to ML service
5. ML service performs:
   - Individual review analysis
   - Cross-review pattern detection
   - Timing analysis (spam bursts)
   - Duplicate detection
   - Rating distribution analysis
6. ML service returns aggregated results
7. Backend updates product record in MongoDB
8. Frontend receives and displays overall trust score

### Review Storage
1. User submits review through frontend
2. Backend validates and stores in MongoDB
3. Review can later be analyzed individually or as part of product batch

## Technology Stack

### Frontend
- React.js - UI framework
- React Router - Page navigation
- Axios - HTTP client
- CSS3 - Styling

### Backend
- Node.js - Runtime
- Express.js - Web framework
- Mongoose - MongoDB ODM
- Helmet - Security headers
- Morgan - Request logging
- CORS - Cross-origin support

### ML/NLP
- Python 3.8+ - Language
- Flask - Web framework
- NLTK - NLP processing
- scikit-learn - Machine learning
- NumPy/Pandas - Data processing

### Database
- MongoDB - NoSQL database

## API Contract

### Request/Response Format
All API requests and responses use JSON format.

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional message"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Optional error details"
}
```

## Deployment Considerations

### Frontend
- Build: `npm run build`
- Deploy to: Vercel, Netlify, AWS S3 + CloudFront

### Backend
- Build: `npm install && npm start`
- Deploy to: Heroku, AWS EC2, DigitalOcean, Railway

### ML Service
- Requirements: Python 3.8+ with pip
- Deploy to: Separate Python server or containerized (Docker)

### Database
- Use MongoDB Atlas for managed cloud hosting
- Alternative: Self-hosted MongoDB on server

## Scalability Notes

1. **ML Service**: Can be horizontally scaled with load balancer
2. **Backend**: Can run multiple instances with load balancer
3. **Frontend**: Static files served via CDN
4. **Database**: Consider sharding for very large datasets
5. **Caching**: Add Redis layer for frequently accessed data

## Security Considerations

1. Add JWT authentication for API endpoints
2. Implement rate limiting to prevent abuse
3. Use HTTPS in production
4. Validate and sanitize all inputs
5. Add CORS restrictions to specific domains
6. Environment variables for sensitive data
7. Database access control and backups
