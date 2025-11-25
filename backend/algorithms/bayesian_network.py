"""
Bayesian Network - Probabilistic Reasoning
Models dependencies between attributes and performs belief propagation
"""

import numpy as np
from typing import List, Dict, Tuple, Set
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class BayesianNetwork:
    """
    Bayesian Network for modeling attribute dependencies
    """
    
    def __init__(self):
        # Network structure
        self.nodes = {}  # attribute -> Node
        self.edges = []  # (parent, child) relationships
        
        # Beliefs (current probability distributions)
        self.beliefs = defaultdict(lambda: defaultdict(float))
        
        # Evidence (observed answers)
        self.evidence = {}
        
        # Conditional probability tables
        self.cpts = {}
        
        # Attribute dependencies (learned from data)
        self.dependencies = defaultdict(set)
    
    def build_network(self, items: List, questions: List[Dict]):
        """
        Build Bayesian network structure from data
        
        Args:
            items: List of items
            questions: Question bank
        """
        # Extract all attributes
        all_attributes = set()
        for question in questions:
            all_attributes.add(question['attribute'])
        
        # Learn dependencies between attributes
        self._learn_dependencies(items, all_attributes)
        
        # Initialize beliefs (uniform prior)
        for attr in all_attributes:
            values = self._get_attribute_values(items, attr)
            n_values = len(values)
            if n_values > 0:
                uniform_prob = 1.0 / n_values
                for value in values:
                    self.beliefs[attr][value] = uniform_prob
        
        logger.info(f"Bayesian network built with {len(all_attributes)} attributes")
    
    def update_beliefs(self, question: Dict, answer: str):
        """
        Update beliefs based on evidence (answer to question)
        
        Args:
            question: Question that was answered
            answer: User's answer
        """
        attribute = question['attribute']
        value = question['value']
        
        # Store evidence
        self.evidence[attribute] = (value, answer)
        
        # Update belief for this attribute
        self._update_attribute_belief(attribute, value, answer)
        
        # Propagate beliefs to dependent attributes
        self._propagate_beliefs(attribute)
    
    def score_question(self, question: Dict, answer_history: List[Tuple]) -> float:
        """
        Score a question based on current beliefs and dependencies
        
        Args:
            question: Question to score
            answer_history: Previous (question, answer) pairs
            
        Returns:
            float: Score (0-1)
        """
        attribute = question['attribute']
        value = question['value']
        
        # Base score from current belief
        current_belief = self.beliefs[attribute].get(value, 0.5)
        
        # Adjust based on dependencies
        dependency_score = self._calculate_dependency_score(attribute, answer_history)
        
        # Combined score
        score = 0.6 * current_belief + 0.4 * dependency_score
        
        return score
    
    def _learn_dependencies(self, items: List, attributes: Set[str]):
        """
        Learn which attributes depend on each other
        Uses chi-square test for independence
        
        Args:
            items: List of items
            attributes: Set of all attributes
        """
        from scipy import stats
        
        attr_list = list(attributes)
        
        for i, attr1 in enumerate(attr_list):
            for attr2 in attr_list[i+1:]:
                # Build contingency table
                contingency = self._build_contingency_table(items, attr1, attr2)
                
                if contingency.size > 0:
                    try:
                        # Chi-square test
                        chi2, p_value, dof, expected = stats.chi2_contingency(contingency)
                        
                        # If p-value < 0.05, attributes are dependent
                        if p_value < 0.05:
                            self.dependencies[attr1].add(attr2)
                            self.dependencies[attr2].add(attr1)
                    except:
                        pass  # Skip if test fails
    
    def _build_contingency_table(self, items: List, attr1: str, 
                                 attr2: str) -> np.ndarray:
        """
        Build contingency table for two attributes
        
        Args:
            items: List of items
            attr1: First attribute
            attr2: Second attribute
            
        Returns:
            np.ndarray: Contingency table
        """
        # Get unique values for each attribute
        values1 = set()
        values2 = set()
        
        for item in items:
            val1 = item.attributes.get(attr1)
            val2 = item.attributes.get(attr2)
            
            if val1 is not None and not isinstance(val1, list):
                values1.add(val1)
            if val2 is not None and not isinstance(val2, list):
                values2.add(val2)
        
        if not values1 or not values2:
            return np.array([])
        
        # Build table
        values1 = sorted(list(values1))
        values2 = sorted(list(values2))
        
        table = np.zeros((len(values1), len(values2)))
        
        for item in items:
            val1 = item.attributes.get(attr1)
            val2 = item.attributes.get(attr2)
            
            if val1 in values1 and val2 in values2:
                i = values1.index(val1)
                j = values2.index(val2)
                table[i, j] += 1
        
        return table
    
    def _update_attribute_belief(self, attribute: str, value, answer: str):
        """
        Update belief distribution for an attribute
        
        Args:
            attribute: Attribute to update
            value: Value mentioned in question
            answer: User's answer
        """
        # Answer confidence weights
        confidence_map = {
            'yes': 1.0,
            'probably': 0.75,
            'dontknow': 0.5,
            'probablynot': 0.25,
            'no': 0.0
        }
        
        confidence = confidence_map.get(answer, 0.5)
        
        # Update belief for this value
        if value in self.beliefs[attribute]:
            # Increase belief in value proportional to confidence
            self.beliefs[attribute][value] *= (1.0 + confidence)
        
        # Normalize
        total = sum(self.beliefs[attribute].values())
        if total > 0:
            for v in self.beliefs[attribute]:
                self.beliefs[attribute][v] /= total
    
    def _propagate_beliefs(self, source_attribute: str):
        """
        Propagate beliefs to dependent attributes
        
        Args:
            source_attribute: Attribute whose belief was updated
        """
        # Get dependent attributes
        dependents = self.dependencies.get(source_attribute, set())
        
        for dep_attr in dependents:
            # Adjust beliefs in dependent attribute
            # This is a simplified propagation
            source_entropy = self._calculate_attribute_entropy(source_attribute)
            
            if source_entropy < 0.5:  # Low entropy = high certainty
                # Increase certainty in dependent attribute
                for value in self.beliefs[dep_attr]:
                    self.beliefs[dep_attr][value] *= (1.0 + (1.0 - source_entropy) * 0.1)
                
                # Normalize
                total = sum(self.beliefs[dep_attr].values())
                if total > 0:
                    for v in self.beliefs[dep_attr]:
                        self.beliefs[dep_attr][v] /= total
    
    def _calculate_attribute_entropy(self, attribute: str) -> float:
        """
        Calculate entropy of belief distribution for an attribute
        
        Args:
            attribute: Attribute to calculate entropy for
            
        Returns:
            float: Entropy (0-1, normalized)
        """
        if attribute not in self.beliefs:
            return 1.0  # Maximum uncertainty
        
        probs = list(self.beliefs[attribute].values())
        
        if not probs:
            return 1.0
        
        # Normalize
        total = sum(probs)
        if total == 0:
            return 1.0
        
        probs = [p / total for p in probs]
        
        # Calculate entropy
        entropy = -sum(p * np.log2(p + 1e-10) for p in probs if p > 0)
        
        # Normalize by max possible entropy
        max_entropy = np.log2(len(probs)) if len(probs) > 1 else 1.0
        
        normalized = entropy / max_entropy if max_entropy > 0 else 0.0
        
        return normalized
    
    def _calculate_dependency_score(self, attribute: str, 
                                   answer_history: List[Tuple]) -> float:
        """
        Calculate score based on dependencies with answered questions
        
        Args:
            attribute: Attribute to score
            answer_history: Previous answers
            
        Returns:
            float: Dependency score (0-1)
        """
        if not answer_history:
            return 0.5  # Neutral
        
        # Check if any dependent attributes have been answered
        dependents = self.dependencies.get(attribute, set())
        
        score = 0.5
        count = 0
        
        for prev_q, prev_a in answer_history:
            prev_attr = prev_q['attribute']
            
            if prev_attr in dependents:
                # If dependent attribute was answered with certainty,
                # this attribute is more valuable
                if prev_a in ['yes', 'no']:
                    score += 0.2
                    count += 1
        
        # Average and clamp
        if count > 0:
            score = score / (count + 1)  # +1 to include base score
        
        return max(0.0, min(1.0, score))
    
    def _get_attribute_values(self, items: List, attribute: str) -> Set:
        """
        Get all possible values for an attribute
        
        Args:
            items: List of items
            attribute: Attribute name
            
        Returns:
            Set: Unique values
        """
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
        """
        Get current belief for an attribute-value pair
        
        Args:
            attribute: Attribute name
            value: Value
            
        Returns:
            float: Belief probability
        """
        return self.beliefs.get(attribute, {}).get(value, 0.5)
    
    def reset(self):
        """Reset the network to initial state"""
        self.beliefs.clear()
        self.evidence.clear()
