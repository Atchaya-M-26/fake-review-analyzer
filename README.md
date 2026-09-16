# Fake Online Review Analyzer with Trust Score

A comprehensive system designed to evaluate the reliability of product reviews from e-commerce platforms using advanced NLP and behavioral analysis.

## Features

- **Trust Score Generation**: Analyzes reviews and generates a reliability score
- **Review Classification**: Categorizes reviews as genuine, suspicious, or fake
- **Pattern Detection**: Identifies repetitive content and unusual review patterns
- **Time-Based Analysis**: Detects sudden bursts of reviews indicating spam/coordinated activity
- **Review Fingerprinting**: Identifies duplicate or templated reviews
- **URL Analysis**: Extracts and analyzes reviews directly from product URLs
- **Manual Review Input**: Accepts manually entered review text for analysis

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **ML/NLP**: Python (scikit-learn, spaCy, NLTK)
- **Database**: MongoDB
- **APIs**: RESTful API architecture

## Project Structure

```
fake_review/
├── frontend/           # React application
├── backend/            # Node.js/Express server
├── ml-service/         # Python ML/NLP service
├── docs/               # Documentation
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 16+
- Python 3.8+
- MongoDB 4.4+
- npm or yarn

### Installation

1. Clone the repository
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd frontend && npm install`
4. Install ML service dependencies: `cd ml-service && pip install -r requirements.txt`

### Running the Application

1. Start MongoDB
2. Run the backend: `cd backend && npm start`
3. Run the ML service: `cd ml-service && python app.py`
4. Run the frontend: `cd frontend && npm start`

## API Documentation

See `docs/API.md` for detailed API documentation.

## License

MIT
