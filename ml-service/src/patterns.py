import re
from datetime import datetime, timedelta
from collections import Counter


class PatternDetector:
    """Detect suspicious patterns in reviews"""

    def detect(self, review_text):
        """Detect patterns in a single review"""
        flags = []
        pattern_score = 0.0

        # Check for template structure
        template_score = self._check_template_structure(review_text)
        if template_score > 0.6:
            flags.append('Template-like structure detected')
            pattern_score += 0.3

        # Check for common fake review phrases
        fake_phrases = self._check_fake_phrases(review_text)
        if fake_phrases:
            flags.extend(fake_phrases)
            pattern_score += 0.2

        # Check for suspicious URLs or contact info
        if self._has_contact_info(review_text):
            flags.append('Contains contact information')
            pattern_score += 0.2

        return {
            'score': min(1, pattern_score),
            'flags': flags
        }

    def detect_batch(self, reviews):
        """Detect patterns across multiple reviews"""
        suspicious_patterns = []

        # Check for duplicate/similar reviews
        similarity_groups = self._find_similar_reviews(reviews)
        if similarity_groups:
            suspicious_patterns.append('Duplicate reviews detected')

        # Check for review timing patterns
        timing_pattern = self._analyze_timing_pattern([r.get('date') for r in reviews if r.get('date')])
        if timing_pattern['suspicious']:
            suspicious_patterns.extend(timing_pattern['patterns'])

        # Check for rating patterns
        ratings = [r.get('rating') for r in reviews if r.get('rating')]
        rating_pattern = self._analyze_rating_pattern(ratings)
        if rating_pattern['suspicious']:
            suspicious_patterns.extend(rating_pattern['patterns'])

        return {
            'suspicious_patterns': suspicious_patterns,
            'pattern_count': len(suspicious_patterns)
        }

    def _check_template_structure(self, text):
        """Check if review follows a template structure"""
        # Common template patterns
        template_indicators = [
            r'(i purchased|i bought|i ordered).*?(recently|last week|last month)',
            r'(overall|in conclusion|summary).*?(i|would|recommend)',
            r'(pros|pros and cons|advantages).*?(cons)',
            r'(verdict|final thoughts|bottom line)'
        ]

        score = 0
        for pattern in template_indicators:
            if re.search(pattern, text.lower()):
                score += 0.25

        return min(1, score)

    def _check_fake_phrases(self, text):
        """Check for common fake review phrases"""
        fake_phrases_dict = {
            'ordered': 'Marketplace language',
            'work as advertised': 'Generic positive phrase',
            'worth the money': 'Generic positive phrase',
            'highly recommend': 'Promotional phrase',
            'money well spent': 'Generic positive phrase',
            'great quality': 'Generic positive phrase',
            'fast shipping': 'Irrelevant to product quality',
            'excellent customer service': 'Irrelevant to product',
        }

        found_phrases = []
        text_lower = text.lower()
        
        for phrase, description in fake_phrases_dict.items():
            if phrase in text_lower:
                found_phrases.append(description)

        return found_phrases

    def _has_contact_info(self, text):
        """Check if review contains contact information"""
        # Check for email
        if re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text):
            return True

        # Check for phone numbers
        if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text):
            return True

        # Check for URLs
        if re.search(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text):
            return True

        return False

    def _find_similar_reviews(self, reviews, threshold=0.8):
        """Find duplicate or highly similar reviews"""
        if len(reviews) < 2:
            return []

        similar_groups = []
        processed = set()

        for i, review1 in enumerate(reviews):
            if i in processed:
                continue

            group = [i]
            text1 = review1.get('text', '').lower()
            words1 = set(text1.split())

            for j, review2 in enumerate(reviews[i+1:], start=i+1):
                if j in processed:
                    continue

                text2 = review2.get('text', '').lower()
                words2 = set(text2.split())

                # Calculate similarity using Jaccard index
                if words1 and words2:
                    intersection = len(words1 & words2)
                    union = len(words1 | words2)
                    similarity = intersection / union
                else:
                    similarity = 0

                if similarity > threshold:
                    group.append(j)
                    processed.add(j)

            if len(group) > 1:
                similar_groups.append(group)
                processed.update(group)

        return similar_groups

    def _analyze_timing_pattern(self, dates):
        """Analyze timing pattern of reviews"""
        if not dates or len(dates) < 2:
            return {'suspicious': False, 'patterns': []}

        # Parse dates and sort
        valid_dates = []
        for date in dates:
            if date:
                try:
                    if isinstance(date, str):
                        valid_dates.append(datetime.fromisoformat(date))
                    else:
                        valid_dates.append(date)
                except:
                    pass

        if len(valid_dates) < 2:
            return {'suspicious': False, 'patterns': []}

        valid_dates.sort()

        # Check for suspicious clustering
        time_diffs = []
        for i in range(1, len(valid_dates)):
            diff = (valid_dates[i] - valid_dates[i-1]).days
            time_diffs.append(diff)

        avg_diff = sum(time_diffs) / len(time_diffs) if time_diffs else 0
        
        # If most reviews come within a few days, it's suspicious
        rapid_reviews = sum(1 for d in time_diffs if d <= 1)
        rapid_ratio = rapid_reviews / len(time_diffs) if time_diffs else 0

        patterns = []
        suspicious = False

        if rapid_ratio > 0.5:
            patterns.append('Rapid review spam burst')
            suspicious = True

        if avg_diff < 5 and len(valid_dates) > 3:
            patterns.append('Concentrated review activity')
            suspicious = True

        return {'suspicious': suspicious, 'patterns': patterns}

    def _analyze_rating_pattern(self, ratings):
        """Analyze rating distribution pattern"""
        if not ratings or len(ratings) < 2:
            return {'suspicious': False, 'patterns': []}

        rating_counts = Counter(ratings)
        most_common_rating = rating_counts.most_common(1)[0]

        # Check if one rating dominates
        if most_common_rating[1] / len(ratings) > 0.7:
            return {
                'suspicious': True,
                'patterns': ['Unnatural rating distribution']
            }

        # Check for lack of mixed ratings
        unique_ratings = len(rating_counts)
        if unique_ratings == 1:
            return {
                'suspicious': True,
                'patterns': ['All reviews have same rating']
            }

        return {'suspicious': False, 'patterns': []}
