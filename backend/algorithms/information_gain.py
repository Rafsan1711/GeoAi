"""
Information Gain - Pure Python Implementation
"""

import math
from typing import List, Dict, Tuple # <--- FIX: Added all needed imports
import logging

logger = logging.getLogger(__name__)

# NOTE: This implementation relies on the Item model's built-in 
# probability from the likelihood update.


class InformationGain:
    """Calculate information gain using pure Python"""
    
    def __init__(self):
        self.epsilon = 1e-10
    
    def calculate(self, items: List, attribute: str, value) -> float:
        """Calculate information gain, normalized by current entropy"""
        active_items = [i for i in items if not i.eliminated]
        
        if len(active_items) <= 1:
            return 0.0
        
        current_entropy = self.calculate_entropy(active_items)
        
        if current_entropy < self.epsilon:
            return 0.0
            
        yes_items, no_items = self._split_items(active_items, attribute, value)
        
        total_weight = sum(i.probability for i in active_items)
        if total_weight < self.epsilon:
            return 0.0
        
        yes_weight = sum(i.probability for i in yes_items) / total_weight
        no_weight = sum(i.probability for i in no_items) / total_weight
        
        yes_entropy = self.calculate_entropy(yes_items)
        no_entropy = self.calculate_entropy(no_items)
        
        expected_entropy = yes_weight * yes_entropy + no_weight * no_entropy
        info_gain = current_entropy - expected_entropy
        
        # Normalized by current entropy
        normalized_gain = info_gain / current_entropy
        
        return max(0.0, min(1.0, normalized_gain))
    
    def calculate_entropy(self, items: List) -> float:
        """Calculate Shannon entropy based on item probabilities"""
        if not items:
            return 0.0
        
        probs = [item.probability for item in items]
        total = sum(probs)
        
        if total < self.epsilon:
            return 0.0
        
        probs_normalized = [p / total for p in probs]
        entropy = -sum(p * math.log2(p + self.epsilon) for p in probs_normalized if p > 0)
        
        return entropy
    
    def _split_items(self, items: List, attribute: str, value) -> Tuple[List, List]:
        """Split items by attribute value using Item's internal check"""
        
        yes_items = []
        no_items = []
        
        test_question = {'attribute': attribute, 'value': value}
        
        for item in items:
            # We assume item is an object with a matches_question method
            if item.matches_question(test_question):
                yes_items.append(item)
            else:
                no_items.append(item)
        
        return yes_items, no_items
