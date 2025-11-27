"""
Bayesian Network - Pure Python Implementation
No external dependencies
"""

import math
from typing import List, Dict, Tuple, Set
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class BayesianNetwork:
    """Bayesian Network using pure Python"""
    
    def __init__(self):
        self.beliefs = defaultdict(lambda: defaultdict(float))
        self.evidence = {}
        self.dependencies = defaultdict(set)
    
    def build_network(self, items: List, questions: List[Dict]):
        """Build network structure"""
        all_attributes = set(q['attribute'] for q in questions)
        self._learn_dependencies_simple(items, all_attributes)
        
        for attr in all_attributes:
            values = self._get_attribute_values(items, attr)
            if values:
                uniform_prob = 1.0 / len(values)
                for value in values:
                    self.beliefs[attr][value] = uniform_prob
        
        logger.info(f"Network built with {len(all_attributes)} attributes")
    
    def update_beliefs(self, question: Dict, answer: str):
        """Update beliefs based on answer"""
        attribute = question['attribute']
        value = question['value']
        self.evidence[attribute] = (value, answer)
        self._update_attribute_belief(attribute, value, answer)
        self._propagate_beliefs(attribute)
    
    def score_question(self, question: Dict, answer_history: List[Tuple]) -> float:
        """Score question based on beliefs"""
        attribute = question['attribute']
        value = question['value']
        
        current_belief = self.beliefs[attribute].get(value, 0.5)
        dependency_score = self._calculate_dependency_score(attribute, answer_history)
        
        return 0.6 * current_belief + 0.4 * dependency_score
    
    def _learn_dependencies_simple(self, items: List, attributes: Set[str]):
        """Learn attribute dependencies"""
        attr_list = list(attributes)
        
        for i, attr1 in enumerate(attr_list):
            for attr2 in attr_list[i+1:]:
                contingency = self._build_contingency_table(items, attr1, attr2)
                if contingency:
                    chi2 = self._chi_square_simple(contingency)
                    if chi2 > 3.84:
                        self.dependencies[attr1].add(attr2)
                        self.dependencies[attr2].add(attr1)
    
    def _chi_square_simple(self, observed: List[List[float]]) -> float:
        """Chi-square test using pure Python"""
        if not observed or not observed[0]:
            return 0.0
        
        rows = len(observed)
        cols = len(observed[0])
        
        row_totals = [sum(observed[i]) for i in range(rows)]
        col_totals = [sum(observed[i][j] for i in range(rows)) for j in range(cols)]
        total = sum(row_totals)
        
        if total == 0:
            return 0.0
        
        chi2 = 0.0
        for i in range(rows):
            for j in range(cols):
                expected = (row_totals[i] * col_totals[j]) / total
                if expected > 0:
                    chi2 += (observed[i][j] - expected) ** 2 / expected
        
        return chi2
    
    def _build_contingency_table(self, items: List, attr1: str, attr2: str) -> List[List[int]]:
        """Build contingency table"""
        values1 = sorted(set(
            item.attributes.get(attr1) for item in items 
            if item.attributes.get(attr1) is not None 
            and not isinstance(item.attributes.get(attr1), list)
        ))
        
        values2 = sorted(set(
            item.attributes.get(attr2) for item in items 
            if item.attributes.get(attr2) is not None 
            and not isinstance(item.attributes.get(attr2), list)
        ))
        
        if not values1 or not values2:
            return []
        
        table = [[0 for _ in range(len(values2))] for _ in range(len(values1))]
        
        for item in items:
            val1 = item.attributes.get(attr1)
            val2 = item.attributes.get(attr2)
            
            if val1 in values1 and val2 in values2:
                i = values1.index(val1)
                j = values2.index(val2)
                table[i][j] += 1
        
        return table
    
    def _update_attribute_belief(self, attribute: str, value, answer: str):
        """Update belief for attribute"""
        confidence_map = {
            'yes': 1.0, 'probably': 0.75, 'dontknow': 0.5,
            'probablynot': 0.25, 'no': 0.0
        }
        
        confidence = confidence_map.get(answer, 0.5)
        
        if value in self.beliefs[attribute]:
            self.beliefs[attribute][value] *= (1.0 + confidence)
        
        total = sum(self.beliefs[attribute].values())
        if total > 0:
            for v in self.beliefs[attribute]:
                self.beliefs[attribute][v] /= total
    
    def _propagate_beliefs(self, source_attribute: str):
        """Propagate beliefs to dependent attributes"""
        dependents = self.dependencies.get(source_attribute, set())
        
        for dep_attr in dependents:
            source_entropy = self._calculate_attribute_entropy(source_attribute)
            
            if source_entropy < 0.5:
                for value in self.beliefs[dep_attr]:
                    self.beliefs[dep_attr][value] *= (1.0 + (1.0 - source_entropy) * 0.1)
                
                total = sum(self.beliefs[dep_attr].values())
                if total > 0:
                    for v in self.beliefs[dep_attr]:
                        self.beliefs[dep_attr][v] /= total
    
    def _calculate_attribute_entropy(self, attribute: str) -> float:
        """Calculate entropy"""
        if attribute not in self.beliefs:
            return 1.0
        
        probs = list(self.beliefs[attribute].values())
        if not probs:
            return 1.0
        
        total = sum(probs)
        if total == 0:
            return 1.0
        
        probs = [p / total for p in probs]
        entropy = -sum(p * math.log2(p + 1e-10) for p in probs if p > 0)
        
        max_entropy = math.log2(len(probs)) if len(probs) > 1 else 1.0
        return entropy / max_entropy if max_entropy > 0 else 0.0
    
    def _calculate_dependency_score(self, attribute: str, answer_history: List[Tuple]) -> float:
        """Calculate dependency score"""
        if not answer_history:
            return 0.5
        
        dependents = self.dependencies.get(attribute, set())
        score = 0.5
        count = 0
        
        for prev_q, prev_a in answer_history:
            if prev_q['attribute'] in dependents and prev_a in ['yes', 'no']:
                score += 0.2
                count += 1
        
        return score / (count + 1) if count > 0 else 0.5
    
    def _get_attribute_values(self, items: List, attribute: str) -> Set:
        """Get all values for attribute"""
        values = set()
        for item in items:
            value = item.attributes.get(attribute)
            if value is not None:
                if isinstance(value, list):
                    values.update(value)
                else:
                    values.add(value)
        return values
    
    def get_belief(self, attribute: str, value) -> float:
        """Get belief value"""
        return self.beliefs.get(attribute, {}).get(value, 0.5)
    
    def reset(self):
        """Reset network"""
        self.beliefs.clear()
        self.evidence.clear()
