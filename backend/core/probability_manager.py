"""
Probability Manager - Bayesian Probability Updates
Handles sophisticated probability calculations and updates
"""

import numpy as np
from typing import List, Dict, Tuple
from scipy import stats
import logging

logger = logging.getLogger(__name__)


class ProbabilityManager:
    """
    Manages probability distributions using Bayesian inference
    """
    
    def __init__(self):
        # Prior distribution parameters
        self.alpha = 1.0  # Pseudo-count for Dirichlet prior
        
        # Answer confidence mapping (how certain is each answer type)
        self.answer_confidence = {
            'yes': 0.95,
            'probably': 0.75,
            'dontknow': 0.50,
            'probablynot': 0.75,
            'no': 0.95
        }
        
        # Likelihood parameters (tuned values)
        self.likelihood_params = {
            'yes': {'match': 2.5, 'mismatch': 0.05},
            'probably': {'match': 1.5, 'mismatch': 0.3},
            'dontknow': {'match': 1.0, 'mismatch': 1.0},
            'probablynot': {'match': 0.3, 'mismatch': 1.5},
            'no': {'match': 0.05, 'mismatch': 2.5}
        }
    
    def calculate_posterior(self, prior: float, likelihood: float, 
                           evidence: float = 1.0) -> float:
        """
        Bayesian update: P(H|E) = P(E|H) * P(H) / P(E)
        
        Args:
            prior: Prior probability P(H)
            likelihood: Likelihood P(E|H)
            evidence: Evidence probability P(E)
            
        Returns:
            float: Posterior probability P(H|E)
        """
        if evidence == 0:
            return prior
        
        posterior = (likelihood * prior) / evidence
        return posterior
    
    def update_item_probability(self, item, question: Dict, answer: str) -> float:
        """
        Update item probability based on answer
        
        Args:
            item: Item object
            question: Question that was asked
            answer: User's answer
            
        Returns:
            float: Updated probability
        """
        # Get current probability (prior)
        prior = item.probability
        
        # Check if item matches question
        attribute = question['attribute']
        target_value = question['value']
        item_value = item.attributes.get(attribute)
        
        # Determine match
        if isinstance(item_value, list):
            matches = target_value in item_value
        else:
            matches = item_value == target_value
        
        # Get likelihood based on answer and match
        params = self.likelihood_params.get(answer, self.likelihood_params['dontknow'])
        likelihood = params['match'] if matches else params['mismatch']
        
        # Apply confidence adjustment
        confidence = self.answer_confidence.get(answer, 0.5)
        
        # Adjusted likelihood (less extreme if low confidence)
        if confidence < 1.0:
            # Move likelihood closer to 1.0 (neutral) based on confidence
            likelihood = 1.0 + (likelihood - 1.0) * confidence
        
        # Calculate posterior
        posterior = prior * likelihood
        
        return posterior
    
    def normalize_probabilities(self, items: List) -> List:
        """
        Normalize probabilities to sum to 1
        
        Args:
            items: List of items with probabilities
            
        Returns:
            List: Items with normalized probabilities
        """
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return items
        
        # Calculate total probability
        total_prob = sum(item.probability for item in active_items)
        
        if total_prob == 0:
            # Reset to uniform distribution
            uniform_prob = 1.0 / len(active_items)
            for item in active_items:
                item.probability = uniform_prob
        else:
            # Normalize
            for item in active_items:
                item.probability = item.probability / total_prob
        
        return items
    
    def soft_filter(self, items: List, threshold: float = 0.01) -> List:
        """
        Remove items with probability below threshold
        
        Args:
            items: List of items
            threshold: Minimum probability to keep
            
        Returns:
            List: Filtered items
        """
        for item in items:
            if item.probability < threshold:
                item.eliminated = True
        
        # Keep at least top 3 items even if below threshold
        active_items = [i for i in items if not i.eliminated]
        if len(active_items) < 3:
            # Re-activate top items
            sorted_items = sorted(items, key=lambda x: x.probability, reverse=True)
            for i in range(min(3, len(sorted_items))):
                sorted_items[i].eliminated = False
        
        return items
    
    def calculate_confidence_interval(self, items: List, 
                                     confidence_level: float = 0.95) -> Tuple[float, float]:
        """
        Calculate confidence interval for top prediction
        
        Args:
            items: List of items
            confidence_level: Desired confidence level (e.g., 0.95 for 95%)
            
        Returns:
            Tuple: (lower_bound, upper_bound)
        """
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return (0.0, 0.0)
        
        # Get top item probability
        top_prob = max(i.probability for i in active_items)
        
        # Approximate confidence interval using normal approximation
        n = len(active_items)
        z = stats.norm.ppf((1 + confidence_level) / 2)
        
        # Standard error
        se = np.sqrt(top_prob * (1 - top_prob) / n)
        
        # Confidence interval
        lower = max(0.0, top_prob - z * se)
        upper = min(1.0, top_prob + z * se)
        
        return (lower, upper)
    
    def calculate_entropy(self, items: List) -> float:
        """
        Calculate Shannon entropy of probability distribution
        Higher entropy = more uncertainty
        
        Args:
            items: List of items
            
        Returns:
            float: Entropy value
        """
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0.0
        
        # Get probabilities
        probs = np.array([i.probability for i in active_items])
        
        # Normalize
        total = probs.sum()
        if total == 0:
            return 0.0
        
        probs = probs / total
        
        # Calculate entropy
        entropy = -np.sum(probs * np.log2(probs + 1e-10))
        
        return entropy
    
    def calculate_kl_divergence(self, items_before: List, items_after: List) -> float:
        """
        Calculate KL divergence between distributions before and after update
        Measures information gained from the question
        
        Args:
            items_before: Items before update
            items_after: Items after update
            
        Returns:
            float: KL divergence
        """
        # Get active items
        active_before = [i for i in items_before if not i.eliminated]
        active_after = [i for i in items_after if not i.eliminated]
        
        if not active_before or not active_after:
            return 0.0
        
        # Get probabilities
        probs_before = np.array([i.probability for i in active_before])
        probs_after = np.array([i.probability for i in active_after])
        
        # Normalize
        probs_before = probs_before / probs_before.sum()
        probs_after = probs_after / probs_after.sum()
        
        # Ensure same length (pad with small values if needed)
        if len(probs_before) != len(probs_after):
            max_len = max(len(probs_before), len(probs_after))
            if len(probs_before) < max_len:
                probs_before = np.pad(probs_before, 
                                     (0, max_len - len(probs_before)), 
                                     constant_values=1e-10)
            if len(probs_after) < max_len:
                probs_after = np.pad(probs_after, 
                                    (0, max_len - len(probs_after)), 
                                    constant_values=1e-10)
        
        # Calculate KL divergence
        kl_div = np.sum(probs_after * np.log2((probs_after + 1e-10) / (probs_before + 1e-10)))
        
        return kl_div
    
    def estimate_questions_remaining(self, items: List, target_confidence: float = 0.9) -> int:
        """
        Estimate how many questions needed to reach target confidence
        
        Args:
            items: Current items
            target_confidence: Target confidence level
            
        Returns:
            int: Estimated questions remaining
        """
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            return 0
        
        # Current entropy
        current_entropy = self.calculate_entropy(active_items)
        
        if current_entropy == 0:
            return 0
        
        # Target entropy (based on target confidence)
        # Higher confidence = lower acceptable entropy
        target_entropy = -target_confidence * np.log2(target_confidence) - \
                        (1 - target_confidence) * np.log2((1 - target_confidence) / (len(active_items) - 1) + 1e-10)
        
        # Estimate entropy reduction per question (empirical value)
        avg_entropy_reduction = 0.3  # Typically reduces by ~30% per question
        
        # Calculate questions needed
        if avg_entropy_reduction > 0:
            questions_needed = (current_entropy - target_entropy) / avg_entropy_reduction
            return max(0, int(np.ceil(questions_needed)))
        
        return 1
