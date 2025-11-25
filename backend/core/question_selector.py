"""
Question Selector - Smart Question Selection
Uses multiple algorithms to pick the most informative questions
"""

import numpy as np
from typing import List, Dict
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class QuestionSelector:
    """
    Advanced question selection using multiple scoring methods
    """
    
    def __init__(self):
        self.feature_importance = {}
        self.attribute_stats = defaultdict(dict)
        
    def calculate_feature_importance(self, items: List, questions: List[Dict]):
        """
        Calculate importance of each attribute across all items
        
        Args:
            items: List of Item objects
            questions: Question bank
        """
        # Extract all attributes
        all_attributes = set()
        for question in questions:
            all_attributes.add(question['attribute'])
        
        # Calculate statistics for each attribute
        for attr in all_attributes:
            values = []
            for item in items:
                val = item.attributes.get(attr)
                if val is not None:
                    if isinstance(val, list):
                        values.extend(val)
                    else:
                        values.append(val)
            
            if values:
                # Calculate diversity (unique values / total values)
                unique_values = len(set(str(v) for v in values))
                total_values = len(values)
                diversity = unique_values / total_values
                
                # Calculate balance (how evenly distributed values are)
                value_counts = defaultdict(int)
                for v in values:
                    value_counts[str(v)] += 1
                
                # Gini impurity as balance measure
                total = sum(value_counts.values())
                gini = 1.0 - sum((count/total)**2 for count in value_counts.values())
                
                # Combined importance score
                importance = (diversity * 0.5) + (gini * 0.5)
                
                self.feature_importance[attr] = importance
                self.attribute_stats[attr] = {
                    'diversity': diversity,
                    'gini': gini,
                    'unique_values': unique_values,
                    'total_values': total_values
                }
        
        logger.info(f"Feature importance calculated for {len(all_attributes)} attributes")
    
    def get_attribute_importance(self, attribute: str) -> float:
        """Get importance score for an attribute"""
        return self.feature_importance.get(attribute, 0.5)
    
    def score_question_by_balance(self, items: List, question: Dict) -> float:
        """
        Score question by how balanced it splits the items
        Perfect 50-50 split = 1.0, completely unbalanced = 0.0
        
        Args:
            items: Active items
            question: Question to score
            
        Returns:
            float: Balance score (0-1)
        """
        if not items:
            return 0.0
        
        attribute = question['attribute']
        value = question['value']
        
        # Count matches and non-matches
        matches = 0
        total = 0
        
        for item in items:
            if item.eliminated:
                continue
                
            total += 1
            item_value = item.attributes.get(attribute)
            
            if isinstance(item_value, list):
                if value in item_value:
                    matches += 1
            else:
                if item_value == value:
                    matches += 1
        
        if total == 0:
            return 0.0
        
        # Calculate balance score
        ratio = matches / total
        
        # Perfect balance at 0.5, worst at 0 or 1
        balance = 1.0 - abs(0.5 - ratio) * 2
        
        return balance
    
    def score_question_by_entropy(self, items: List, question: Dict) -> float:
        """
        Score question by entropy reduction
        Higher entropy reduction = better question
        
        Args:
            items: Active items
            question: Question to score
            
        Returns:
            float: Entropy score (0-1)
        """
        if not items:
            return 0.0
        
        # Calculate current entropy
        total_prob = sum(item.probability for item in items if not item.eliminated)
        if total_prob == 0:
            return 0.0
        
        current_entropy = 0.0
        for item in items:
            if not item.eliminated and item.probability > 0:
                p = item.probability / total_prob
                current_entropy -= p * np.log2(p + 1e-10)
        
        # Simulate splitting by this question
        attribute = question['attribute']
        value = question['value']
        
        # Split items into yes/no groups
        yes_items = []
        no_items = []
        
        for item in items:
            if item.eliminated:
                continue
                
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
        
        # Calculate weighted entropy after split
        def calc_entropy(group):
            if not group:
                return 0.0
            total_p = sum(i.probability for i in group)
            if total_p == 0:
                return 0.0
            entropy = 0.0
            for item in group:
                if item.probability > 0:
                    p = item.probability / total_p
                    entropy -= p * np.log2(p + 1e-10)
            return entropy
        
        yes_entropy = calc_entropy(yes_items)
        no_entropy = calc_entropy(no_items)
        
        # Weighted average
        yes_weight = sum(i.probability for i in yes_items) / total_prob
        no_weight = sum(i.probability for i in no_items) / total_prob
        
        expected_entropy = yes_weight * yes_entropy + no_weight * no_entropy
        
        # Information gain
        info_gain = current_entropy - expected_entropy
        
        # Normalize to 0-1 range (max possible is current_entropy)
        if current_entropy > 0:
            score = info_gain / current_entropy
        else:
            score = 0.0
        
        return max(0.0, min(1.0, score))
    
    def score_question_by_coverage(self, items: List, question: Dict) -> float:
        """
        Score based on how many items have this attribute defined
        Better to ask questions that apply to more items
        
        Args:
            items: Active items
            question: Question to score
            
        Returns:
            float: Coverage score (0-1)
        """
        if not items:
            return 0.0
        
        attribute = question['attribute']
        
        active_items = [i for i in items if not i.eliminated]
        if not active_items:
            return 0.0
        
        # Count items that have this attribute defined
        defined_count = 0
        for item in active_items:
            if attribute in item.attributes and item.attributes[attribute] is not None:
                defined_count += 1
        
        coverage = defined_count / len(active_items)
        return coverage
    
    def score_question_by_uncertainty(self, items: List, question: Dict) -> float:
        """
        Score based on current uncertainty about items
        Higher uncertainty = better to ask questions that reduce it
        
        Args:
            items: Active items
            question: Question to score
            
        Returns:
            float: Uncertainty score (0-1)
        """
        active_items = [i for i in items if not i.eliminated]
        if not active_items:
            return 0.0
        
        # Calculate probability distribution
        probs = np.array([i.probability for i in active_items])
        total = probs.sum()
        
        if total == 0:
            return 0.0
        
        probs = probs / total
        
        # Calculate Shannon entropy (uncertainty measure)
        entropy = -np.sum(probs * np.log2(probs + 1e-10))
        
        # Max entropy is log2(n) where n is number of items
        max_entropy = np.log2(len(active_items))
        
        if max_entropy > 0:
            normalized_entropy = entropy / max_entropy
        else:
            normalized_entropy = 0.0
        
        return normalized_entropy
