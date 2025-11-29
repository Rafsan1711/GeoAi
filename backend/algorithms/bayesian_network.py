"""
Bayesian Network - Pure Python Implementation
Simulates a simple belief network for question scoring, replacing complex dependencies.
"""

import math
from typing import List, Dict, Tuple, Set
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class BayesianNetwork:
    """Bayesian Network to track and propagate beliefs across attributes."""
    
    def __init__(self):
        # Stores P(Attribute=Value | E_prior)
        self.attribute_beliefs = defaultdict(lambda: defaultdict(float))
        # Stores dependencies for propagation (simple map)
        self.attribute_groups = {
            'continent': ['region', 'subRegion'],
            'region': ['continent', 'subRegion'],
            'subRegion': ['continent', 'region'],
            'population': ['avgTemperature', 'size'],
            'mainReligion': ['language', 'government', 'famousFor'],
            'climate': ['avgTemperature', 'hasMountains'],
            'government': ['mainReligion'],
        }
        self.evidence_log = [] # List of (attribute, value, answer)

    def build_network(self, items: List, questions: List[Dict]):
        """
        Initializes beliefs based on the dataset distribution.
        
        Args:
            items: List of Item objects for initial distribution learning.
            questions: List of available question dicts.
        """
        self.attribute_beliefs.clear()
        self.evidence_log.clear()
        
        all_attributes = set(q['attribute'] for q in questions)
        
        for attr in all_attributes:
            value_counts = defaultdict(int)
            total_count = 0
            
            for item in items:
                values = item.attributes.get(attr)
                
                if values is None:
                    continue
                    
                if isinstance(values, list):
                    for v in values:
                        value_counts[str(v)] += 1
                else:
                    value_counts[str(values)] += 1
                total_count += 1
            
            if total_count > 0:
                for value, count in value_counts.items():
                    # Initial belief is P(Attribute=Value)
                    self.attribute_beliefs[attr][value] = count / total_count
        
        logger.info(f"Bayesian Network initialized with {len(all_attributes)} attributes.")

    def update_beliefs(self, question: Dict, answer: str, item_list: List):
        """
        Update beliefs based on a direct question and propagate the effect.

        Args:
            question: The question asked.
            answer: The user's answer.
            item_list: The list of items with updated probabilities.
        """
        attribute = question['attribute']
        value = str(question['value'])
        self.evidence_log.append((attribute, value, answer))

        # 1. Direct Belief Update: Use the distribution of the remaining items
        # to update the belief in the specific attribute-value pair.
        active_items = [i for i in item_list if not i.eliminated]
        if not active_items:
            return

        total_prob = sum(i.probability for i in active_items)
        if total_prob < 1e-10:
            return

        match_prob_sum = 0.0
        for item in active_items:
            # Use a dummy check question (actual check is complex)
            dummy_q = {'attribute': attribute, 'value': question['value']}
            if item.matches_question(dummy_q):
                match_prob_sum += item.probability
        
        # New belief is the sum of probabilities of matching items
        new_belief = match_prob_sum / total_prob if total_prob > 0 else 0.0

        # Update the belief in the specific attribute/value
        for v in self.attribute_beliefs[attribute]:
            self.attribute_beliefs[attribute][v] = (1.0 - new_belief) / (len(self.attribute_beliefs[attribute]) - 1) if v != value else new_belief

        # 2. Propagation: Spread this change to related attributes
        self._propagate_beliefs_simple(attribute, new_belief, answer)

    def _propagate_beliefs_simple(self, source_attr: str, new_belief: float, answer: str):
        """
        Propagates belief changes to dependent attributes.
        Closer to a simple heuristic than a full CPT calculation for performance.
        """
        dependents = set()
        for attr, group in self.attribute_groups.items():
            if source_attr in group:
                dependents.add(attr)
            elif attr == source_attr:
                dependents.update(group)
        
        prop_factor = 0.05 if answer in ['yes', 'no'] else 0.01

        for dep_attr in dependents:
            if dep_attr in self.attribute_beliefs:
                for value in self.attribute_beliefs[dep_attr]:
                    # Shift belief slightly towards or away from 0.5 based on propagation factor
                    current_belief = self.attribute_beliefs[dep_attr][value]
                    if new_belief > 0.5:
                         # Push up if source belief is high
                        self.attribute_beliefs[dep_attr][value] = min(1.0, current_belief * (1.0 + prop_factor)) 
                    else:
                        # Pull down if source belief is low
                        self.attribute_beliefs[dep_attr][value] = max(0.0, current_belief * (1.0 - prop_factor))
                
                # Re-normalize dependent beliefs
                total = sum(self.attribute_beliefs[dep_attr].values())
                if total > 1e-10:
                    for value in self.attribute_beliefs[dep_attr]:
                        self.attribute_beliefs[dep_attr][value] /= total

    def score_question(self, question: Dict) -> float:
        """
        Score a question based on current beliefs: P(Attribute=Value | E).
        Higher score means the question addresses an uncertain area we now have a belief about.
        """
        attribute = question['attribute']
        value = str(question['value'])
        
        # Get the belief for the proposed question's attribute/value pair.
        # Default to 0.5 (maximum uncertainty/no belief)
        belief = self.attribute_beliefs.get(attribute, {}).get(value, 0.5)
        
        # Score favors questions that have a highly shifted belief (close to 1 or 0)
        # as they confirm or deny an already formed hypothesis.
        # Closer to 0.5 means low confidence, higher = higher confidence.
        # We want to ask questions that confirm or deny a strong current belief (high confidence)
        # OR ask questions with high uncertainty (close to 0.5) if many items match that category.
        
        # Simple scoring: favor questions where we have a strong belief to confirm/deny it.
        # Or alternatively, questions that still have high prior probability.
        
        # Score closer to 1 or 0 is better.
        belief_score = 1.0 - abs(0.5 - belief) * 2 
        
        # Also consider if this attribute has already been asked (reduce score)
        # (This check is better handled in QuestionSelector, so keep it simple here)
        
        return belief_score 

    def reset(self):
        """Reset network"""
        self.attribute_beliefs.clear()
        self.evidence_log.clear()
