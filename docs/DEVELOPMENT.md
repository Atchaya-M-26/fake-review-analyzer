# Development Guide

## Project Structure

```
fake_review/
├── frontend/                 # React application
│   ├── public/
│   │   └── index.html       # HTML template
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS files
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── models/          # Mongoose models
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Custom middleware
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Express app
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── ml-service/              # Python ML/NLP service
│   ├── src/
│   │   ├── analyzer.py      # Review analyzer
│   │   ├── patterns.py      # Pattern detection
│   │   ├── fingerprint.py   # Duplicate detection
│   │   └── __init__.py
│   ├── app.py               # Flask app
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── docs/                    # Documentation
│   ├── API.md               # API documentation
│   ├── SETUP.md             # Setup guide
│   ├── ARCHITECTURE.md      # Architecture overview
│   └── DEVELOPMENT.md       # This file
│
├── README.md                # Project overview
└── .gitignore
```

## Code Style Guide

### JavaScript/React

**File Naming:**
- Components: PascalCase (e.g., `Navbar.js`)
- Pages: PascalCase (e.g., `Home.js`)
- Services: camelCase (e.g., `api.js`)
- Styles: match component name (e.g., `Navbar.css`)

**Component Structure:**
```javascript
import React from 'react';

function ComponentName() {
  // State
  // Effects
  // Event handlers
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

### Python

**Style:**
- Follow PEP 8
- Use descriptive variable and function names
- Add docstrings to classes and methods
- Use type hints where possible

**Class Structure:**
```python
class ClassName:
    """Class description"""
    
    def __init__(self, param1, param2):
        """Initialize class"""
        self.param1 = param1
        self.param2 = param2
    
    def method_name(self):
        """Method description"""
        pass
```

### Node.js/Express

**File Naming:**
- Routes: plural (e.g., `reviews.js`)
- Models: singular (e.g., `Review.js`)
- Controllers: camelCase (e.g., `reviewController.js`)

## Adding New Features

### Adding a New API Endpoint

1. **Create route handler** in `backend/src/routes/`
2. **Define data model** in `backend/src/models/` (if needed)
3. **Test endpoint** with curl or Postman
4. **Update API documentation** in `docs/API.md`

Example:
```javascript
// routes/reviews.js
router.get('/recent', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Adding a New Frontend Page

1. **Create component** in `frontend/src/pages/`
2. **Create stylesheet** in `frontend/src/pages/`
3. **Add route** in `frontend/src/App.js`
4. **Add navigation link** in `Navbar.js` (if needed)

Example:
```javascript
// pages/NewPage.js
import React from 'react';
import './NewPage.css';

function NewPage() {
  return (
    <div className="new-page">
      {/* Content */}
    </div>
  );
}

export default NewPage;
```

### Adding ML Analysis Function

1. **Add method** to appropriate class in `ml-service/src/`
2. **Test with sample data**
3. **Create Flask endpoint** in `app.py`
4. **Update backend route** to call new endpoint

Example:
```python
# fingerprint.py
def new_analysis_method(self, text):
    """Analyze text using new method"""
    # Implementation
    return result

# app.py
@app.route('/analyze/new-method', methods=['POST'])
def new_analysis():
    data = request.get_json()
    result = fingerprint.new_analysis_method(data['text'])
    return jsonify({'success': True, 'data': result})
```

## Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

### ML Service Testing
```bash
cd ml-service
pytest
```

### Manual API Testing
```bash
# Using curl
curl -X POST http://localhost:5000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"productId": "123", "reviewText": "Great!"}'

# Or use Postman for GUI
```

## Debugging

### Frontend
- Use React Developer Tools browser extension
- Check Network tab in browser DevTools
- Add console.log for debugging

### Backend
- Check console output with Morgan logging
- Use MongoDB Compass to inspect database
- Add detailed error messages

### ML Service
- Check Flask debug output
- Add print statements for debugging
- Use Python debugger: `pdb.set_trace()`

## Common Issues

### CORS Errors
- Check CORS configuration in backend (`server.js`)
- Verify FRONTEND_URL in .env
- Clear browser cache

### MongoDB Connection
- Ensure MongoDB is running
- Check connection string in .env
- Verify network access

### ML Service Not Found
- Ensure ML service is running on correct port
- Check ML_SERVICE_URL in backend .env
- Verify Flask app is initialized

### Port Already in Use
```bash
# Kill process using port
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -i :5000
kill -9 <PID>
```

## Performance Tips

1. **Frontend**: Use React.memo for expensive components
2. **Backend**: Add database indexes for frequently queried fields
3. **ML Service**: Cache analysis results for identical texts
4. **Database**: Use pagination for large result sets

## Deployment Checklist

- [ ] Update environment variables for production
- [ ] Enable authentication (JWT)
- [ ] Set up rate limiting
- [ ] Configure HTTPS
- [ ] Set up database backups
- [ ] Enable error monitoring (e.g., Sentry)
- [ ] Run security audit
- [ ] Load test the application
- [ ] Set up CI/CD pipeline
- [ ] Document deployment process

## Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes following code style guide
3. Test thoroughly
4. Commit with descriptive messages
5. Push and create pull request
