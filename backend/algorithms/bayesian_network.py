"""
Bayesian Network - Pure Python Implementation
Simulates a simple belief network for question scoring, replacing complex dependencies.
"""

import math
from typing import List, Dict, Tuple, Set, Optional # <--- FIX: Added Optional
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
            'continent': ['region', 'subRegion', 'hasCoast', 'isIsland'],
            'region': ['continent', 'subRegion', 'landlocked'],
            'population': ['size'],
            'mainReligion': ['language'],
            'climate': ['avgTemperature', 'hasMountains'],
        }
        self.evidence_log: List[Tuple[str, str, str]] = [] # List of (attribute, value, answer)

    def build_network(self, items: List, questions: List[Dict]):
        """
        Initializes beliefs based on the dataset distribution.
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
        """
        attribute = question['attribute']
        value = str(question['value'])
        self.evidence_log.append((attribute, value, answer))

        # 1. Direct Belief Update: Use the distribution of the remaining items
        active_items = [i for i in item_list if not i.eliminated]
        if not active_items:
            return

        total_prob = sum(i.probability for i in active_items)
        if total_prob < 1e-10:
            return

        match_prob_sum = 0.0
        for item in active_items:
            # Use item's inherent match function
            dummy_q = {'attribute': attribute, 'value': question['value']}
            if item.matches_question(dummy_q):
                match_prob_sum += item.probability
        
        # New belief is the sum of probabilities of matching items
        new_belief = match_prob_sum / total_prob if total_prob > 0 else 0.0

        # Update the belief in the specific attribute/value (simplified approach)
        if value in self.attribute_beliefs[attribute]:
            current_belief = self.attribute_beliefs[attribute][value]
            # Interpolate old belief and new observed belief
            updated_belief = (current_belief * 0.5) + (new_belief * 0.5)
            self.attribute_beliefs[attribute][value] = updated_belief
        
        # 2. Propagation: Spread this change to related attributes
        self._propagate_beliefs_simple(attribute, new_belief, answer)

    def _propagate_beliefs_simple(self, source_attr: str, new_belief: float, answer: str):
        """
        Propagates belief changes to dependent attributes using a simple heuristic factor.
        """
        dependents = set()
        for attr, group in self.attribute_groups.items():
            if source_attr in group:
                dependents.add(attr)
            elif attr == source_attr:
                dependents.update(group)
        
        prop_factor = 0.10 if answer in ['yes', 'no'] else 0.02 # Stronger prop for decisive answers

        for dep_attr in dependents:
            if dep_attr in self.attribute_beliefs:
                for value in self.attribute_beliefs[dep_attr]:
                    current_belief = self.attribute_beliefs[dep_attr][value]
                    
                    if new_belief > 0.7:
                         # Push dependent belief up
                        self.attribute_beliefs[dep_attr][value] = min(1.0, current_belief * (1.0 + prop_factor)) 
                    elif new_belief < 0.3:
                        # Pull dependent belief down
                        self.attribute_beliefs[dep_attr][value] = max(0.0, current_belief * (1.0 - prop_factor))
                
                # Re-normalize dependent beliefs
                total = sum(self.attribute_beliefs[dep_attr].values())
                if total > 1e-10:
                    for value in self.attribute_beliefs[dep_attr]:
                        self.attribute_beliefs[dep_attr][value] /= total

    def score_question(self, question: Dict) -> float:
        """
        Score a question based on current beliefs.
        """
        attribute = question['attribute']
        value = str(question['value'])
        
        belief = self.attribute_beliefs.get(attribute, {}).get(value, 0.5)
        
        # Score rewards the confirmation of a strong belief (high confidence)
        # 0.5 = low score (high uncertainty on attribute value)
        # 1.0 = high score (low uncertainty on attribute value)
        belief_score = 1.0 - abs(0.5 - belief) * 2 
        
        return belief_score 

    def reset(self):
        """Reset network"""
        self.attribute_beliefs.clear()
        self.evidence_log.clear()
