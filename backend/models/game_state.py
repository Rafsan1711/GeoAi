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
        self.category = category
        self.start_time = datetime.now()
        self.items = items
        self.questions = questions
        self.questions_asked = 0
        self.asked_question_ids = set()
        self.current_question: Optional[Dict] = None
        self.answer_history: List[Tuple[Dict, str]] = []
        self.session_id = session_id if session_id else str(uuid.uuid4())
        
        logger.info(f"Game state created: {self.session_id} - {category} with {len(items)} items")
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'GameState':
        """Create GameState from dictionary (for loading from Firebase)."""
        
        item_objects = [Item.from_dict(item_data) for item_data in data.get('items_data', [])]
        
        game_state = cls(
            session_id=data['session_id'],
            category=data['category'],
            items=item_objects,
            questions=data.get('questions', [])
        )
        
        start_time_str = data.get('start_time')
        game_state.start_time = datetime.fromisoformat(start_time_str) if start_time_str else datetime.now()
        
        game_state.questions_asked = data.get('questions_asked', 0)
        game_state.asked_question_ids = set(data.get('asked_question_ids', []))
        game_state.current_question = data.get('current_question')
        
        # FIX: Ensure nested list/tuple structure is flattened for easy consumption.
        # Firebase returns nested lists, Python unpacks the outer list: [ [q_dict, answer], [q_dict, answer], ... ]
        # The inner element can be a list or a tuple, so we iterate over the inner elements.
        restored_history = []
        for entry in data.get('answer_history', []):
            if isinstance(entry, list) and len(entry) == 2:
                # Assuming entry = [question_dict, answer_string]
                restored_history.append((entry[0], entry[1]))
            elif isinstance(entry, tuple) and len(entry) == 2:
                restored_history.append(entry)
            
        game_state.answer_history = restored_history
        
        return game_state

    def mark_question_asked(self, question: Dict):
        self.current_question = question
        self.questions_asked += 1
        self.asked_question_ids.add(question['question'])
    
    def record_answer(self, answer: str):
        if self.current_question:
            self.answer_history.append((self.current_question, answer))
    
    def get_active_items(self) -> List[Item]:
        return [item for item in self.items if not item.eliminated]
    
    def get_available_questions(self) -> List[Dict]:
        return [
            q for q in self.questions 
            if q['question'] not in self.asked_question_ids
        ]
    
    def get_top_prediction(self) -> Optional[Item]:
        active_items = self.get_active_items()
        if not active_items: return None
        return max(active_items, key=lambda x: x.probability)
    
    def get_game_duration(self) -> float:
        return (datetime.now() - self.start_time).total_seconds()
    
    def to_dict(self) -> Dict:
        return {
            'session_id': self.session_id,
            'category': self.category,
            'start_time': self.start_time.isoformat(),
            'questions_asked': self.questions_asked,
            'asked_question_ids': list(self.asked_question_ids),
            'current_question': self.current_question,
            'items_data': [item.to_dict() for item in self.items],
            'questions': self.questions,
            # Ensure answer_history is converted to a list of lists/tuples for JSON
            'answer_history': [list(entry) for entry in self.answer_history] 
        }
    
    def get_answer_statistics(self) -> Dict:
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
        return (
            f"GameState(session={self.session_id}, category={self.category}, "
            f"questions={self.questions_asked}, "
            f"active_items={len(self.get_active_items())})"
        )
