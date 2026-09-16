# Backend - Fake Review Analyzer

Express.js-based backend API for the Fake Review Analyzer.

## Features

- **Review Management**: CRUD operations for reviews
- **Product Management**: Track and analyze products
- **Analysis Orchestration**: Coordinates with ML service
- **Trust Score Calculation**: Aggregates analysis results
- **Database Integration**: MongoDB for data persistence

## Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── health.js       # Health check endpoint
│   │   ├── reviews.js      # Review operations
│   │   ├── analysis.js     # Analysis endpoints
│   │   └── products.js     # Product operations
│   ├── models/
│   │   ├── Review.js       # Review schema
│   │   └── Product.js      # Product schema
│   ├── controllers/        # Business logic (expandable)
│   ├── middleware/         # Custom middleware (expandable)
│   ├── utils/              # Helper functions (expandable)
│   └── server.js           # Express app setup
├── package.json
├── .env.example
└── README.md
```

## Installation

```bash
npm install
```

## Configuration

Create `.env` file from `.env.example`:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fake-review-analyzer
ML_SERVICE_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_key_here
LOG_LEVEL=debug
```

## Running

Development (with auto-reload):
```bash
npm run dev
```

Production:
```bash
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Health
- `GET /api/health` - Server status

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `GET /api/reviews/:id` - Get review by ID
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Analysis
- `POST /api/analysis/review` - Analyze single review
- `POST /api/analysis/product/:productId` - Analyze product
- `GET /api/analysis/trust-score/:productId` - Get trust score

### Products
- `GET /api/products/:productId` - Get product
- `POST /api/products` - Create/update product

## Database Schema

### Review
- productId (String, indexed)
- reviewText (String, required)
- rating (Number, 1-5)
- reviewer (String)
- reviewDate (Date)
- trustScore (Number)
- classification (String: genuine|suspicious|fake)
- flags (Array of strings)
- source (String: manual|amazon|ebay|google|trustpilot)

### Product
- productName (String, required)
- productUrl (String)
- platform (String)
- trustScore (Number)
- totalReviews (Number)
- reviewDistribution (Object)
- suspiciousPatterns (Array)

## Middleware

- **helmet**: Security headers
- **compression**: Response compression
- **morgan**: Request logging
- **cors**: Cross-origin support
- **express.json**: JSON parsing

## Error Handling

All errors return standardized JSON response:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Optional details"
}
```

## Dependencies

- express 4.18.2
- mongoose 7.0.0
- axios 1.3.0
- cors 2.8.5
- helmet 7.0.0
- morgan 1.10.0
- compression 1.7.4
- dotenv 16.0.3

## Future Enhancements

- [ ] Implement JWT authentication
- [ ] Add rate limiting
- [ ] Create review controller for business logic
- [ ] Add request validation middleware
- [ ] Implement caching layer
- [ ] Add comprehensive error logging
- [ ] Set up API versioning
- [ ] Add webhook support
- [ ] Create batch analysis queue
- [ ] Add metrics/monitoring
