"""
Game State - Manages current game session state
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime
import logging
import uuid

# Local Imports
from .item_model import Item

logger = logging.getLogger(__name__)


class GameState:
    """
    Represents the state of a single game session
    """
    
    def __init__(self, category: str, items: List[Item], questions: List[Dict], session_id: Optional[str] = None):
        # Game metadata
        self.category = category
        self.start_time = datetime.now()
        
        # Items and questions
        self.items = items  # List of Item objects
        self.questions = questions  # Available questions
        
        # Game progress
        self.questions_asked = 0
        self.asked_question_ids = set()
        self.current_question: Optional[Dict] = None
        
        # Answer history
        self.answer_history: List[Tuple[Dict, str]] = []  # List of (question, answer) tuples
        
        # Session metadata
        self.session_id = session_id if session_id else str(uuid.uuid4())
        
        logger.info(f"Game state created: {self.session_id} - {category} with {len(items)} items")
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'GameState':
        """Create GameState from dictionary (for loading from Firebase)."""
        
        # Reconstruct Items
        item_objects = [Item.from_dict(item_data) for item_data in data['items_data']]
        
        # Reconstruct GameState
        game_state = cls(
            session_id=data['session_id'],
            category=data['category'],
            items=item_objects,
            questions=data['questions']
        )
        
        # Restore state variables
        game_state.start_time = datetime.fromisoformat(data['start_time'])
        game_state.questions_asked = data['questions_asked']
        game_state.asked_question_ids = set(data['asked_question_ids'])
        game_state.current_question = data['current_question']
        game_state.answer_history = [(q, a) for q, a in data['answer_history']]
        
        return game_state

    def mark_question_asked(self, question: Dict):
        """
        Mark a question as asked
        """
        self.current_question = question
        self.questions_asked += 1
        self.asked_question_ids.add(question['question'])
        
        logger.debug(f"Question {self.questions_asked} marked: {question['question']}")
    
    def record_answer(self, answer: str):
        """
        Record user's answer
        """
        if self.current_question:
            self.answer_history.append((self.current_question, answer))
            logger.debug(f"Answer recorded: {answer}")
    
    def get_active_items(self) -> List[Item]:
        """
        Get items that are still active (not eliminated)
        """
        return [item for item in self.items if not item.eliminated]
    
    def get_available_questions(self) -> List[Dict]:
        """
        Get questions that haven't been asked yet
        """
        return [
            q for q in self.questions 
            if q['question'] not in self.asked_question_ids
        ]
    
    def get_top_prediction(self) -> Optional[Item]:
        """
        Get the item with highest probability
        """
        active_items = self.get_active_items()
        
        if not active_items:
            return None
        
        return max(active_items, key=lambda x: x.probability)
    
    def get_game_duration(self) -> float:
        """
        Get game duration in seconds
        """
        return (datetime.now() - self.start_time).total_seconds()
    
    def to_dict(self) -> Dict:
        """
        Convert game state to dictionary (for saving to Firebase)
        """
        return {
            'session_id': self.session_id,
            'category': self.category,
            'start_time': self.start_time.isoformat(),
            'questions_asked': self.questions_asked,
            'asked_question_ids': list(self.asked_question_ids),
            'current_question': self.current_question,
            # Serialize Item objects and answer history
            'items_data': [item.to_dict() for item in self.items],
            'questions': self.questions,
            'answer_history': self.answer_history
        }
    
    def get_answer_statistics(self) -> Dict:
        """
        Get statistics about answers given
        """
        from collections import Counter
        
        answers = [ans for _, ans in self.answer_history]
        answer_counts = Counter(answers)
        
        return {
            'total_answers': len(answers),
            'yes_count': answer_counts.get('yes', 0),
            'no_count': answer_counts.get('no', 0),
            'probably_count': answer_counts.get('probably', 0),
            'probablynot_count': answer_counts.get('probablynot', 0),
            'dontknow_count': answer_counts.get('dontknow', 0)
        }
    
    def __repr__(self) -> str:
        """String representation"""
        return (
            f"GameState(session={self.session_id}, category={self.category}, "
            f"questions={self.questions_asked}, "
            f"active_items={len(self.get_active_items())})"
        )
