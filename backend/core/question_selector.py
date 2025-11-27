"""
Question Selector - Pure Python Implementation
"""

import math
from typing import List, Dict
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class QuestionSelector:
    """Select best questions using pure Python"""
    
    def __init__(self):
        self.feature_importance = {}
        self.attribute_stats = defaultdict(dict)
        
    def calculate_feature_importance(self, items: List, questions: List[Dict]):
        """Calculate feature importance"""
        all_attributes = set(q['attribute'] for q in questions)
        
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
                unique_values = len(set(str(v) for v in values))
                total_values = len(values)
                diversity = unique_values / total_values
                
                value_counts = defaultdict(int)
                for v in values:
                    value_counts[str(v)] += 1
                
                total = sum(value_counts.values())
                gini = 1.0 - sum((count/total)**2 for count in value_counts.values())
                
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
        """Get importance score"""
        return self.feature_importance.get(attribute, 0.5)
    
    def score_question_by_balance(self, items: List, question: Dict) -> float:
        """Score by balance"""
        if not items:
            return 0.0
        
        attribute = question['attribute']
        value = question['value']
        
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
        
        ratio = matches / total
        balance = 1.0 - abs(0.5 - ratio) * 2
        
        return balance
    
    def score_question_by_entropy(self, items: List, question: Dict) -> float:
        """Score by entropy reduction"""
        if not items:
            return 0.0
        
        total_prob = sum(item.probability for item in items if not item.eliminated)
        if total_prob == 0:
            return 0.0
        
        current_entropy = 0.0
        for item in items:
            if not item.eliminated and item.probability > 0:
                p = item.probability / total_prob
                current_entropy -= p * math.log2(p + 1e-10)
        
        attribute = question['attribute']
        value = question['value']
        
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
                    entropy -= p * math.log2(p + 1e-10)
            return entropy
        
        yes_entropy = calc_entropy(yes_items)
        no_entropy = calc_entropy(no_items)
        
        yes_weight = sum(i.probability for i in yes_items) / total_prob if yes_items else 0.0
        no_weight = sum(i.probability for i in no_items) / total_prob if no_items else 0.0
        
        expected_entropy = yes_weight * yes_entropy + no_weight * no_entropy
        
        info_gain = current_entropy - expected_entropy
        
        if current_entropy > 0:
            score = info_gain / current_entropy
        else:
            score = 0.0
        
        return max(0.0, min(1.0, score))
    
    def score_question_by_coverage(self, items: List, question: Dict) -> float:
        """Score by coverage"""
        if not items:
            return 0.0
        
        attribute = question['attribute']
        
        active_items = [i for i in items if not i.eliminated]
        if not active_items:
            return 0.0
        
        defined_count = sum(
            1 for item in active_items
            if attribute in item.attributes and item.attributes[attribute] is not None
        )
        
        coverage = defined_count / len(active_items)
        return coverage
