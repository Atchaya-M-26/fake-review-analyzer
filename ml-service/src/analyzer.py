import re
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
import nltk

# Download required NLTK data
try:
    nltk.data.find('sentiment/vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')


class ReviewAnalyzer:
    def __init__(self):
        self.sia = SentimentIntensityAnalyzer()
        self.stop_words = set(stopwords.words('english'))

    def analyze(self, review_text):
        """Analyze a single review and return trust score and classification"""
        
        flags = []
        scores = {}

        # Basic metrics
        word_count = len(review_text.split())
        sentence_count = len(sent_tokenize(review_text))
        
        scores['word_count'] = word_count
        scores['sentence_count'] = sentence_count

        # Check for review length - ideal is 20-500 words
        if word_count < 15:
            flags.append('Too short review')
            scores['length_score'] = 0.2
        elif word_count > 500:
            flags.append('Unusually long review')
            scores['length_score'] = 0.4
        elif word_count < 20 or word_count > 300:
            scores['length_score'] = 0.6  # Acceptable but not ideal
        else:
            scores['length_score'] = 0.8  # Ideal length

        # Sentiment analysis
        sentiment = self.sia.polarity_scores(review_text)
        compound = sentiment['compound']
        
        # Detect extreme sentiment (very positive or very negative = more suspicious)
        if compound > 0.8 or compound < -0.8:
            flags.append('Extreme sentiment detected')
            scores['sentiment'] = 0.4  # Lower score for extreme sentiment
        else:
            # Neutral to balanced sentiment is more trustworthy
            scores['sentiment'] = (1 - abs(compound)) * 0.8 + 0.2

        # Language quality check
        language_quality = self._check_language_quality(review_text)
        scores['language_quality'] = language_quality

        if language_quality < 0.4:
            flags.append('Poor language quality')
        
        # Check for excessive repetition
        repetition_score = self._check_repetition(review_text)
        scores['repetition_score'] = repetition_score
        
        if repetition_score > 0.5:
            flags.append('Excessive repetition detected')

        # Check for suspicious patterns
        pattern_flags = self._check_suspicious_patterns(review_text)
        flags.extend(pattern_flags)

        # Calculate trust score (0-100) - more heavily weighted towards suspicious indicators
        base_score = (
            scores['length_score'] * 0.15 +
            scores['sentiment'] * 0.25 +
            language_quality * 0.25 +
            (1 - repetition_score) * 0.2 +
            self._check_authenticity(review_text) * 0.15
        )

        trust_score = base_score * 100

        # Apply penalty for each flag
        flag_penalty = len(flags) * 8
        trust_score = max(0, trust_score - flag_penalty)

        # Classify review
        if trust_score >= 70:
            classification = 'genuine'
        else:
            classification = 'suspicious'  # Below 70 is suspicious only

        # Adjust classification if too many flags
        if len(flags) >= 3:
            trust_score = min(trust_score, 45)  # Penalize heavily for multiple flags

        return {
            'trust_score': int(trust_score),
            'classification': classification,
            'flags': flags,
            'word_count': word_count,
            'sentence_count': sentence_count,
            'sentiment': compound,
            'language_quality': language_quality,
            'repetition_score': repetition_score
        }

    def _check_language_quality(self, text):
        """Check the quality of language (grammar, spelling, structure)"""
        # Simple heuristics for language quality
        words = text.split()
        
        if not words:
            return 0.1

        # Check for proper capitalization - should be 10-30% for normal reviews
        capitalized_words = sum(1 for w in words if w and w[0].isupper())
        capitalization_ratio = capitalized_words / len(words)

        # Check for sentence structure
        sentences = sent_tokenize(text)
        avg_words_per_sentence = len(words) / len(sentences) if sentences else 0

        # Check for common spelling mistakes or informal language
        informal_indicators = ['lol', 'omg', 'btw', 'fyi', 'smh', 'wtf', 'ur', 'u r']
        informal_count = sum(1 for word in words if word.lower() in informal_indicators)

        quality_score = 0.5  # Start lower, build up
        
        # Capitalization check - 10-30% is good
        if 0.1 <= capitalization_ratio <= 0.35:
            quality_score += 0.3
        elif capitalization_ratio > 0.5:
            quality_score -= 0.2  # Too much capitalization
        else:
            quality_score -= 0.1  # Too little capitalization

        # Sentence structure - 8-15 words per sentence is ideal
        if 8 <= avg_words_per_sentence <= 20:
            quality_score += 0.2
        elif avg_words_per_sentence < 5:
            quality_score -= 0.2  # Choppy sentences
        else:
            quality_score -= 0.15  # Run-on sentences

        # Penalize informal language more heavily
        quality_score -= (informal_count * 0.15)

        return max(0, min(1, quality_score))

    def _check_repetition(self, text):
        """Check for word and phrase repetition"""
        words = word_tokenize(text.lower())
        words = [w for w in words if w not in self.stop_words and w.isalnum()]

        if not words:
            return 0

        # Count word frequency
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1

        # Calculate repetition score
        max_freq = max(word_freq.values()) if word_freq else 0
        repetition_ratio = max_freq / len(words) if words else 0

        # Also check for phrase repetition
        phrases = self._extract_phrases(text)
        phrase_freq = {}
        for phrase in phrases:
            phrase_freq[phrase] = phrase_freq.get(phrase, 0) + 1

        if phrase_freq:
            max_phrase_freq = max(phrase_freq.values())
            phrase_repetition = max_phrase_freq / len(phrases)
        else:
            phrase_repetition = 0

        return max(repetition_ratio, phrase_repetition)

    def _extract_phrases(self, text, n=3):
        """Extract n-grams from text"""
        words = text.lower().split()
        phrases = []
        for i in range(len(words) - n + 1):
            phrase = ' '.join(words[i:i+n])
            phrases.append(phrase)
        return phrases

    def _check_suspicious_patterns(self, text):
        """Check for common fake review patterns"""
        flags = []

        # Check for excessive punctuation
        exclamation_count = text.count('!')
        question_count = text.count('?')
        if exclamation_count > 3 or question_count > 2:
            flags.append('Excessive punctuation')

        # Check for all caps words
        words = text.split()
        caps_words = [w for w in words if w.isupper() and len(w) > 1]
        if len(words) > 0 and len(caps_words) / len(words) > 0.15:
            flags.append('Excessive use of caps')

        # Check for suspiciously positive/negative language
        positive_words = ['amazing', 'excellent', 'wonderful', 'perfect', 'fantastic', 'incredible', 'awesome']
        negative_words = ['terrible', 'awful', 'horrible', 'worst', 'disgusting', 'pathetic']
        
        text_lower = text.lower()
        pos_count = sum(1 for word in positive_words if word in text_lower)
        neg_count = sum(1 for word in negative_words if word in text_lower)

        if pos_count > 2 or neg_count > 2:
            flags.append('Extreme sentiment language')

        # Check for promotional language
        promo_patterns = ['highly recommend', 'must buy', 'don\'t miss', 'limited time', 'buy now', 'act now', 'hurry']
        promo_count = sum(1 for pattern in promo_patterns if pattern in text_lower)
        if promo_count > 0:
            flags.append('Promotional language detected')

        # Check for comparison with competitors
        comparison_patterns = ['better than', 'not as good as', 'compared to', 'unlike', 'superior to']
        if any(pattern in text_lower for pattern in comparison_patterns):
            flags.append('Competitive comparison')

        # Check for generic placeholder-like text
        placeholder_phrases = ['this product', 'this item', 'this thing', 'works great', 'highly recommend']
        placeholder_count = sum(1 for phrase in placeholder_phrases if phrase in text_lower)
        if placeholder_count > 3:
            flags.append('Generic placeholder language')

        return flags

    def _check_authenticity(self, text):
        """Check for authentic review characteristics"""
        authenticity_score = 0.2  # Start low, require evidence of authenticity

        # Check for specific details (numbers, measurements, etc.) - strong indicator
        has_numbers = bool(re.search(r'\d', text))
        if has_numbers:
            authenticity_score += 0.25

        # Check for mixed sentiment (critical AND positive = more authentic)
        positive_words = len([w for w in text.split() if w.lower() in ['good', 'great', 'like', 'love', 'excellent', 'amazing']])
        negative_words = len([w for w in text.split() if w.lower() in ['bad', 'hate', 'poor', 'don\'t', 'not', 'disappointing']])
        
        if positive_words > 0 and negative_words > 0:
            authenticity_score += 0.3  # Mixed sentiment is very authentic
        elif positive_words > 3:
            authenticity_score -= 0.15  # Too many positive words
        elif negative_words > 3:
            authenticity_score -= 0.15  # Too many negative words

        # Check for personal experience language - strong indicator
        personal_indicators = [' i ', ' my ', ' me ', ' we ', ' our ', ' us ', 'i\'', 'my ']
        personal_count = sum(1 for indicator in personal_indicators if indicator in ' ' + text.lower() + ' ')
        if personal_count > 0:
            authenticity_score += 0.25

        return max(0, min(1, authenticity_score))
