"""
Information Gain - Pure Python Implementation
"""

import math
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class InformationGain:
    """Calculate information gain using pure Python"""
    
    def __init__(self):
        self.epsilon = 1e-10
    
    def calculate(self, items: List, attribute: str, value) -> float:
        """Calculate information gain"""
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0.0
        
        current_entropy = self.calculate_entropy(active_items)
        yes_items, no_items = self._split_items(active_items, attribute, value)
        
        total_weight = sum(i.probability for i in active_items)
        if total_weight == 0:
            return 0.0
        
        yes_weight = sum(i.probability for i in yes_items) / total_weight
        no_weight = sum(i.probability for i in no_items) / total_weight
        
        yes_entropy = self.calculate_entropy(yes_items)
        no_entropy = self.calculate_entropy(no_items)
        
        expected_entropy = yes_weight * yes_entropy + no_weight * no_entropy
        info_gain = current_entropy - expected_entropy
        
        if current_entropy > 0:
            normalized_gain = info_gain / current_entropy
        else:
            normalized_gain = 0.0
        
        return max(0.0, min(1.0, normalized_gain))
    
    def calculate_entropy(self, items: List) -> float:
        """Calculate Shannon entropy"""
        if not items:
            return 0.0
        
        probs = [item.probability for item in items]
        total = sum(probs)
        
        if total == 0:
            return 0.0
        
        probs = [p / total for p in probs]
        entropy = -sum(p * math.log2(p + self.epsilon) for p in probs if p > 0)
        
        return entropy
    
    def calculate_gini_impurity(self, items: List) -> float:
        """Calculate Gini impurity"""
        if not items:
            return 0.0
        
        probs = [item.probability for item in items]
        total = sum(probs)
        
        if total == 0:
            return 0.0
        
        probs = [p / total for p in probs]
        gini = 1.0 - sum(p ** 2 for p in probs)
        
        return gini
    
    def _split_items(self, items: List, attribute: str, value) -> Tuple[List, List]:
        """Split items by attribute value"""
        yes_items = []
        no_items = []
        
        for item in items:
            item_value = item.attributes.get(attribute)
            
            if isinstance(item_value, list):
                if value in item_value:
                    yes_items.append(item)
                else:
                    no_items.append(item)
            else:
                if item_value == value:
                    yes_items.append(item)
                else:
                    no_items.append(item)
        
        return yes_items, no_items
