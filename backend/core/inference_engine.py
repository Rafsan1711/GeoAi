"""
Inference Engine - Main AI Brain
Advanced decision-making and game flow control
"""

import numpy as np
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
    """
    Main AI Engine that coordinates all components
    Uses advanced algorithms for accurate predictions
    """
    
    def __init__(self):
        # Core components
        self.question_selector = QuestionSelector()
        self.probability_manager = ProbabilityManager()
        self.confidence_calculator = ConfidenceCalculator()
        self.information_gain = InformationGain()
        self.bayesian_network = BayesianNetwork()
        
        # Game state tracking
        self.current_game: Optional[GameState] = None
        
        # Session learning (in-memory)
        self.session_stats = {
            'games_played': 0,
            'successful_guesses': 0,
            'average_questions': 0,
            'common_patterns': defaultdict(int)
        }
        
        # Performance tuning
        self.config = {
            'min_confidence_threshold': 90,  # Only guess at 90%+
            'max_questions': 15,
            'early_stop_threshold': 95,      # Stop at 95%+ confidence
            'min_items_threshold': 2,        # Stop when 2 or fewer items
            'soft_filter_threshold': 0.01,   # Keep items above 1% probability
            'context_weight': 0.3,           # Weight for context-aware questions
            'adaptive_strategy': True        # Enable adaptive questioning
        }
        
        logger.info("Inference Engine initialized with advanced configuration")
    
    def start_new_game(self, category: str, items: List[Dict], 
                       questions: List[Dict]) -> GameState:
        """
        Start a new game session
        
        Args:
            category: Game category (country/city/place)
            items: List of all possible items
            questions: Question bank for this category
            
        Returns:
            GameState: Initial game state
        """
        # Convert items to Item objects
        item_objects = [Item.from_dict(item_dict) for item_dict in items]
        
        # Initialize all items with equal probability
        for item in item_objects:
            item.probability = 1.0 / len(item_objects)
        
        # Create new game state
        self.current_game = GameState(
            category=category,
            items=item_objects,
            questions=questions
        )
        
        # Build Bayesian network structure
        self.bayesian_network.build_network(item_objects, questions)
        
        # Calculate initial feature importance
        self.question_selector.calculate_feature_importance(
            item_objects, questions
        )
        
        logger.info(f"New game started: {category} with {len(items)} items")
        return self.current_game
    
    def get_next_question(self) -> Optional[Dict]:
        """
        Select the best next question using advanced algorithms
        
        Returns:
            Dict: Question to ask, or None if should stop
        """
        if not self.current_game:
            raise ValueError("No active game. Call start_new_game first.")
        
        # Check stopping conditions
        if self._should_stop_asking():
            logger.info("Stopping condition met")
            return None
        
        # Get remaining items
        active_items = self.current_game.get_active_items()
        
        if len(active_items) == 0:
            logger.warning("No active items remaining")
            return None
        
        # Calculate information gain for all available questions
        available_questions = self.current_game.get_available_questions()
        
        if not available_questions:
            logger.info("No more questions available")
            return None
        
        # Score each question using multiple factors
        question_scores = []
        
        for question in available_questions:
            # 1. Information Gain (entropy-based)
            ig_score = self.information_gain.calculate(
                active_items, 
                question['attribute'], 
                question['value']
            )
            
            # 2. Bayesian Network score
            bn_score = self.bayesian_network.score_question(
                question, 
                self.current_game.answer_history
            )
            
            # 3. Context awareness score
            context_score = self._calculate_context_score(question)
            
            # 4. Strategic score (adaptive strategy)
            strategy_score = self._calculate_strategy_score(question)
            
            # Combine scores with weights
            total_score = (
                0.40 * ig_score +           # Information gain is most important
                0.25 * bn_score +            # Bayesian inference
                0.20 * context_score +       # Context from previous answers
                0.15 * strategy_score        # Strategic game phase
            )
            
            question_scores.append({
                'question': question,
                'score': total_score,
                'ig': ig_score,
                'bn': bn_score,
                'context': context_score,
                'strategy': strategy_score
            })
        
        # Sort by score
        question_scores.sort(key=lambda x: x['score'], reverse=True)
        
        # Select best question
        best = question_scores[0]
        selected_question = best['question']
        
        logger.info(
            f"Question {self.current_game.questions_asked + 1}: "
            f"{selected_question['question']} "
            f"(score: {best['score']:.3f})"
        )
        
        # Mark as asked
        self.current_game.mark_question_asked(selected_question)
        
        return selected_question
    
    def process_answer(self, answer: str) -> Dict:
        """
        Process user's answer and update probabilities
        
        Args:
            answer: User's answer (yes/probably/dontknow/probablynot/no)
            
        Returns:
            Dict: Updated game state info
        """
        if not self.current_game or not self.current_game.current_question:
            raise ValueError("No active question to answer")
        
        question = self.current_game.current_question
        
        # Record answer
        self.current_game.record_answer(answer)
        
        # Update probabilities using Bayesian inference
        active_items = self.current_game.get_active_items()
        
        # Calculate likelihood for each item
        for item in active_items:
            likelihood = self._calculate_likelihood(item, question, answer)
            
            # Bayesian update: P(item|answer) ∝ P(answer|item) * P(item)
            item.probability *= likelihood
        
        # Normalize probabilities
        self._normalize_probabilities()
        
        # Soft filtering - remove very low probability items
        self._soft_filter_items()
        
        # Update Bayesian network
        self.bayesian_network.update_beliefs(question, answer)
        
        # Calculate current confidence
        confidence = self.confidence_calculator.calculate(
            self.current_game.get_active_items()
        )
        
        # Get top prediction
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
        """
        Get final prediction with confidence
        
        Returns:
            Dict: Prediction result
        """
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
        
        # Calculate final confidence
        confidence = self.confidence_calculator.calculate(active_items)
        
        # Get top 3 alternatives
        sorted_items = sorted(
            active_items, 
            key=lambda x: x.probability, 
            reverse=True
        )
        alternatives = [item.to_dict() for item in sorted_items[1:4]]
        
        # Update session stats
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
        Determine if we should stop asking questions
        
        Returns:
            bool: True if should stop
        """
        if not self.current_game:
            return True
        
        active_items = self.current_game.get_active_items()
        
        # No items left
        if len(active_items) == 0:
            return True
        
        # Reached max questions
        if self.current_game.questions_asked >= self.config['max_questions']:
            return True
        
        # Very few items left
        if len(active_items) <= self.config['min_items_threshold']:
            return True
        
        # High confidence reached
        confidence = self.confidence_calculator.calculate(active_items)
        if confidence >= self.config['early_stop_threshold']:
            return True
        
        # No more questions available
        if len(self.current_game.get_available_questions()) == 0:
            return True
        
        return False
    
    def _calculate_likelihood(self, item: Item, question: Dict, 
                             answer: str) -> float:
        """
        Calculate P(answer|item, question) - likelihood
        
        Args:
            item: Item to evaluate
            question: Question asked
            answer: User's answer
            
        Returns:
            float: Likelihood value
        """
        # Check if item matches the question
        attribute = question['attribute']
        target_value = question['value']
        item_value = item.attributes.get(attribute)
        
        # Handle list attributes (like flagColors)
        if isinstance(item_value, list):
            matches = target_value in item_value
        else:
            matches = item_value == target_value
        
        # Likelihood based on answer and match
        # These are tuned values based on empirical testing
        if answer == 'yes':
            return 2.5 if matches else 0.05
        elif answer == 'probably':
            return 1.5 if matches else 0.3
        elif answer == 'dontknow':
            return 1.0  # No information
        elif answer == 'probablynot':
            return 0.3 if matches else 1.5
        elif answer == 'no':
            return 0.05 if matches else 2.5
        else:
            return 1.0
    
    def _normalize_probabilities(self):
        """Normalize probabilities to sum to 1"""
        if not self.current_game:
            return
        
        active_items = self.current_game.get_active_items()
        total_prob = sum(item.probability for item in active_items)
        
        if total_prob > 0:
            for item in active_items:
                item.probability /= total_prob
    
    def _soft_filter_items(self):
        """Remove items with very low probability (soft filtering)"""
        if not self.current_game:
            return
        
        threshold = self.config['soft_filter_threshold']
        
        for item in self.current_game.items:
            if item.probability < threshold:
                item.eliminated = True
    
    def _calculate_context_score(self, question: Dict) -> float:
        """
        Calculate context-aware score based on previous answers
        
        Args:
            question: Question to score
            
        Returns:
            float: Context score (0-1)
        """
        if not self.current_game or not self.current_game.answer_history:
            return 0.5  # Neutral if no history
        
        score = 0.5
        attribute = question['attribute']
        
        # Check if related attributes were answered
        related_attrs = self._get_related_attributes(attribute)
        
        for prev_q, prev_a in self.current_game.answer_history:
            if prev_q['attribute'] in related_attrs:
                # If user was certain (yes/no), related questions are more valuable
                if prev_a in ['yes', 'no']:
                    score += 0.2
                # If uncertain, related questions less valuable
                elif prev_a == 'dontknow':
                    score -= 0.1
        
        return max(0.0, min(1.0, score))
    
    def _calculate_strategy_score(self, question: Dict) -> float:
        """
        Calculate strategic score based on game phase
        
        Args:
            question: Question to score
            
        Returns:
            float: Strategy score (0-1)
        """
        if not self.current_game:
            return 0.5
        
        questions_asked = self.current_game.questions_asked
        max_questions = self.config['max_questions']
        progress = questions_asked / max_questions
        
        # Early game (0-30%): Prefer broad questions (continent, type, region)
        if progress < 0.3:
            if question['attribute'] in ['continent', 'type', 'region']:
                return 1.0
            return 0.4
        
        # Mid game (30-70%): Prefer specific characteristics
        elif progress < 0.7:
            if question['attribute'] in ['climate', 'size', 'famousFor', 'age']:
                return 1.0
            return 0.6
        
        # Late game (70-100%): Prefer pinpointing questions
        else:
            if question['attribute'] in ['country', 'famousFor', 'name']:
                return 1.0
            return 0.7
    
    def _get_related_attributes(self, attribute: str) -> List[str]:
        """Get list of related attributes"""
        # Define attribute families
        families = {
            'geographic': ['continent', 'region', 'hasCoast', 'isIsland', 
                          'landlocked', 'hasMountains'],
            'demographic': ['population', 'size', 'isCapital'],
            'cultural': ['language', 'mainReligion', 'famousFor'],
            'environmental': ['climate', 'isNatural'],
            'political': ['government', 'country']
        }
        
        # Find which family this attribute belongs to
        for family, attrs in families.items():
            if attribute in attrs:
                return [a for a in attrs if a != attribute]
        
        return []
    
    def _update_session_stats(self, success: bool):
        """Update session statistics"""
        self.session_stats['games_played'] += 1
        if success:
            self.session_stats['successful_guesses'] += 1
        
        # Update average questions
        games = self.session_stats['games_played']
        prev_avg = self.session_stats['average_questions']
        current_qs = self.current_game.questions_asked if self.current_game else 0
        
        new_avg = ((prev_avg * (games - 1)) + current_qs) / games
        self.session_stats['average_questions'] = new_avg
    
    def get_session_stats(self) -> Dict:
        """Get session statistics"""
        games = self.session_stats['games_played']
        success = self.session_stats['successful_guesses']
        
        return {
            'games_played': games,
            'successful_guesses': success,
            'success_rate': (success / games * 100) if games > 0 else 0,
            'average_questions': self.session_stats['average_questions']
        }
