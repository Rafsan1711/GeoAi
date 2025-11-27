"""
Feature Importance - Pure Python Implementation
"""

import math
from typing import List, Dict
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class FeatureImportance:
    """Calculate feature importance using pure Python"""
    
    def __init__(self):
        self.importance_scores = {}
        self.variance_scores = {}
    
    def calculate_all(self, items: List, questions: List[Dict]) -> Dict[str, float]:
        """Calculate importance for all attributes"""
        attributes = set(q['attribute'] for q in questions)
        
        for attr in attributes:
            variance = self._calculate_variance(items, attr)
            uniqueness = self._calculate_uniqueness(items, attr)
            coverage = self._calculate_coverage(items, attr)
            discrimination = self._calculate_discrimination_power(items, attr)
            
            importance = (
                0.30 * variance +
                0.25 * uniqueness +
                0.25 * coverage +
                0.20 * discrimination
            )
            
            self.importance_scores[attr] = importance
            self.variance_scores[attr] = variance
        
        logger.info(f"Feature importance calculated for {len(attributes)} attributes")
        return self.importance_scores
    
    def _calculate_variance(self, items: List, attribute: str) -> float:
        """Calculate variance"""
        values = [
            item.attributes.get(attribute) for item in items 
            if item.attributes.get(attribute) is not None 
            and not isinstance(item.attributes.get(attribute), list)
        ]
        
        if not values:
            return 0.0
        
        unique_values = len(set(values))
        total_items = len(items)
        
        return min(1.0, unique_values / total_items) if total_items > 0 else 0.0
    
    def _calculate_uniqueness(self, items: List, attribute: str) -> float:
        """Calculate uniqueness"""
        value_counts = defaultdict(int)
        total = 0
        
        for item in items:
            value = item.attributes.get(attribute)
            
            if value is not None:
                if isinstance(value, list):
                    for v in value:
                        value_counts[str(v)] += 1
                        total += 1
                else:
                    value_counts[str(value)] += 1
                    total += 1
        
        if total == 0:
            return 0.0
        
        gini = 1.0 - sum((count / total) ** 2 for count in value_counts.values())
        return gini
    
    def _calculate_coverage(self, items: List, attribute: str) -> float:
        """Calculate coverage"""
        defined_count = sum(
            1 for item in items 
            if item.attributes.get(attribute) is not None
        )
        
        return defined_count / len(items) if items else 0.0
    
    def _calculate_discrimination_power(self, items: List, attribute: str) -> float:
        """Calculate discrimination power"""
        value_groups = defaultdict(list)
        
        for item in items:
            value = item.attributes.get(attribute)
            
            if value is not None:
                if isinstance(value, list):
                    for v in value:
                        value_groups[str(v)].append(item)
                else:
                    value_groups[str(value)].append(item)
        
        if not value_groups:
            return 0.0
        
        total_items = len(items)
        entropy = 0.0
        
        for group in value_groups.values():
            p = len(group) / total_items
            if p > 0:
                entropy -= p * math.log2(p)
        
        max_entropy = math.log2(len(value_groups)) if len(value_groups) > 1 else 1.0
        
        return entropy / max_entropy if max_entropy > 0 else 0.0
    
    def get_importance(self, attribute: str) -> float:
        """Get importance score"""
        return self.importance_scores.get(attribute, 0.5)
    
    def get_top_features(self, n: int = 10) -> List[tuple]:
        """Get top N features"""
        sorted_features = sorted(
            self.importance_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return sorted_features[:n]
