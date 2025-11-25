"""
Confidence Calculator - Advanced Confidence Metrics
Calculates confidence scores using multiple methods
"""

import numpy as np
from typing import List
import logging

logger = logging.getLogger(__name__)


class ConfidenceCalculator:
    """
    Advanced confidence calculation using multiple metrics
    """
    
    def __init__(self):
        # Weights for different confidence components
        self.weights = {
            'probability_gap': 0.40,      # Gap between top and second
            'normalized_prob': 0.30,       # Top item probability
            'item_count': 0.20,            # How many items left
            'entropy': 0.10                # Uncertainty measure
        }
    
    def calculate(self, items: List) -> float:
        """
        Calculate overall confidence score
        
        Args:
            items: List of Item objects
            
        Returns:
            float: Confidence percentage (0-100)
        """
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0.0
        
        if len(active_items) == 1:
            return 95.0  # Very high confidence if only one item
        
        # 1. Probability gap confidence
        prob_gap_conf = self._probability_gap_confidence(active_items)
        
        # 2. Normalized probability confidence
        norm_prob_conf = self._normalized_probability_confidence(active_items)
        
        # 3. Item count confidence
        item_count_conf = self._item_count_confidence(active_items, len(items))
        
        # 4. Entropy-based confidence
        entropy_conf = self._entropy_confidence(active_items)
        
        # Weighted combination
        total_confidence = (
            self.weights['probability_gap'] * prob_gap_conf +
            self.weights['normalized_prob'] * norm_prob_conf +
            self.weights['item_count'] * item_count_conf +
            self.weights['entropy'] * entropy_conf
        )
        
        # Cap at 95% (never 100% certain)
        confidence = min(95.0, total_confidence)
        
        logger.debug(
            f"Confidence breakdown: "
            f"gap={prob_gap_conf:.1f}, "
            f"norm={norm_prob_conf:.1f}, "
            f"count={item_count_conf:.1f}, "
            f"entropy={entropy_conf:.1f}, "
            f"total={confidence:.1f}"
        )
        
        return confidence
    
    def _probability_gap_confidence(self, items: List) -> float:
        """
        Confidence based on gap between top and second item
        Larger gap = higher confidence
        
        Args:
            items: Active items
            
        Returns:
            float: Confidence (0-100)
        """
        if len(items) < 2:
            return 100.0
        
        # Sort by probability
        sorted_items = sorted(items, key=lambda x: x.probability, reverse=True)
        
        top_prob = sorted_items[0].probability
        second_prob = sorted_items[1].probability
        
        # Calculate gap
        if top_prob + second_prob == 0:
            return 50.0
        
        gap = (top_prob - second_prob) / (top_prob + second_prob)
        
        # Map gap (0-1) to confidence (50-100)
        # gap=0 means tied -> 50% confidence
        # gap=1 means top is much higher -> 100% confidence
        confidence = 50.0 + (gap * 50.0)
        
        return confidence
    
    def _normalized_probability_confidence(self, items: List) -> float:
        """
        Confidence based on top item's normalized probability
        
        Args:
            items: Active items
            
        Returns:
            float: Confidence (0-100)
        """
        if not items:
            return 0.0
        
        # Get top probability
        top_prob = max(item.probability for item in items)
        
        # Normalize by total probability
        total_prob = sum(item.probability for item in items)
        
        if total_prob == 0:
            return 50.0
        
        normalized = top_prob / total_prob
        
        # Map to confidence (already in 0-1 range, scale to 0-100)
        confidence = normalized * 100.0
        
        return confidence
    
    def _item_count_confidence(self, active_items: List, total_items: int) -> float:
        """
        Confidence based on how many items eliminated
        More eliminated = higher confidence
        
        Args:
            active_items: Remaining items
            total_items: Original total items
            
        Returns:
            float: Confidence (0-100)
        """
        if total_items == 0:
            return 50.0
        
        active_count = len(active_items)
        
        # Calculate elimination rate
        elimination_rate = 1.0 - (active_count / total_items)
        
        # Map to confidence
        # If only 1 item left, very high confidence
        if active_count == 1:
            return 95.0
        elif active_count == 2:
            return 85.0
        elif active_count <= 5:
            return 70.0 + (elimination_rate * 20.0)
        else:
            # For many items, scale based on how many eliminated
            return 30.0 + (elimination_rate * 60.0)
    
    def _entropy_confidence(self, items: List) -> float:
        """
        Confidence based on Shannon entropy
        Lower entropy = higher confidence
        
        Args:
            items: Active items
            
        Returns:
            float: Confidence (0-100)
        """
        if not items:
            return 0.0
        
        # Get probabilities
        probs = np.array([item.probability for item in items])
        
        # Normalize
        total = probs.sum()
        if total == 0:
            return 50.0
        
        probs = probs / total
        
        # Calculate entropy
        entropy = -np.sum(probs * np.log2(probs + 1e-10))
        
        # Maximum possible entropy for this many items
        max_entropy = np.log2(len(items))
        
        if max_entropy == 0:
            return 100.0
        
        # Normalized entropy (0-1)
        norm_entropy = entropy / max_entropy
        
        # Invert for confidence (low entropy = high confidence)
        confidence = (1.0 - norm_entropy) * 100.0
        
        return confidence
    
    def get_confidence_level(self, confidence: float) -> str:
        """
        Get textual confidence level
        
        Args:
            confidence: Confidence percentage
            
        Returns:
            str: Confidence level description
        """
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
        """
        Determine if should make a guess now
        
        Args:
            confidence: Current confidence
            questions_asked: Questions asked so far
            max_questions: Maximum questions allowed
            
        Returns:
            bool: True if should guess
        """
        # Always guess at max questions
        if questions_asked >= max_questions:
            return True
        
        # Guess if very high confidence
        if confidence >= 95:
            return True
        
        # Guess if high confidence and past 70% of questions
        if confidence >= 85 and questions_asked >= (max_questions * 0.7):
            return True
        
        return False
    
    def calculate_guess_risk(self, confidence: float) -> str:
        """
        Calculate risk level of guessing at current confidence
        
        Args:
            confidence: Current confidence
            
        Returns:
            str: Risk level
        """
        if confidence >= 90:
            return "Low Risk"
        elif confidence >= 75:
            return "Moderate Risk"
        elif confidence >= 60:
            return "High Risk"
        else:
            return "Very High Risk"
