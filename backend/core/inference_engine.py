"""
Inference Engine - Pure Python Implementation
Main AI Brain - Orchestrates all core components and implements game flow.
"""

import math
import logging
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
import uuid

# Core components
from .question_selector import QuestionSelector
from .probability_manager import ProbabilityManager
from .confidence_calculator import ConfidenceCalculator
from algorithms.information_gain import InformationGain
from algorithms.bayesian_network import BayesianNetwork
from models.game_state import GameState
from models.item_model import Item
from backend.config import GAME_CONFIG
from services.firebase_service import FirebaseService

logger = logging.getLogger(__name__)


class InferenceEngine:
    """Main AI Engine - Pure Python"""
    
    def __init__(self):
        self.question_selector = QuestionSelector()
        self.probability_manager = ProbabilityManager()
        self.confidence_calculator = ConfidenceCalculator()
        self.information_gain = InformationGain()
        self.bayesian_network = BayesianNetwork()
        self.firebase_service = FirebaseService() # Firebase integration
        
        # Use a dictionary for active games for in-memory caching
        self.active_games: Dict[str, GameState] = {}
        
        self.session_stats = {
            'games_played': 0,
            'successful_guesses': 0,
            'average_questions': 0
        }
        
        logger.info("Inference Engine initialized (V3 Ultra)")
    
    def start_new_game(self, category: str, items: List[Dict], 
                       questions: List[Dict]) -> GameState:
        """Start new game session, initializing probability and network."""
        
        # Clear old game and create new items
        session_id = str(uuid.uuid4())
        item_objects = [Item.from_dict({**item_dict, 'probability': 0.0}) for item_dict in items]
        
        # Initial uniform probability
        initial_prob = 1.0 / len(item_objects) if item_objects else 0.0
        for item in item_objects:
            item.probability = initial_prob
        
        # Create new game state
        game_state = GameState(
            session_id=session_id,
            category=category,
            items=item_objects,
            questions=questions
        )
        
        self.active_games[session_id] = game_state
        
        # Initialize core algorithms
        self.bayesian_network.build_network(item_objects, questions)
        self.question_selector.calculate_feature_importance(item_objects, questions)
        
        # Save initial state to Firebase (optional, for persistence/analytics)
        self.firebase_service.save_game_state(game_state)
        
        logger.info(f"New game started: {session_id} - {category} with {len(items)} items")
        return game_state
    
    def get_game_state(self, session_id: str) -> Optional[GameState]:
        """Retrieves game state from in-memory cache or Firebase."""
        if session_id in self.active_games:
            return self.active_games[session_id]
        
        # Try to load from Firebase if not in memory (simulating a cache miss)
        game_state_dict = self.firebase_service.load_game_state(session_id)
        if game_state_dict:
            game_state = GameState.from_dict(game_state_dict)
            self.active_games[session_id] = game_state # Cache it
            logger.info(f"Game state loaded from Firebase: {session_id}")
            # Re-initialize algorithm components with loaded state
            self.bayesian_network.build_network(game_state.items, game_state.questions)
            self.question_selector.calculate_feature_importance(game_state.items, game_state.questions)
            return game_state

        return None

    def get_next_question(self, game_state: GameState) -> Optional[Dict]:
        """Select best next question using multi-criteria scoring."""
        
        if self._should_stop_asking(game_state):
            logger.info(f"Session {game_state.session_id}: Stopping condition met.")
            return None
        
        active_items = game_state.get_active_items()
        available_questions = game_state.get_available_questions()
        
        if len(active_items) == 0 or not available_questions:
            return None
        
        # Select best question
        selected_question = self.question_selector.select_best_question(
            available_questions=available_questions,
            active_items=active_items,
            bayesian_network=self.bayesian_network,
            game_state_history=game_state.answer_history
        )
        
        if selected_question:
            game_state.mark_question_asked(selected_question)
            logger.info(
                f"Session {game_state.session_id}: Q{game_state.questions_asked} selected: {selected_question['question']}"
            )
            self.firebase_service.save_game_state(game_state) # Persist state
        
        return selected_question
    
    def process_answer(self, game_state: GameState, answer: str) -> Dict:
        """Process user answer, update probabilities, and propagate beliefs."""
        if not game_state.current_question:
            raise ValueError("No active question to answer.")
        
        question = game_state.current_question
        game_state.record_answer(answer)
        
        # 1. Update Probabilities (Likelihood & Soft Elimination)
        active_items = game_state.get_active_items()
        for item in active_items:
            item.probability = self.probability_manager.update_item_probability(
                item, question, answer
            )
        
        # 2. Normalize and Filter
        self.probability_manager.normalize_probabilities(game_state.items)
        self.probability_manager.soft_filter(game_state.items, top_k=GAME_CONFIG['min_items_to_guess'] + 2)
        
        # 3. Propagate Beliefs
        self.bayesian_network.update_beliefs(question, answer, game_state.items)
        
        # 4. Update metrics
        current_active_items = game_state.get_active_items()
        confidence = self.confidence_calculator.calculate(current_active_items)
        top_item = game_state.get_top_prediction()
        
        # 5. Save state
        self.firebase_service.save_game_state(game_state)
        
        logger.info(
            f"Session {game_state.session_id}: Answer processed ({answer}) | "
            f"Items: {len(current_active_items)} | Confidence: {confidence:.1f}%"
        )
        
        return {
            'confidence': confidence,
            'active_items_count': len(current_active_items),
            'top_prediction': top_item.to_dict() if top_item else None,
            'should_stop': self._should_stop_asking(game_state)
        }

    def get_final_prediction(self, game_state: GameState) -> Dict:
        """Get final prediction and clean up session."""
        
        top_item = game_state.get_top_prediction()
        active_items = game_state.get_active_items()
        
        confidence = self.confidence_calculator.calculate(active_items)
        
        if top_item:
            sorted_items = sorted(
                active_items, 
                key=lambda x: x.probability, 
                reverse=True
            )
            alternatives = [item.to_dict() for item in sorted_items[1:4]]
            
            # 1. Log final result for analytics
            self.firebase_service.log_game_result(game_state, top_item.name, confidence, False, "Final Guess")
            
            # 2. Update local stats
            self._update_session_stats(confidence >= GAME_CONFIG['confidence_threshold_stage_3'])
        else:
            alternatives = []

        # 3. Clean up in-memory cache
        if game_state.session_id in self.active_games:
            del self.active_games[game_state.session_id]
        
        return {
            'prediction': top_item.to_dict() if top_item else None,
            'confidence': int(confidence),
            'alternatives': alternatives,
            'questions_asked': game_state.questions_asked,
            'total_items': len(game_state.items),
            'remaining_items': len(active_items)
        }
        
    def _should_stop_asking(self, game_state: GameState) -> bool:
        """Check if stopping condition is met using adaptive logic."""
        active_items = game_state.get_active_items()
        
        # Absolute limits
        if len(active_items) <= GAME_CONFIG['min_items_to_guess']:
            return True
        if game_state.questions_asked >= GAME_CONFIG['max_questions']:
            return True
        if not game_state.get_available_questions():
            return True

        confidence = self.confidence_calculator.calculate(active_items)
        
        # Adaptive check (uses ConfidenceCalculator's logic)
        return self.confidence_calculator.should_make_guess(
            confidence, 
            game_state.questions_asked
        )

    def _update_session_stats(self, success: bool):
        """Update local, temporary session statistics (not persisted)"""
        self.session_stats['games_played'] += 1
        if success:
            self.session_stats['successful_guesses'] += 1
        
        games = self.session_stats['games_played']
        prev_avg = self.session_stats['average_questions']
        current_qs = self.current_game.questions_asked if self.current_game else 0
        
        new_avg = ((prev_avg * (games - 1)) + current_qs) / games
        self.session_stats['average_questions'] = new_avg
    
    def get_session_stats(self) -> Dict:
        """Get local session stats"""
        games = self.session_stats['games_played']
        success = self.session_stats['successful_guesses']
        
        return {
            'games_played': games,
            'successful_guesses': success,
            'success_rate': (success / games * 100) if games > 0 else 0,
            'average_questions': self.session_stats['average_questions']
        }
