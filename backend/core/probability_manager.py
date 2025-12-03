"""
Probability Manager - Pure Python Implementation
"""

import math
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class ProbabilityManager:
    """Manage probabilities using pure Python"""
    
    def __init__(self):
        self.answer_confidence = {
            'yes': 0.95, 'probably': 0.75, 'dontknow': 0.50,
            'probablynot': 0.75, 'no': 0.95
        }
        
        self.likelihood_params = {
            'yes': {'match': 2.5, 'mismatch': 0.05},
            'probably': {'match': 1.5, 'mismatch': 0.3},
            'dontknow': {'match': 1.0, 'mismatch': 1.0},
            'probablynot': {'match': 0.3, 'mismatch': 1.5},
            'no': {'match': 0.05, 'mismatch': 2.5}
        }
    
    def update_item_probability(self, item, question: Dict, answer: str) -> float:
        """Update item probability"""
        prior = item.probability
        
        attribute = question['attribute']
        target_value = question['value']
        item_value = item.attributes.get(attribute)
        
        if isinstance(item_value, list):
            matches = target_value in item_value
        else:
            matches = item_value == target_value
        
        params = self.likelihood_params.get(answer, self.likelihood_params['dontknow'])
        likelihood = params['match'] if matches else params['mismatch']
        
        confidence = self.answer_confidence.get(answer, 0.5)
        if confidence < 1.0:
            likelihood = 1.0 + (likelihood - 1.0) * confidence
        
        return prior * likelihood
    
    def normalize_probabilities(self, items: List) -> List:
        """Normalize probabilities"""
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return items
        
        total_prob = sum(item.probability for item in active_items)
        
        if total_prob == 0:
            uniform_prob = 1.0 / len(active_items)
            for item in active_items:
                item.probability = uniform_prob
        else:
            for item in active_items:
                item.probability = item.probability / total_prob
        
        return items
    
    def soft_filter(self, items: List, threshold: float = 0.01) -> List:
        """Soft filter items"""
        for item in items:
            if item.probability < threshold:
                item.eliminated = True
        
        active_items = [i for i in items if not i.eliminated]
        if len(active_items) < 3:
            sorted_items = sorted(items, key=lambda x: x.probability, reverse=True)
            for i in range(min(3, len(sorted_items))):
                sorted_items[i].eliminated = False
        
        return items
    
    def calculate_entropy(self, items: List) -> float:
        """Calculate entropy"""
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0.0
        
        probs = [i.probability for i in active_items]
        total = sum(probs)
        
        if total == 0:
            return 0.0
        
        probs = [p / total for p in probs]
        entropy = -sum(p * math.log2(p + 1e-10) for p in probs if p > 0)
        
        return entropy
    
    def estimate_questions_remaining(self, items: List, target_confidence: float = 0.9) -> int:
        """Estimate remaining questions"""
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0
        
        current_entropy = self.calculate_entropy(active_items)
        
        if current_entropy == 0:
            return 0
        
        # Simple estimation
        questions_needed = max(0, int(math.ceil(current_entropy / 0.3)))
        return min(questions_needed, 10)
