"""
Confidence Calculator - Pure Python Implementation
"""

import math
from typing import List
import logging

logger = logging.getLogger(__name__)


class ConfidenceCalculator:
    """Calculate confidence using pure Python"""
    
    def __init__(self):
        self.weights = {
            'probability_gap': 0.40,
            'normalized_prob': 0.30,
            'item_count': 0.20,
            'entropy': 0.10
        }
    
    def calculate(self, items: List) -> float:
        """Calculate overall confidence"""
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0.0
        
        if len(active_items) == 1:
            return 95.0
        
        prob_gap_conf = self._probability_gap_confidence(active_items)
        norm_prob_conf = self._normalized_probability_confidence(active_items)
        item_count_conf = self._item_count_confidence(active_items, len(items))
        entropy_conf = self._entropy_confidence(active_items)
        
        total_confidence = (
            self.weights['probability_gap'] * prob_gap_conf +
            self.weights['normalized_prob'] * norm_prob_conf +
            self.weights['item_count'] * item_count_conf +
            self.weights['entropy'] * entropy_conf
        )
        
        confidence = min(95.0, total_confidence)
        
        logger.debug(f"Confidence: gap={prob_gap_conf:.1f}, norm={norm_prob_conf:.1f}, "
                    f"count={item_count_conf:.1f}, entropy={entropy_conf:.1f}, total={confidence:.1f}")
        
        return confidence
    
    def _probability_gap_confidence(self, items: List) -> float:
        """Confidence from gap between top and second"""
        if len(items) < 2:
            return 100.0
        
        sorted_items = sorted(items, key=lambda x: x.probability, reverse=True)
        
        top_prob = sorted_items[0].probability
        second_prob = sorted_items[1].probability
        
        if top_prob + second_prob == 0:
            return 50.0
        
        gap = (top_prob - second_prob) / (top_prob + second_prob)
        confidence = 50.0 + (gap * 50.0)
        
        return confidence
    
    def _normalized_probability_confidence(self, items: List) -> float:
        """Confidence from normalized probability"""
        if not items:
            return 0.0
        
        top_prob = max(item.probability for item in items)
        total_prob = sum(item.probability for item in items)
        
        if total_prob == 0:
            return 50.0
        
        normalized = top_prob / total_prob
        return normalized * 100.0
    
    def _item_count_confidence(self, active_items: List, total_items: int) -> float:
        """Confidence from item count"""
        if total_items == 0:
            return 50.0
        
        active_count = len(active_items)
        
        if active_count == 1:
            return 95.0
        elif active_count == 2:
            return 85.0
        elif active_count <= 5:
            elimination_rate = 1.0 - (active_count / total_items)
            return 70.0 + (elimination_rate * 20.0)
        else:
            elimination_rate = 1.0 - (active_count / total_items)
            return 30.0 + (elimination_rate * 60.0)
    
    def _entropy_confidence(self, items: List) -> float:
        """Confidence from entropy"""
        if not items:
            return 0.0
        
        probs = [item.probability for item in items]
        total = sum(probs)
        
        if total == 0:
            return 50.0
        
        probs = [p / total for p in probs]
        entropy = -sum(p * math.log2(p + 1e-10) for p in probs if p > 0)
        
        max_entropy = math.log2(len(items)) if len(items) > 1 else 1.0
        
        if max_entropy == 0:
            return 100.0
        
        norm_entropy = entropy / max_entropy
        confidence = (1.0 - norm_entropy) * 100.0
        
        return confidence
    
    def get_confidence_level(self, confidence: float) -> str:
        """Get textual confidence level"""
        if confidence >= 90:
            return "Very High"
        elif confidence >= 75:
            return "High"
        elif confidence >= 60:
            return "Moderate"
        elif confidence >= 40:
            return "Low"
        else:
            return "Very Low"
    
    def should_make_guess(self, confidence: float, questions_asked: int, 
                         max_questions: int) -> bool:
        """Determine if should guess"""
        if questions_asked >= max_questions:
            return True
        
        if confidence >= 95:
            return True
        
        if confidence >= 85 and questions_asked >= (max_questions * 0.7):
            return True
        
        return False
