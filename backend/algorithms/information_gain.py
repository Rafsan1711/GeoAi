"""
Information Gain - Entropy-based Question Scoring
Uses Shannon entropy to measure information gained from questions
"""

import numpy as np
from typing import List, Dict, Tuple
from collections import Counter
import logging

logger = logging.getLogger(__name__)


class InformationGain:
    """
    Calculate information gain using entropy measures
    Based on decision tree splitting criteria
    """
    
    def __init__(self):
        self.epsilon = 1e-10  # Small value to avoid log(0)
    
    def calculate(self, items: List, attribute: str, value) -> float:
        """
        Calculate information gain for a question
        IG(S, A) = H(S) - H(S|A)
        
        Args:
            items: List of Item objects
            attribute: Attribute to test
            value: Value to test for
            
        Returns:
            float: Information gain (0-1)
        """
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0.0
        
        # Calculate current entropy H(S)
        current_entropy = self.calculate_entropy(active_items)
        
        # Split items by this attribute
        yes_items, no_items = self._split_items(active_items, attribute, value)
        
        # Calculate weighted entropy after split H(S|A)
        total_weight = sum(i.probability for i in active_items)
        
        if total_weight == 0:
            return 0.0
        
        yes_weight = sum(i.probability for i in yes_items) / total_weight
        no_weight = sum(i.probability for i in no_items) / total_weight
        
        yes_entropy = self.calculate_entropy(yes_items)
        no_entropy = self.calculate_entropy(no_items)
        
        expected_entropy = yes_weight * yes_entropy + no_weight * no_entropy
        
        # Information gain
        info_gain = current_entropy - expected_entropy
        
        # Normalize to 0-1 range
        if current_entropy > 0:
            normalized_gain = info_gain / current_entropy
        else:
            normalized_gain = 0.0
        
        return max(0.0, min(1.0, normalized_gain))
    
    def calculate_entropy(self, items: List) -> float:
        """
        Calculate Shannon entropy: H(S) = -Σ p(x) * log2(p(x))
        
        Args:
            items: List of items with probabilities
            
        Returns:
            float: Entropy value
        """
        if not items:
            return 0.0
        
        # Get probabilities
        probs = np.array([item.probability for item in items])
        
        # Normalize
        total = probs.sum()
        if total == 0:
            return 0.0
        
        probs = probs / total
        
        # Calculate entropy
        # Add epsilon to avoid log(0)
        entropy = -np.sum(probs * np.log2(probs + self.epsilon))
        
        return entropy
    
    def calculate_gini_impurity(self, items: List) -> float:
        """
        Calculate Gini impurity: Gini(S) = 1 - Σ p(x)²
        Alternative to entropy, faster to compute
        
        Args:
            items: List of items with probabilities
            
        Returns:
            float: Gini impurity (0-1)
        """
        if not items:
            return 0.0
        
        # Get probabilities
        probs = np.array([item.probability for item in items])
        
        # Normalize
        total = probs.sum()
        if total == 0:
            return 0.0
        
        probs = probs / total
        
        # Calculate Gini
        gini = 1.0 - np.sum(probs ** 2)
        
        return gini
    
    def calculate_gain_ratio(self, items: List, attribute: str, value) -> float:
        """
        Calculate gain ratio (normalized information gain)
        GR(S, A) = IG(S, A) / IV(A)
        Where IV is intrinsic value (split information)
        
        Args:
            items: List of items
            attribute: Attribute to test
            value: Value to test for
            
        Returns:
            float: Gain ratio (0-1)
        """
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0.0
        
        # Calculate information gain
        info_gain = self.calculate(active_items, attribute, value)
        
        # Calculate intrinsic value (split information)
        yes_items, no_items = self._split_items(active_items, attribute, value)
        
        total_weight = sum(i.probability for i in active_items)
        
        if total_weight == 0:
            return 0.0
        
        yes_weight = sum(i.probability for i in yes_items) / total_weight
        no_weight = sum(i.probability for i in no_items) / total_weight
        
        # Intrinsic value
        split_info = 0.0
        if yes_weight > 0:
            split_info -= yes_weight * np.log2(yes_weight + self.epsilon)
        if no_weight > 0:
            split_info -= no_weight * np.log2(no_weight + self.epsilon)
        
        # Avoid division by zero
        if split_info == 0:
            return 0.0
        
        gain_ratio = info_gain / split_info
        
        return gain_ratio
    
    def calculate_symmetrical_uncertainty(self, items: List, attribute: str, 
                                         value) -> float:
        """
        Calculate symmetrical uncertainty
        SU(X, Y) = 2 * IG(X, Y) / (H(X) + H(Y))
        
        Args:
            items: List of items
            attribute: Attribute to test
            value: Value to test for
            
        Returns:
            float: Symmetrical uncertainty (0-1)
        """
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0.0
        
        # Calculate information gain
        info_gain = self.calculate(active_items, attribute, value)
        
        # Calculate entropies
        h_items = self.calculate_entropy(active_items)
        
        # Entropy of split (attribute entropy)
        yes_items, no_items = self._split_items(active_items, attribute, value)
        
        # Create pseudo-distribution for attribute
        total_weight = sum(i.probability for i in active_items)
        if total_weight == 0:
            return 0.0
        
        yes_weight = sum(i.probability for i in yes_items) / total_weight
        no_weight = sum(i.probability for i in no_items) / total_weight
        
        h_attribute = 0.0
        if yes_weight > 0:
            h_attribute -= yes_weight * np.log2(yes_weight + self.epsilon)
        if no_weight > 0:
            h_attribute -= no_weight * np.log2(no_weight + self.epsilon)
        
        # Symmetrical uncertainty
        denominator = h_items + h_attribute
        if denominator == 0:
            return 0.0
        
        su = 2.0 * info_gain / denominator
        
        return su
    
    def _split_items(self, items: List, attribute: str, value) -> Tuple[List, List]:
        """
        Split items into yes/no groups based on attribute
        
        Args:
            items: Items to split
            attribute: Attribute to test
            value: Value to test for
            
        Returns:
            Tuple: (yes_items, no_items)
        """
        yes_items = []
        no_items = []
        
        for item in items:
            item_value = item.attributes.get(attribute)
            
            # Handle list attributes
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
    
    def calculate_conditional_entropy(self, items: List, attribute: str, 
                                     value) -> float:
        """
        Calculate conditional entropy H(Y|X)
        
        Args:
            items: List of items
            attribute: Conditioning attribute
            value: Value to condition on
            
        Returns:
            float: Conditional entropy
        """
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0.0
        
        # Split items
        yes_items, no_items = self._split_items(active_items, attribute, value)
        
        # Calculate weighted entropy
        total_weight = sum(i.probability for i in active_items)
        
        if total_weight == 0:
            return 0.0
        
        yes_weight = sum(i.probability for i in yes_items) / total_weight
        no_weight = sum(i.probability for i in no_items) / total_weight
        
        yes_entropy = self.calculate_entropy(yes_items)
        no_entropy = self.calculate_entropy(no_items)
        
        conditional_entropy = yes_weight * yes_entropy + no_weight * no_entropy
        
        return conditional_entropy
    
    def calculate_mutual_information(self, items: List, attribute: str, 
                                    value) -> float:
        """
        Calculate mutual information I(X; Y) = H(Y) - H(Y|X)
        Same as information gain
        
        Args:
            items: List of items
            attribute: Attribute to test
            value: Value to test for
            
        Returns:
            float: Mutual information
        """
        return self.calculate(items, attribute, value)
