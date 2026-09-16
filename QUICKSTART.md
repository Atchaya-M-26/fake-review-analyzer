# Quick Start Guide

## Installation Complete! ✓

All dependencies have been successfully installed:

### Backend (Node.js/Express)
- ✓ Express 4.22.1
- ✓ Mongoose 7.8.9 (MongoDB)
- ✓ All supporting packages installed

### Frontend (React)
- ✓ React 18.3.1
- ✓ React Router 6.30.3
- ✓ Axios 1.15.0
- ✓ All supporting packages installed

### ML Service (Python)
- ✓ Flask 3.1.3
- ✓ NLTK 3.9.4
- ✓ scikit-learn 1.8.0
- ✓ NumPy, Pandas, SciPy installed

### Configuration Files
- ✓ `.env` files created for all three services
- ✓ MongoDB URI configured: `mongodb://localhost:27017/fake-review-analyzer`
- ✓ API endpoints configured and connected

---

## Running the Application

You need **3 terminal windows** to run all services:

### Terminal 1: MongoDB
First, ensure MongoDB is running:
```bash
mongod
```

### Terminal 2: Backend API (Express)
```bash
cd c:\Users\Anjali\OneDrive\Desktop\fake_review\backend
npm start
```
Backend will run on: **http://localhost:5000**
API endpoints available at: **http://localhost:5000/api**

### Terminal 3: ML Service (Flask)
```bash
cd c:\Users\Anjali\OneDrive\Desktop\fake_review\ml-service
python app.py
```
ML Service will run on: **http://localhost:5001**

### Terminal 4: Frontend (React)
```bash
cd c:\Users\Anjali\OneDrive\Desktop\fake_review\frontend
npm start
```
Frontend will run on: **http://localhost:3000**

---

## Testing the Application

Once all services are running:

1. **Open your browser**: http://localhost:3000
2. **Navigate to Analyzer page**: Click "Start Analysis" or go to `/analyze`
3. **Test Manual Review Analysis**:
   - Enter a Product ID: `test-product-001`
   - Enter a review text: "This product is amazing! Highly recommend!"
   - Click "Analyze Review"
   - You should see results with a trust score

4. **Test API Directly** (using curl or Postman):
```bash
# Health check
curl http://localhost:5000/api/health

# Create a review
curl -X POST http://localhost:5000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"productId":"test-123","reviewText":"Great product!","rating":5}'

# Analyze a review
curl -X POST http://localhost:5000/api/analysis/review \
  -H "Content-Type: application/json" \
  -d '{"reviewText":"This product is amazing!"}'
```

---

## Troubleshooting

### Port Already in Use
If a port is already in use:
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the actual number)
taskkill /PID <PID> /F
```

### MongoDB Not Running
- Install MongoDB Community: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
- Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### Python/Flask Issues
Make sure you're in the correct directory:
```bash
cd c:\Users\Anjali\OneDrive\Desktop\fake_review\ml-service
python app.py
```

### React Development Server Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -r node_modules && npm install`

---

## Next Steps

After successful startup:

1. **Explore the UI**: Test different review analysis scenarios
2. **Check the API**: Review the API documentation in `docs/API.md`
3. **Customize**: Modify analysis logic in `ml-service/src/analyzer.py`
4. **Add Features**: Extend functionality as needed
5. **Deploy**: Follow deployment guide when ready

---

## File Locations

```
c:\Users\Anjali\OneDrive\Desktop\fake_review\
├── backend/              → Node.js API server
├── frontend/             → React web application
├── ml-service/           → Python analysis engine
├── docs/
│   ├── API.md           → API documentation
│   ├── SETUP.md         → Detailed setup guide
│   ├── ARCHITECTURE.md  → System design
│   └── DEVELOPMENT.md   → Development guide
└── README.md            → Project overview
```

---

## Support Resources

- **API Documentation**: See `docs/API.md`
- **Architecture Overview**: See `docs/ARCHITECTURE.md`
- **Development Guide**: See `docs/DEVELOPMENT.md`
- **Setup Instructions**: See `docs/SETUP.md`

**Everything is ready to go! Happy analyzing! 🚀**
