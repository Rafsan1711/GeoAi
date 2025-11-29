"""
Question Selector - Pure Python Implementation
V2: Multi-stage, adaptive, non-redundant question selection.
"""

import math
import random
from typing import List, Dict, Set, Tuple
from collections import defaultdict
import logging

from models.item_model import Item
from algorithms.information_gain import InformationGain
from algorithms.bayesian_network import BayesianNetwork
from backend.config import GAME_CONFIG

logger = logging.getLogger(__name__)


class QuestionSelector:
    """Selects the next best question based on an advanced scoring model."""
    
    def __init__(self):
        self.info_gain_calc = InformationGain()
        self.stage_map = self._get_default_stage_map()
        self.feature_importance = {} # Absorbs former feature_importance.py
    
    def _get_default_stage_map(self) -> Dict[str, int]:
        """Maps attributes to a heuristic stage for targeted questioning."""
        return {
            'continent': 0, 'region': 1, 'subRegion': 1, # Stage 0-1: Location
            'hasCoast': 2, 'landlocked': 2, 'isIsland': 2, 'hasMountains': 2, 
            'climate': 2, 'avgTemperature': 2, # Stage 2: Geographic/Environmental
            'population': 3, 'size': 3, # Stage 3: Demographic
            'government': 4, 'mainReligion': 4, 'driveSide': 4, 'exports': 4, # Stage 4: Political/Economic
            'language': 5, 'famousFor': 5, 'neighbors': 5, 'flagColors': 5, # Stage 5: Cultural/Specific
            'nationalDish': 5, 'funFact': 5, # Fine-grained
            'country': 6, 'city': 6, 'name': 6 # Guessing/Final Check
        }
    
    def get_attribute_stage(self, attribute: str) -> int:
        """Returns the stage for a given attribute."""
        return self.stage_map.get(attribute, 5)

    def calculate_feature_importance(self, items: List[Item], questions: List[Dict]):
        """
        Initial calculation of feature importance (Gini Impurity & Coverage).
        This score is static per category and done once at game start.
        """
        all_attributes = set(q['attribute'] for q in questions)
        
        for attr in all_attributes:
            values = []
            defined_count = 0
            
            for item in items:
                val = item.attributes.get(attr)
                if val is not None:
                    defined_count += 1
                    if isinstance(val, list):
                        values.extend(val)
                    else:
                        values.append(val)
            
            if not values:
                self.feature_importance[attr] = 0.0
                continue
                
            # Gini Impurity (Measures diversity of values)
            value_counts = defaultdict(int)
            for v in values:
                value_counts[str(v)] += 1
            total = sum(value_counts.values())
            gini = 1.0 - sum((count/total)**2 for count in value_counts.values())
            
            # Coverage (Measures how many items have this attribute defined)
            coverage = defined_count / len(items) if items else 0.0
            
            # Weighted Importance
            importance = (gini * 0.6) + (coverage * 0.4)
            
            self.feature_importance[attr] = importance
        
        logger.debug(f"Feature importance calculated for {len(all_attributes)} attributes.")

    def select_best_question(self, available_questions: List[Dict], active_items: List[Item], 
                             bayesian_network: BayesianNetwork, game_state_history: List[Tuple]) -> Optional[Dict]:
        """
        Selects the single best question using a blended score model.
        
        The blended score maximizes: 
        1. Information Gain (Entropy Reduction)
        2. Strategic Alignment (Question Stage)
        3. Bayesian Prior Belief (Confirmation/Denial)
        4. Question Balance (Near 50/50 split)
        """
        if len(active_items) <= GAME_CONFIG['min_items_to_guess'] or not active_items:
            return None
        
        questions_to_score = self._prune_redundant_questions(available_questions, active_items, game_state_history)
        
        if not questions_to_score:
            return None

        # Determine current heuristic stage for strategic scoring
        questions_asked = len(game_state_history)
        current_stage = 5
        if questions_asked < 5: current_stage = 0
        elif questions_asked < 12: current_stage = 2
        elif questions_asked < 25: current_stage = 4
        
        # Score each question
        question_scores = []
        
        for question in questions_to_score:
            # 1. Information Gain (EIG) - CRITICAL: How well does it split?
            ig_score = self.info_gain_calc.calculate(
                active_items, 
                question['attribute'], 
                question['value']
            ) * 0.45 
            
            # 2. Strategy Score - High weight for aligning with the current stage
            q_stage = self.get_attribute_stage(question['attribute'])
            strategy_bonus = 0.0
            if q_stage <= current_stage:
                strategy_bonus = 0.30 # Favor questions in or before the current stage
            elif q_stage == current_stage + 1:
                 strategy_bonus = 0.15 # Allow questions for the next stage
            strategy_score = strategy_bonus
            
            # 3. Bayesian Score - Does it target an attribute with a strong belief?
            bn_score = bayesian_network.score_question(question) * 0.15
            
            # 4. Balance Score - Favor 50/50 splits (most information-rich)
            balance_score = self._score_question_by_balance(active_items, question) * 0.05
            
            # 5. Feature Importance - Boost based on overall attribute value
            # This helps select better attributes when IG scores are similar.
            importance_score = self.feature_importance.get(question['attribute'], 0.5) * 0.05
            
            # Calculate total score
            total_score = ig_score + strategy_score + bn_score + balance_score + importance_score
            
            question_scores.append({
                'question': question,
                'score': total_score,
                'ig': ig_score, 'bn': bn_score, 'strat': strategy_score,
                'balance': balance_score, 'importance': importance_score
            })
        
        # Sort and return best question
        question_scores.sort(key=lambda x: x['score'], reverse=True)
        
        if not question_scores:
            return None
            
        best = question_scores[0]
        logger.info(
            f"Question Selected: {best['question']['question']} (Score: {best['score']:.3f} | "
            f"IG:{best['ig']:.2f}, BN:{best['bn']:.2f}, Strat:{best['strat']:.2f}, Bal:{best['balance']:.2f})"
        )
        return best['question']

    def _prune_redundant_questions(self, available_questions: List[Dict], active_items: List[Item], 
                                    game_state_history: List[Tuple]) -> List[Dict]:
        """Filters out questions that are unlikely to yield new information."""
        
        asked_attributes = {q[0]['attribute'] for q in game_state_history}
        asked_questions_text = {q[0]['question'] for q in game_state_history}
        
        filtered_questions = []
        for question in available_questions:
            # 1. Already asked exact question
            if question['question'] in asked_questions_text:
                continue
            
            attribute = question['attribute']
            value = question['value']
            
            # 2. Trivial Split Check: Skip if almost all remaining items have the same value for this attribute.
            unique_values = set()
            for item in active_items:
                item_value = item.attributes.get(attribute)
                if item_value is not None:
                    if isinstance(item_value, list):
                        unique_values.update(str(v) for v in item_value)
                    else:
                        unique_values.add(str(item_value))
            
            # If only one unique value remains among all active items for this attribute
            if len(unique_values) <= 1 and attribute in asked_attributes:
                continue
                
            # 3. Prevent over-asking a general attribute (e.g., 'hasMountains')
            attribute_count = sum(1 for q, _ in game_state_history if q['attribute'] == attribute)
            if attribute_count >= 4 and attribute not in ['famousFor', 'neighbors']:
                 # Still allow very specific ones, but prune generic ones if abused
                 if self.get_attribute_stage(attribute) < 5:
                     continue

            # 4. Filter out 'no' answers if the set is small.
            if len(active_items) <= 10 and attribute in asked_attributes and self.get_attribute_stage(attribute) <= 1:
                # If the question targets a broad category already largely filtered by its attribute
                if attribute in ['continent', 'region'] and question['value'] not in unique_values:
                    # Skip asking about an empty continent/region
                    continue
            
            filtered_questions.append(question)
            
        return filtered_questions

    def _score_question_by_balance(self, items: List[Item], question: Dict) -> float:
        """Scores a question based on how close the split is to a 50/50 ratio by item count."""
        if not items:
            return 0.0
        
        total = 0
        matches = 0
        test_question = {'attribute': question['attribute'], 'value': question['value']}
        
        for item in items:
            if item.eliminated:
                continue
                
            total += 1
            if item.matches_question(test_question):
                matches += 1
        
        if total == 0:
            return 0.0
        
        ratio = matches / total
        # Formula: 1 - |0.5 - ratio| * 2. Range [0, 1]. Max at ratio=0.5.
        balance = 1.0 - abs(0.5 - ratio) * 2
        
        return balance
