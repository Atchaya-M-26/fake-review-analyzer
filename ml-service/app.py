import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import analysis modules
from src.analyzer import ReviewAnalyzer
from src.patterns import PatternDetector
from src.fingerprint import ReviewFingerprint
from src.model_pipeline import ReviewModelPipeline

load_dotenv()

app = Flask(__name__)
CORS(app, origins='*')

# Initialize analyzers
review_analyzer = ReviewAnalyzer()
pattern_detector = PatternDetector()
fingerprint = ReviewFingerprint()
review_model = ReviewModelPipeline()

SERVICE_ROOT = Path(__file__).resolve().parent


def _merge_analysis_outputs(heuristic_analysis, model_result, pattern_flags, fingerprint_hash):
    model_classification = model_result.classification if model_result.model_available else heuristic_analysis['classification']
    heuristic_score = heuristic_analysis['trust_score']
    model_score = model_result.trust_score if model_result.model_available else heuristic_score
    pattern_penalty = min(20, len(pattern_flags) * 4)
    sentiment = heuristic_analysis.get('sentiment', 0)
    sentiment_penalty = 0
    if sentiment < -0.25:
        sentiment_penalty = min(12, abs(sentiment) * 20)

    confidence_penalty = 0
    if model_result.model_available and model_result.confidence < 0.55:
        confidence_penalty = (0.55 - model_result.confidence) * 18

    combined_trust_score = int(
        round((heuristic_score * 0.45) + (model_score * 0.55) - pattern_penalty - sentiment_penalty - confidence_penalty)
    )
    combined_trust_score = max(0, min(100, combined_trust_score))

    if combined_trust_score >= 75:
        trust_level = 'High'
        final_classification = 'genuine'
    elif combined_trust_score >= 45:
        trust_level = 'Medium'
        final_classification = 'suspicious'
    else:
        trust_level = 'Low'
        final_classification = 'fake'

    if model_result.model_available and model_result.classification == 'fake' and combined_trust_score < 65:
        final_classification = 'fake'
    elif model_result.model_available and model_result.classification == 'genuine' and combined_trust_score >= 60:
        final_classification = 'genuine'
    elif final_classification == 'genuine' and model_classification == 'suspicious' and combined_trust_score < 80:
        final_classification = 'suspicious'

    if (
        final_classification == 'genuine'
        and model_result.model_available
        and model_result.classification == 'genuine'
        and model_result.confidence < 0.55
        and sentiment < -0.25
    ):
        final_classification = 'suspicious'

    return {
        'trustScore': combined_trust_score,
        'classification': final_classification,
        'trustLevel': trust_level,
        'model': {
            'name': model_result.model_name,
            'confidence': model_result.confidence,
            'accuracy': model_result.model_accuracy,
            'f1': model_result.model_f1,
            'available': model_result.model_available,
            'probabilities': model_result.class_probabilities,
        },
        'fingerprintHash': fingerprint_hash,
    }


@app.route('/model/info', methods=['GET'])
def model_info():
    metadata = review_model.get_metadata()
    return jsonify({
        'success': True,
        'data': {
            'ready': review_model.is_ready(),
            'metadata': metadata,
        }
    })


@app.route('/model/train', methods=['POST'])
def train_model():
    try:
        data = request.get_json(silent=True) or {}
        csv_path = data.get('csvPath')

        if csv_path:
            candidate_path = Path(csv_path)
            if not candidate_path.is_absolute():
                candidate_path = SERVICE_ROOT / csv_path
        else:
            candidate_path = SERVICE_ROOT / 'data' / 'training_reviews.csv'

        if not candidate_path.exists():
            return jsonify({
                'success': False,
                'message': f'Training data not found at {candidate_path}'
            }), 400

        metadata = review_model.train_from_csv(candidate_path)
        return jsonify({
            'success': True,
            'message': 'Model retrained successfully',
            'data': {
                'ready': review_model.is_ready(),
                'metadata': metadata,
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'UP',
        'service': 'Fake Review Analyzer - ML Service'
    })

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'success': True,
        'service': 'Fake Review Analyzer - ML Service',
        'health': '/health'
    })

@app.route('/analyze/review', methods=['POST'])
def analyze_single_review():
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({
                'success': False,
                'message': 'Review text is required'
            }), 400

        # Analyze the review
        analysis = review_analyzer.analyze(text)
        patterns = pattern_detector.detect(text)
        fingerprint_hash = fingerprint.generate_fingerprint(text)
        model_result = review_model.predict(text)
        merged = _merge_analysis_outputs(analysis, model_result, patterns['flags'], fingerprint_hash)

        return jsonify({
            'success': True,
            'data': {
                'trustScore': merged['trustScore'],
                'classification': merged['classification'],
                'trustLevel': merged['trustLevel'],
                'flags': analysis['flags'] + patterns['flags'],
                'details': {
                    'wordCount': analysis['word_count'],
                    'sentimentScore': analysis['sentiment'],
                    'languageQuality': analysis['language_quality'],
                    'patternScore': patterns['score'],
                    'fingerprintHash': merged['fingerprintHash'],
                    'modelName': merged['model']['name'],
                    'modelConfidence': merged['model']['confidence'],
                    'modelAccuracy': merged['model']['accuracy'],
                    'modelF1': merged['model']['f1'],
                    'modelProbabilities': merged['model']['probabilities']
                }
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/analyze/product', methods=['POST'])
def analyze_product():
    try:
        data = request.get_json()
        reviews = data.get('reviews', [])

        if not reviews:
            return jsonify({
                'success': False,
                'message': 'No reviews provided'
            }), 400

        # Analyze all reviews
        analyzed_reviews = []
        all_flags = []
        trust_scores = []
        distribution = {'genuine': 0, 'suspicious': 0, 'fake': 0}

        for review in reviews:
            analysis = review_analyzer.analyze(review['text'])
            model_result = review_model.predict(review['text'])
            pattern_result = pattern_detector.detect(review['text'])
            merged = _merge_analysis_outputs(analysis, model_result, pattern_result['flags'], fingerprint.generate_fingerprint(review['text']))

            distribution[merged['classification']] += 1
            trust_scores.append(merged['trustScore'])
            
            analyzed_reviews.append({
                'id': review['id'],
                'trustScore': merged['trustScore'],
                'classification': merged['classification'],
                'trustLevel': merged['trustLevel'],
                'flags': analysis['flags'] + pattern_result['flags'],
                'details': {
                    **analysis,
                    'patternScore': pattern_result['score'],
                    'modelName': merged['model']['name'],
                    'modelConfidence': merged['model']['confidence'],
                    'modelAccuracy': merged['model']['accuracy'],
                    'modelF1': merged['model']['f1'],
                }
            })

            all_flags.extend(analysis['flags'] + pattern_result['flags'])

        # Calculate overall trust score
        overall_trust_score = sum(trust_scores) / len(trust_scores) if trust_scores else 0

        # Detect patterns across reviews
        patterns = pattern_detector.detect_batch(reviews)

        return jsonify({
            'success': True,
            'data': {
                'reviews': analyzed_reviews,
                'trustScore': round(overall_trust_score),
                'trustLevel': 'High' if overall_trust_score >= 75 else 'Medium' if overall_trust_score >= 45 else 'Low',
                'distribution': distribution,
                'patterns': patterns['suspicious_patterns'],
                'totalReviewsAnalyzed': len(reviews)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(debug=True, port=port, host='0.0.0.0')
