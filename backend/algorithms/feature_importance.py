"""
Feature Importance - Attribute Weight Calculator
Calculates importance of each attribute for decision making
"""

import numpy as np
from typing import List, Dict
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class FeatureImportance:
    """
    Calculate and manage feature importance scores
    """
    
    def __init__(self):
        self.importance_scores = {}
        self.variance_scores = {}
        self.correlation_scores = {}
    
    def calculate_all(self, items: List, questions: List[Dict]) -> Dict[str, float]:
        """
        Calculate importance for all attributes
        
        Args:
            items: List of items
            questions: Question bank
            
        Returns:
            Dict: attribute -> importance score
        """
        # Extract unique attributes
        attributes = set(q['attribute'] for q in questions)
        
        for attr in attributes:
            # Calculate multiple importance metrics
            variance = self._calculate_variance(items, attr)
            uniqueness = self._calculate_uniqueness(items, attr)
            coverage = self._calculate_coverage(items, attr)
            discrimination = self._calculate_discrimination_power(items, attr)
            
            # Combined score (weighted average)
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
        """
        Calculate variance of attribute values
        Higher variance = more discriminative
        
        Args:
            items: List of items
            attribute: Attribute to analyze
            
        Returns:
            float: Variance score (0-1)
        """
        values = []
        
        for item in items:
            value = item.attributes.get(attribute)
            
            if value is not None and not isinstance(value, list):
                values.append(value)
        
        if not values:
            return 0.0
        
        # Count unique values
        unique_values = len(set(values))
        total_items = len(items)
        
        if total_items == 0:
            return 0.0
        
        # Normalized variance (more unique = higher score)
        normalized_variance = unique_values / total_items
        
        return min(1.0, normalized_variance)
    
    def _calculate_uniqueness(self, items: List, attribute: str) -> float:
        """
        Calculate how unique/diverse the attribute values are
        
        Args:
            items: List of items
            attribute: Attribute to analyze
            
        Returns:
            float: Uniqueness score (0-1)
        """
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
        
        # Calculate Gini impurity (measure of diversity)
        gini = 1.0 - sum((count / total) ** 2 for count in value_counts.values())
        
        return gini
    
    def _calculate_coverage(self, items: List, attribute: str) -> float:
        """
        Calculate what percentage of items have this attribute defined
        
        Args:
            items: List of items
            attribute: Attribute to analyze
            
        Returns:
            float: Coverage score (0-1)
        """
        defined_count = 0
        
        for item in items:
            value = item.attributes.get(attribute)
            if value is not None:
                defined_count += 1
        
        if len(items) == 0:
            return 0.0
        
        coverage = defined_count / len(items)
        return coverage
    
    def _calculate_discrimination_power(self, items: List, attribute: str) -> float:
        """
        Calculate how well this attribute discriminates between items
        Uses entropy-based measure
        
        Args:
            items: List of items
            attribute: Attribute to analyze
            
        Returns:
            float: Discrimination power (0-1)
        """
        # Group items by attribute value
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
        
        # Calculate entropy of distribution
        total_items = len(items)
        entropy = 0.0
        
        for group in value_groups.values():
            p = len(group) / total_items
            if p > 0:
                entropy -= p * np.log2(p)
        
        # Normalize by max possible entropy
        max_entropy = np.log2(len(value_groups)) if len(value_groups) > 1 else 1.0
        
        if max_entropy > 0:
            normalized_entropy = entropy / max_entropy
        else:
            normalized_entropy = 0.0
        
        return normalized_entropy
    
    def get_importance(self, attribute: str) -> float:
        """Get importance score for an attribute"""
        return self.importance_scores.get(attribute, 0.5)
    
    def get_top_features(self, n: int = 10) -> List[Tuple[str, float]]:
        """
        Get top N most important features
        
        Args:
            n: Number of features to return
            
        Returns:
            List: [(attribute, score), ...] sorted by score
        """
        sorted_features = sorted(
            self.importance_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return sorted_features[:n]
    
    def calculate_correlation(self, items: List, attr1: str, attr2: str) -> float:
        """
        Calculate correlation between two attributes
        
        Args:
            items: List of items
            attr1: First attribute
            attr2: Second attribute
            
        Returns:
            float: Correlation coefficient (-1 to 1)
        """
        # Build value mappings
        values1 = []
        values2 = []
        
        for item in items:
            val1 = item.attributes.get(attr1)
            val2 = item.attributes.get(attr2)
            
            if val1 is not None and val2 is not None:
                if not isinstance(val1, list) and not isinstance(val2, list):
                    values1.append(val1)
                    values2.append(val2)
        
        if len(values1) < 2:
            return 0.0
        
        # Encode categorical values as numbers
        unique1 = list(set(values1))
        unique2 = list(set(values2))
        
        encoded1 = [unique1.index(v) for v in values1]
        encoded2 = [unique2.index(v) for v in values2]
        
        # Calculate Pearson correlation
        try:
            correlation = np.corrcoef(encoded1, encoded2)[0, 1]
            if np.isnan(correlation):
                correlation = 0.0
        except:
            correlation = 0.0
        
        return correlation
    
    def calculate_mutual_information_matrix(self, items: List, 
                                           attributes: List[str]) -> np.ndarray:
        """
        Calculate mutual information between all pairs of attributes
        
        Args:
            items: List of items
            attributes: List of attributes
            
        Returns:
            np.ndarray: MI matrix
        """
        n = len(attributes)
        mi_matrix = np.zeros((n, n))
        
        for i, attr1 in enumerate(attributes):
            for j, attr2 in enumerate(attributes):
                if i == j:
                    mi_matrix[i, j] = 1.0
                else:
                    mi = self._calculate_mutual_information(items, attr1, attr2)
                    mi_matrix[i, j] = mi
        
        return mi_matrix
    
    def _calculate_mutual_information(self, items: List, attr1: str, 
                                     attr2: str) -> float:
        """
        Calculate mutual information between two attributes
        
        Args:
            items: List of items
            attr1: First attribute
            attr2: Second attribute
            
        Returns:
            float: Mutual information
        """
        # Build joint distribution
        joint_counts = defaultdict(int)
        attr1_counts = defaultdict(int)
        attr2_counts = defaultdict(int)
        total = 0
        
        for item in items:
            val1 = item.attributes.get(attr1)
            val2 = item.attributes.get(attr2)
            
            if val1 is not None and val2 is not None:
                if not isinstance(val1, list) and not isinstance(val2, list):
                    key = (str(val1), str(val2))
                    joint_counts[key] += 1
                    attr1_counts[str(val1)] += 1
                    attr2_counts[str(val2)] += 1
                    total += 1
        
        if total == 0:
            return 0.0
        
        # Calculate mutual information
        mi = 0.0
        
        for (v1, v2), joint_count in joint_counts.items():
            p_joint = joint_count / total
            p_attr1 = attr1_counts[v1] / total
            p_attr2 = attr2_counts[v2] / total
            
            if p_joint > 0 and p_attr1 > 0 and p_attr2 > 0:
                mi += p_joint * np.log2(p_joint / (p_attr1 * p_attr2))
        
        return mi
