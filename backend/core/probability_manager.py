"""
Probability Manager - Pure Python Implementation
Implements Soft Elimination and Bayesian Update Likelihood
"""

import math
from typing import List, Dict
import logging

from models.item_model import Item

logger = logging.getLogger(__name__)


class ProbabilityManager:
    """Manages item probabilities during a game session."""
    
    # CRITICAL: Ultra Answer Weights
    # Multiplier is applied to the prior probability.
    # New Prob = Prior * Likelihood Multiplier
    LIKELIHOOD_MULTIPLIERS = {
        'yes': {'match': 5.0, 'mismatch': 0.005},      # Highly decisive
        'probably': {'match': 2.5, 'mismatch': 0.2},
        'dontknow': {'match': 1.0, 'mismatch': 1.0},   # No change
        'probablynot': {'match': 0.2, 'mismatch': 2.5},
        'no': {'match': 0.005, 'mismatch': 5.0}        # Highly decisive
    }
    
    MIN_PROBABILITY: float = 1e-6  # Never let probability go below this (Soft Elimination)
    MIN_PROBABILITY_HARD: float = 1e-10 # For initial mass setting

    def update_item_probability(self, item: Item, question: Dict, answer: str) -> float:
        """
        Update item probability using the Bayesian likelihood method.
        
        Args:
            item: The item model instance.
            question: The question asked.
            answer: The user's answer.
            
        Returns:
            float: The new un-normalized probability for the item.
        """
        # 1. Determine Match
        matches = item.matches_question(question)
        
        # 2. Get Likelihood Multiplier
        params = self.LIKELIHOOD_MULTIPLIERS.get(answer, self.LIKELIHOOD_MULTIPLIERS['dontknow'])
        likelihood = params['match'] if matches else params['mismatch']
        
        # 3. Bayesian Update: P_posterior = P_prior * L
        prior = item.probability
        posterior = prior * likelihood
        
        # 4. Soft Elimination
        # Ensure the probability never goes to true zero, allowing for recovery from wrong branches.
        posterior = max(posterior, self.MIN_PROBABILITY)
        
        # 5. Store evidence (for analytics/debugging)
        item.evidence.append((question['question'], answer, likelihood))
        item.match_history.append((question['question'], matches))
        
        return posterior

    def normalize_probabilities(self, items: List[Item]) -> List[Item]:
        """
        Normalize the probabilities of all active items so they sum to 1.0.
        Also resets probability mass if all were eliminated or sum is near zero.
        """
        active_items = [i for i in items if not i.eliminated]
        
        if not active_items:
            # Should not happen in Soft Elimination, but as a safety measure, reactivate all.
            logger.warning("No active items remain, reactivating all items.")
            active_items = items
            for item in items:
                item.eliminated = False
        
        total_prob = sum(item.probability for item in active_items)
        
        if total_prob < self.MIN_PROBABILITY_HARD:
            # Probability mass has almost vanished, likely due to cascading 'no's.
            # Reset all active items to a uniform distribution (recovery mechanism).
            logger.warning(f"Probability mass near zero ({total_prob:.2e}). Performing mass reset.")
            uniform_prob = 1.0 / len(active_items) if active_items else 0.0
            for item in active_items:
                item.probability = uniform_prob
            total_prob = 1.0
            
        if total_prob > 0:
            for item in active_items:
                item.probability /= total_prob
        
        return items
    
    def soft_filter(self, items: List[Item], top_k: int = 10) -> List[Item]:
        """
        Soft filtering by probabilty threshold. 
        Ensures a minimum of `top_k` items remain active, even if their probability is low.
        """
        
        active_items = [i for i in items if not i.eliminated]
        
        if len(active_items) <= top_k:
            return items

        # Sort all items by current probability
        sorted_items = sorted(items, key=lambda x: x.probability, reverse=True)
        
        # Calculate threshold as 1% of the 10th item's probability
        if len(sorted_items) > 10:
             threshold_prob = sorted_items[min(top_k - 1, len(sorted_items) - 1)].probability * 0.01 
        else:
             threshold_prob = self.MIN_PROBABILITY * 10 
        
        # Mark items below the threshold as eliminated
        for item in sorted_items:
            if item.probability < threshold_prob:
                item.eliminated = True
            else:
                item.eliminated = False # Re-activate if probability has risen
                
        # Ensure at least the top item is never eliminated
        if sorted_items:
            sorted_items[0].eliminated = False

        return items
