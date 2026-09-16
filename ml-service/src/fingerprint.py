import hashlib
from difflib import SequenceMatcher


class ReviewFingerprint:
    """Generate fingerprints for reviews to detect duplicates"""

    def generate_fingerprint(self, text):
        """Generate a fingerprint hash for a review"""
        # Normalize text
        normalized = self._normalize_text(text)
        
        # Generate hash
        fingerprint_hash = hashlib.md5(normalized.encode()).hexdigest()
        return fingerprint_hash

    def find_similar(self, text, text_list, threshold=0.85):
        """Find similar reviews in a list"""
        fingerprint = self.generate_fingerprint(text)
        similar_reviews = []

        normalized_text = self._normalize_text(text)

        for idx, review_text in enumerate(text_list):
            normalized_review = self._normalize_text(review_text)
            
            # Calculate similarity
            similarity = self._calculate_similarity(normalized_text, normalized_review)
            
            if similarity >= threshold:
                similar_reviews.append({
                    'index': idx,
                    'similarity': similarity,
                    'text': review_text
                })

        return {
            'fingerprint': fingerprint,
            'similar_reviews': similar_reviews,
            'similarity_score': max([s['similarity'] for s in similar_reviews]) if similar_reviews else 0
        }

    def _normalize_text(self, text):
        """Normalize text for fingerprinting"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Remove punctuation but keep structure
        import re
        text = re.sub(r'[^\w\s]', '', text)
        
        # Remove numbers (they can vary)
        text = re.sub(r'\d+', '', text)
        
        return text

    def _calculate_similarity(self, text1, text2):
        """Calculate similarity between two normalized texts"""
        # Use SequenceMatcher for similarity ratio
        ratio = SequenceMatcher(None, text1, text2).ratio()
        return ratio

    def get_common_phrases(self, texts, min_phrase_length=5, min_count=2):
        """Find commonly repeated phrases across reviews"""
        phrase_counter = {}

        for text in texts:
            normalized = self._normalize_text(text)
            phrases = self._extract_phrases(normalized, min_phrase_length)
            
            for phrase in phrases:
                phrase_counter[phrase] = phrase_counter.get(phrase, 0) + 1

        # Filter phrases that appear multiple times
        common_phrases = {
            phrase: count for phrase, count in phrase_counter.items()
            if count >= min_count
        }

        return sorted(common_phrases.items(), key=lambda x: x[1], reverse=True)

    def _extract_phrases(self, text, min_length=5):
        """Extract meaningful phrases from text"""
        words = text.split()
        phrases = set()

        # Extract n-grams of different sizes
        for n in range(2, min(6, len(words) // 2 + 1)):
            for i in range(len(words) - n + 1):
                phrase = ' '.join(words[i:i+n])
                if len(phrase) >= min_length:
                    phrases.add(phrase)

        return phrases

    def cluster_similar_reviews(self, texts, threshold=0.8):
        """Cluster similar reviews together"""
        clusters = []
        assigned = set()

        for i, text in enumerate(texts):
            if i in assigned:
                continue

            cluster = [i]
            assigned.add(i)
            
            normalized_i = self._normalize_text(text)

            for j, other_text in enumerate(texts[i+1:], start=i+1):
                if j in assigned:
                    continue

                normalized_j = self._normalize_text(other_text)
                similarity = self._calculate_similarity(normalized_i, normalized_j)

                if similarity >= threshold:
                    cluster.append(j)
                    assigned.add(j)

            if len(cluster) > 1:
                clusters.append(cluster)

        return clusters
