# ML Service - Fake Review Analyzer

Python Flask-based machine learning service for the Fake Review Analyzer.

## Features

- **Review Analysis**: Analyzes individual reviews for authenticity
- **Pattern Detection**: Identifies suspicious patterns across reviews
- **Fingerprinting**: Detects duplicate or templated reviews
- **Sentiment Analysis**: Measures review sentiment
- **Trust Scoring**: Calculates reliability scores
- **Batch Processing**: Analyzes multiple reviews efficiently

## Project Structure

```
ml-service/
├── src/
│   ├── analyzer.py         # Main review analyzer
│   ├── patterns.py         # Pattern detection logic
│   ├── fingerprint.py      # Duplicate detection
│   └── __init__.py
├── app.py                  # Flask application
├── requirements.txt
├── .env.example
└── README.md
```

## Installation

### Prerequisites
- Python 3.8+
- pip

### Setup

Create virtual environment:
```bash
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

## Configuration

Create `.env` file from `.env.example`:
```
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5001
```

## Running

```bash
python app.py
```

Service runs on `http://localhost:5001`

## API Endpoints

### Health
- `GET /health` - Service status

### Analysis
- `POST /analyze/review` - Analyze single review
- `POST /analyze/product` - Batch analyze reviews

### Model Management
- `GET /model/info` - View current model metadata and readiness
- `POST /model/train` - Retrain the model from a CSV dataset

## Core Components

### ReviewAnalyzer
Analyzes individual reviews using multiple criteria:
- Word count and structure
- Language quality
- Sentiment analysis
- Repetition detection
- Authenticity scoring

Methods:
- `analyze(review_text)` - Main analysis method

### PatternDetector
Detects suspicious patterns:
- Template structure
- Fake phrases
- Contact information
- Timing patterns
- Rating distribution

Methods:
- `detect(review_text)` - Single review pattern detection
- `detect_batch(reviews)` - Cross-review pattern analysis

### ReviewFingerprint
Generates fingerprints for duplicate detection:
- Text normalization
- Similarity calculation
- Phrase extraction
- Clustering

Methods:
- `generate_fingerprint(text)` - Create fingerprint hash
- `find_similar(text, text_list)` - Find similar reviews
- `cluster_similar_reviews(texts)` - Group similar reviews

## Output Format

### Single Review Analysis
```json
{
  "trust_score": 75,
  "classification": "genuine",
  "flags": ["flag1", "flag2"],
  "word_count": 150,
  "sentiment": 0.6,
  "language_quality": 0.8,
  "repetition_score": 0.2
}
```

### Batch Analysis
```json
{
  "reviews": [
    {
      "id": "review_id",
      "trustScore": 75,
      "classification": "genuine",
      "flags": []
    }
  ],
  "trustScore": 72,
  "distribution": {
    "genuine": 8,
    "suspicious": 2,
    "fake": 0
  },
  "patterns": ["pattern1"]
}
```

## Dependencies

- flask 2.3.0
- flask-cors 4.0.0
- numpy 1.24.0
- scikit-learn 1.2.0
- nltk 3.8.1
- pandas 1.5.3
- scipy 1.10.0
- requests 2.28.2
- python-dotenv 1.0.0

## NLTK Data

The service automatically downloads required NLTK data:
- vader_lexicon
- punkt
- stopwords

## Analysis Methodology

### Trust Score Calculation
Trust score is calculated from multiple components:
1. **Length Score** (20%): Reviews of appropriate length score higher
2. **Sentiment Score** (25%): Balanced sentiment indicates authenticity
3. **Language Quality** (25%): Grammar and structure analysis
4. **Repetition Score** (20%): Lower repetition indicates originality
5. **Authenticity Markers** (10%): Specific details and personal language

### Classification
- **Genuine** (70-100): Likely authentic reviews
- **Suspicious** (40-69): May contain fake elements
- **Fake** (0-39): Likely fraudulent reviews

### Red Flags
- Excessive punctuation or caps
- Extreme sentiment language
- Promotional content
- Template-like structure
- Excessive repetition
- Duplicate reviews
- Unusual timing patterns

## Performance Optimization

- Text normalization for consistent analysis
- Caching similar reviews
- Batch processing for multiple reviews
- Efficient pattern matching with regex

## Future Enhancements

- [x] Train custom ML models
- [ ] Integrate with more NLP libraries
- [ ] Add language detection
- [ ] Implement reviewer profile analysis
- [ ] Add historical comparison
- [ ] Create advanced fingerprinting
- [ ] Build ensemble models
- [ ] Add review category detection
- [ ] Implement real-time streaming analysis
- [ ] Create explainability features

### Training the Model

You can retrain the starter model from the bundled dataset:

```bash
python train_model.py
```

To retrain from the API:

```bash
curl -X POST http://localhost:5001/model/train \
  -H "Content-Type: application/json" \
  -d "{\"csvPath\": \"data/training_reviews.csv\"}"
```

## Troubleshooting

### NLTK Download Errors
```bash
python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('punkt'); nltk.download('stopwords')"
```

### Port Already in Use
```bash
# Check what's using port 5001
lsof -i :5001
# Kill the process
kill -9 <PID>
```

### Memory Issues with Large Batches
- Process reviews in smaller batches
- Optimize text normalization
- Clear cache periodically

## Testing

Create test script to verify functionality:
```python
from src.analyzer import ReviewAnalyzer

analyzer = ReviewAnalyzer()
result = analyzer.analyze("Great product! Highly recommend!")
print(result)
```
