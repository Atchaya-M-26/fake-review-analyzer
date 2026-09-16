# Fake Review Analyzer - Setup Guide

## Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- MongoDB 4.4+
- Git

## Installation Steps

### 1. Clone or Setup the Project

```bash
cd fake_review
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and set your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017/fake-review-analyzer
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# The default API URL is http://localhost:5000/api
```

### 4. ML Service Setup

```bash
cd ../ml-service

# Create Python virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

## Running the Application

### Terminal 1 - Start MongoDB
```bash
# Make sure MongoDB is running
# If using MongoDB locally, you can start it with:
mongod
```

### Terminal 2 - Start Backend Server
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### Terminal 3 - Start ML Service
```bash
cd ml-service

# Activate virtual environment
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate

python app.py
# Service runs on http://localhost:5001
```

### Terminal 4 - Start Frontend
```bash
cd frontend
npm start
# App runs on http://localhost:3000
```

## Configuration

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fake-review-analyzer
ML_SERVICE_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secret_key
LOG_LEVEL=debug
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

### ML Service (.env)
```
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5001
```

## Database Setup

MongoDB collections will be automatically created when reviews are submitted. However, you can manually set up the database:

```bash
# Connect to MongoDB
mongo

# Use or create the database
use fake-review-analyzer

# Create collections
db.createCollection("reviews")
db.createCollection("products")

# Create indexes for better performance
db.reviews.createIndex({ "productId": 1 })
db.products.createIndex({ "productUrl": 1 })
```

## Testing the Application

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Create a Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Test Product",
    "platform": "amazon",
    "sku": "TEST123"
  }'
```

### 3. Add a Review
```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "TEST123",
    "reviewText": "This is a great product! Highly recommended.",
    "rating": 5,
    "reviewer": "John Doe"
  }'
```

### 4. Analyze a Review
```bash
curl -X POST http://localhost:5000/api/analysis/review \
  -H "Content-Type: application/json" \
  -d '{
    "reviewText": "This product is amazing! Highly recommend!"
  }'
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in .env
- Verify MongoDB is listening on default port 27017

### ML Service Connection Error
- Ensure ML service is running on port 5001
- Check FLASK_ENV and FLASK_DEBUG settings
- Verify CORS is enabled

### Frontend API Errors
- Check REACT_APP_API_URL in .env
- Ensure backend is running on correct port
- Check browser console for detailed errors

### Python Dependencies Error
- Make sure virtual environment is activated
- Try: `pip install --upgrade pip`
- Reinstall dependencies: `pip install -r requirements.txt`

## Development Notes

- The application uses MongoDB for persistence
- ML service runs separately from the backend for scalability
- Frontend communicates with backend via REST API
- ML service provides analysis endpoints for reviews

## Next Steps

1. Configure MongoDB Atlas for production use
2. Set up proper authentication (JWT)
3. Implement rate limiting
4. Deploy to cloud platform
5. Set up CI/CD pipeline
6. Add comprehensive testing

## Support

For issues or questions, check:
- API Documentation: `docs/API.md`
- Individual module README files
- GitHub issues (if applicable)
