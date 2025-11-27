"""
Inference Engine - Pure Python Implementation
Main AI Brain - No strict question limits
"""

import math
import logging
from typing import List, Dict, Optional, Tuple
from collections import defaultdict

from .question_selector import QuestionSelector
from .probability_manager import ProbabilityManager
from .confidence_calculator import ConfidenceCalculator
from algorithms.information_gain import InformationGain
from algorithms.bayesian_network import BayesianNetwork
from models.game_state import GameState
from models.item_model import Item

logger = logging.getLogger(__name__)


class InferenceEngine:
    """Main AI Engine - Pure Python with flexible stopping"""
    
    def __init__(self):
        self.question_selector = QuestionSelector()
        self.probability_manager = ProbabilityManager()
        self.confidence_calculator = ConfidenceCalculator()
        self.information_gain = InformationGain()
        self.bayesian_network = BayesianNetwork()
        
        self.current_game: Optional[GameState] = None
        
        self.session_stats = {
            'games_played': 0,
            'successful_guesses': 0,
            'average_questions': 0,
            'common_patterns': defaultdict(int)
        }
        
        self.config = {
            'min_confidence_threshold': 92,    # Increased from 90 to 92
            'max_questions': 50,               # Increased from 15 to 50
            'early_stop_threshold': 95,        # Keep at 95 for very high confidence
            'min_items_threshold': 1,          # Only stop at 1 item (not 2)
            'soft_filter_threshold': 0.005,    # More aggressive filtering (0.5% instead of 1%)
            'context_weight': 0.3,
            'adaptive_strategy': True,
            'force_high_confidence': True      # NEW: Require high confidence before stopping
        }
        
        logger.info("Inference Engine initialized (Pure Python, Flexible Stopping)")
    
    def start_new_game(self, category: str, items: List[Dict], 
                       questions: List[Dict]) -> GameState:
        """Start new game session"""
        item_objects = [Item.from_dict(item_dict) for item_dict in items]
        
        for item in item_objects:
            item.probability = 1.0 / len(item_objects)
        
        self.current_game = GameState(
            category=category,
            items=item_objects,
            questions=questions
        )
        
        self.bayesian_network.build_network(item_objects, questions)
        self.question_selector.calculate_feature_importance(item_objects, questions)
        
        logger.info(f"New game started: {category} with {len(items)} items, max questions: {self.config['max_questions']}")
        return self.current_game
    
    def get_next_question(self) -> Optional[Dict]:
        """Select best next question"""
        if not self.current_game:
            raise ValueError("No active game")
        
        if self._should_stop_asking():
            logger.info("Stopping condition met")
            return None
        
        active_items = self.current_game.get_active_items()
        
        if len(active_items) == 0:
            logger.warning("No active items")
            return None
        
        available_questions = self.current_game.get_available_questions()
        
        if not available_questions:
            logger.info("No more questions available")
            return None
        
        question_scores = []
        
        for question in available_questions:
            ig_score = self.information_gain.calculate(
                active_items, 
                question['attribute'], 
                question['value']
            )
            
            bn_score = self.bayesian_network.score_question(
                question, 
                self.current_game.answer_history
            )
            
            context_score = self._calculate_context_score(question)
            strategy_score = self._calculate_strategy_score(question)
            
            total_score = (
                0.40 * ig_score +
                0.25 * bn_score +
                0.20 * context_score +
                0.15 * strategy_score
            )
            
            question_scores.append({
                'question': question,
                'score': total_score,
                'ig': ig_score,
                'bn': bn_score,
                'context': context_score,
                'strategy': strategy_score
            })
        
        question_scores.sort(key=lambda x: x['score'], reverse=True)
        
        best = question_scores[0]
        selected_question = best['question']
        
        logger.info(
            f"Question {self.current_game.questions_asked + 1}: "
            f"{selected_question['question']} (score: {best['score']:.3f})"
        )
        
        self.current_game.mark_question_asked(selected_question)
        
        return selected_question
    
    def process_answer(self, answer: str) -> Dict:
        """Process user answer"""
        if not self.current_game or not self.current_game.current_question:
            raise ValueError("No active question")
        
        question = self.current_game.current_question
        
        self.current_game.record_answer(answer)
        
        active_items = self.current_game.get_active_items()
        
        for item in active_items:
            likelihood = self._calculate_likelihood(item, question, answer)
            item.probability *= likelihood
        
        self._normalize_probabilities()
        self._soft_filter_items()
        
        self.bayesian_network.update_beliefs(question, answer)
        
        confidence = self.confidence_calculator.calculate(
            self.current_game.get_active_items()
        )
        
        top_item = self.current_game.get_top_prediction()
        
        logger.info(
            f"Answer processed: {answer} | "
            f"Active items: {len(self.current_game.get_active_items())} | "
            f"Confidence: {confidence:.1f}% | "
            f"Top: {top_item.name if top_item else 'None'}"
        )
        
        return {
            'confidence': confidence,
            'active_items_count': len(self.current_game.get_active_items()),
            'top_prediction': top_item.to_dict() if top_item else None,
            'should_stop': self._should_stop_asking()
        }
    
    def get_final_prediction(self) -> Dict:
        """Get final prediction"""
        if not self.current_game:
            raise ValueError("No active game")
        
        top_item = self.current_game.get_top_prediction()
        active_items = self.current_game.get_active_items()
        
        if not top_item:
            return {
                'prediction': None,
                'confidence': 0,
                'alternatives': []
            }
        
        confidence = self.confidence_calculator.calculate(active_items)
        
        sorted_items = sorted(
            active_items, 
            key=lambda x: x.probability, 
            reverse=True
        )
        alternatives = [item.to_dict() for item in sorted_items[1:4]]
        
        self._update_session_stats(confidence >= 85)
        
        logger.info(
            f"Final prediction: {top_item.name} "
            f"(confidence: {confidence:.1f}%, "
            f"questions: {self.current_game.questions_asked})"
        )
        
        return {
            'prediction': top_item.to_dict(),
            'confidence': int(confidence),
            'alternatives': alternatives,
            'questions_asked': self.current_game.questions_asked,
            'total_items': len(self.current_game.items),
            'remaining_items': len(active_items)
        }
    
    def _should_stop_asking(self) -> bool:
        """
        Check if should stop asking questions
        More strict conditions - prioritize accuracy over speed
        """
        if not self.current_game:
            return True
        
        active_items = self.current_game.get_active_items()
        
        # Stop only if no items left
        if len(active_items) == 0:
            logger.info("Stop: No items remaining")
            return True
        
        # Stop only if exactly 1 item with high confidence
        if len(active_items) == 1:
            confidence = self.confidence_calculator.calculate(active_items)
            if confidence >= 90:
                logger.info(f"Stop: Single item with {confidence:.1f}% confidence")
                return True
        
        # Calculate current confidence
        confidence = self.confidence_calculator.calculate(active_items)
        
        # Stop only at very high confidence (95%+)
        if confidence >= self.config['early_stop_threshold']:
            logger.info(f"Stop: Very high confidence reached ({confidence:.1f}%)")
            return True
        
        # Stop if reached max questions BUT only if confidence is acceptable
        if self.current_game.questions_asked >= self.config['max_questions']:
            if confidence >= self.config['min_confidence_threshold']:
                logger.info(f"Stop: Max questions reached with {confidence:.1f}% confidence")
                return True
            else:
                # Don't stop if confidence is too low, even if max questions reached
                logger.warning(f"Max questions reached but confidence only {confidence:.1f}% - continuing")
                # Allow a few more questions
                if self.current_game.questions_asked >= self.config['max_questions'] + 10:
                    logger.info("Stop: Hard limit of max+10 questions reached")
                    return True
                return False
        
        # Stop if no more questions available
        if len(self.current_game.get_available_questions()) == 0:
            logger.info("Stop: No more questions available")
            return True
        
        # Don't stop otherwise - keep asking until confident
        return False
    
    def _calculate_likelihood(self, item: Item, question: Dict, 
                             answer: str) -> float:
        """Calculate likelihood with stronger weights"""
        attribute = question['attribute']
        target_value = question['value']
        item_value = item.attributes.get(attribute)
        
        if isinstance(item_value, list):
            matches = target_value in item_value
        else:
            matches = item_value == target_value
        
        # Stronger likelihood weights for better discrimination
        if answer == 'yes':
            return 3.0 if matches else 0.03  # Even stronger
        elif answer == 'probably':
            return 1.8 if matches else 0.25
        elif answer == 'dontknow':
            return 1.0
        elif answer == 'probablynot':
            return 0.25 if matches else 1.8
        elif answer == 'no':
            return 0.03 if matches else 3.0  # Even stronger
        else:
            return 1.0
    
    def _normalize_probabilities(self):
        """Normalize probabilities"""
        if not self.current_game:
            return
        
        active_items = self.current_game.get_active_items()
        total_prob = sum(item.probability for item in active_items)
        
        if total_prob > 0:
            for item in active_items:
                item.probability /= total_prob
    
    def _soft_filter_items(self):
        """Soft filter items with more aggressive threshold"""
        if not self.current_game:
            return
        
        threshold = self.config['soft_filter_threshold']
        
        for item in self.current_game.items:
            if item.probability < threshold:
                item.eliminated = True
        
        # Keep at least top 2 items
        active_items = self.current_game.get_active_items()
        if len(active_items) < 2:
            sorted_items = sorted(
                self.current_game.items, 
                key=lambda x: x.probability, 
                reverse=True
            )
            for i in range(min(2, len(sorted_items))):
                sorted_items[i].eliminated = False
    
    def _calculate_context_score(self, question: Dict) -> float:
        """Calculate context score"""
        if not self.current_game or not self.current_game.answer_history:
            return 0.5
        
        score = 0.5
        attribute = question['attribute']
        
        related_attrs = self._get_related_attributes(attribute)
        
        for prev_q, prev_a in self.current_game.answer_history:
            if prev_q['attribute'] in related_attrs:
                if prev_a in ['yes', 'no']:
                    score += 0.2
                elif prev_a == 'dontknow':
                    score -= 0.1
        
        return max(0.0, min(1.0, score))
    
    def _calculate_strategy_score(self, question: Dict) -> float:
        """Calculate strategy score"""
        if not self.current_game:
            return 0.5
        
        questions_asked = self.current_game.questions_asked
        max_questions = self.config['max_questions']
        progress = questions_asked / max_questions if max_questions > 0 else 0
        
        if progress < 0.3:
            if question['attribute'] in ['continent', 'type', 'region']:
                return 1.0
            return 0.4
        
        elif progress < 0.7:
            if question['attribute'] in ['climate', 'size', 'famousFor', 'age']:
                return 1.0
            return 0.6
        
        else:
            if question['attribute'] in ['country', 'famousFor', 'name']:
                return 1.0
            return 0.7
    
    def _get_related_attributes(self, attribute: str) -> List[str]:
        """Get related attributes"""
        families = {
            'geographic': ['continent', 'region', 'hasCoast', 'isIsland', 
                          'landlocked', 'hasMountains'],
            'demographic': ['population', 'size', 'isCapital'],
            'cultural': ['language', 'mainReligion', 'famousFor'],
            'environmental': ['climate', 'isNatural'],
            'political': ['government', 'country']
        }
        
        for family, attrs in families.items():
            if attribute in attrs:
                return [a for a in attrs if a != attribute]
        
        return []
    
    def _update_session_stats(self, success: bool):
        """Update session statistics"""
        self.session_stats['games_played'] += 1
        if success:
            self.session_stats['successful_guesses'] += 1
        
        games = self.session_stats['games_played']
        prev_avg = self.session_stats['average_questions']
        current_qs = self.current_game.questions_asked if self.current_game else 0
        
        new_avg = ((prev_avg * (games - 1)) + current_qs) / games
        self.session_stats['average_questions'] = new_avg
    
    def get_session_stats(self) -> Dict:
        """Get session stats"""
        games = self.session_stats['games_played']
        success = self.session_stats['successful_guesses']
        
        return {
            'games_played': games,
            'successful_guesses': success,
            'success_rate': (success / games * 100) if games > 0 else 0,
            'average_questions': self.session_stats['average_questions']
            }
