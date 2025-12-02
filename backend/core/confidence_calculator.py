"""
Confidence Calculator - Pure Python Implementation
V2: Uses Entropy, Probability Gap, and Adaptive Thresholds for Guessing.
"""

import math
from typing import List, Dict
import logging

from models.item_model import Item
from backend.config import GAME_CONFIG

logger = logging.getLogger(__name__)


class ConfidenceCalculator:
    """Calculate confidence using advanced pure Python metrics."""
    
    def __init__(self):
        self.weights = {
            'probability_gap': 0.40,
            'normalized_prob': 0.30,
            'item_count': 0.20,
            'entropy': 0.10
        }
        self.epsilon = 1e-10
    
    def calculate(self, items: List[Item]) -> float:
        """Calculate overall confidence (0-100)"""
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0.0
        
        if len(active_items) == 1:
            return 99.9  # Near certainty
        
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
        
        confidence = min(99.9, total_confidence)
        
        logger.debug(f"Confidence: gap={prob_gap_conf:.1f}, norm={norm_prob_conf:.1f}, "
                    f"count={item_count_conf:.1f}, entropy={entropy_conf:.1f}, total={confidence:.1f}")
        
        return confidence
    
    def _probability_gap_confidence(self, items: List[Item]) -> float:
        """Confidence from gap between top and second item's probability."""
        if len(items) < 2:
            return 100.0
        
        sorted_items = sorted(items, key=lambda x: x.probability, reverse=True)
        
        top_prob = sorted_items[0].probability
        second_prob = sorted_items[1].probability
        
        prob_sum = top_prob + second_prob
        if prob_sum < self.epsilon:
            return 50.0
        
        # Gap normalized to [0, 1] then scaled to [50, 100]
        gap_normalized = (top_prob - second_prob) / prob_sum
        confidence = 50.0 + (gap_normalized * 50.0)
        
        return confidence
    
    def _normalized_probability_confidence(self, items: List[Item]) -> float:
        """Confidence based on the top item's probability share."""
        if not items:
            return 0.0
        
        top_prob = max(item.probability for item in items)
        total_prob = sum(item.probability for item in items)
        
        if total_prob < self.epsilon:
            return 50.0
        
        normalized = top_prob / total_prob
        return normalized * 100.0
    
    def _item_count_confidence(self, active_items: List[Item], total_items: int) -> float:
        """Confidence based on how many items are remaining (reduction rate)."""
        if total_items == 0:
            return 50.0
        
        active_count = len(active_items)
        
        if active_count == 1:
            return 99.0
        
        # Max scaling factor at 10 items is 1.0 (10/100)
        # Min scaling factor at 1 item is 0.0
        # Scale remaining count to a value that reduces confidence
        
        max_items_for_scaling = 100 
        scale_factor = min(1.0, active_count / max_items_for_scaling)
        
        # Starts at 100, reduces as items remain
        confidence = 100.0 * (1.0 - scale_factor)
        
        # Add a bonus for total item reduction
        elimination_rate = 1.0 - (active_count / total_items)
        confidence += elimination_rate * 5.0 # Max 5 point bonus
        
        return min(99.0, confidence)
    
    def _entropy_confidence(self, items: List[Item]) -> float:
        """Confidence from Shannon entropy (measures uncertainty)."""
        if not items:
            return 0.0
        
        probs = [item.probability for item in items]
        total = sum(probs)
        
        if total < self.epsilon:
            return 50.0
        
        probs_normalized = [p / total for p in probs]
        entropy = -sum(p * math.log2(p + self.epsilon) for p in probs_normalized if p > 0)
        
        max_entropy = math.log2(len(items)) if len(items) > 1 else 1.0
        
        if max_entropy < self.epsilon:
            return 100.0
        
        norm_entropy = entropy / max_entropy
        # Confidence is inverse of normalized entropy
        confidence = (1.0 - norm_entropy) * 100.0
        
        return confidence
    
    def should_make_guess(self, confidence: float, questions_asked: int) -> bool:
        """Determine if a prediction should be made using adaptive thresholds."""
        
        # Check absolute stopping conditions
        if confidence >= GAME_CONFIG['confidence_threshold_stage_1']:
            return True
        
        # Adaptive thresholds
        if questions_asked <= 15:
            threshold = GAME_CONFIG['confidence_threshold_stage_1']
        elif questions_asked <= 30:
            threshold = GAME_CONFIG['confidence_threshold_stage_2']
        else:
            threshold = GAME_CONFIG['confidence_threshold_stage_3']
            
        return confidence >= threshold
