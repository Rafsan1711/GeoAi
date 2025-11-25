"""
Game State - Manages current game session state
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class GameState:
    """
    Represents the state of a single game session
    """
    
    def __init__(self, category: str, items: List, questions: List[Dict]):
        # Game metadata
        self.category = category
        self.start_time = datetime.now()
        
        # Items and questions
        self.items = items  # List of Item objects
        self.questions = questions  # Available questions
        
        # Game progress
        self.questions_asked = 0
        self.asked_question_ids = set()
        self.current_question = None
        
        # Answer history
        self.answer_history = []  # List of (question, answer) tuples
        
        # Session metadata
        self.session_id = self._generate_session_id()
        
        logger.info(f"Game state created: {category} with {len(items)} items")
    
    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        return f"{self.category}_{self.start_time.timestamp()}"
    
    def mark_question_asked(self, question: Dict):
        """
        Mark a question as asked
        
        Args:
            question: Question that was asked
        """
        self.current_question = question
        self.questions_asked += 1
        self.asked_question_ids.add(question['question'])
        
        logger.debug(f"Question {self.questions_asked} marked: {question['question']}")
    
    def record_answer(self, answer: str):
        """
        Record user's answer
        
        Args:
            answer: User's answer
        """
        if self.current_question:
            self.answer_history.append((self.current_question, answer))
            logger.debug(f"Answer recorded: {answer}")
    
    def get_active_items(self) -> List:
        """
        Get items that are still active (not eliminated)
        
        Returns:
            List: Active Item objects
        """
        return [item for item in self.items if not item.eliminated]
    
    def get_available_questions(self) -> List[Dict]:
        """
        Get questions that haven't been asked yet
        
        Returns:
            List: Available questions
        """
        return [
            q for q in self.questions 
            if q['question'] not in self.asked_question_ids
        ]
    
    def get_top_prediction(self):
        """
        Get the item with highest probability
        
        Returns:
            Item: Top prediction or None
        """
        active_items = self.get_active_items()
        
        if not active_items:
            return None
        
        return max(active_items, key=lambda x: x.probability)
    
    def get_progress_percentage(self, max_questions: int = 15) -> float:
        """
        Get game progress as percentage
        
        Args:
            max_questions: Maximum questions
            
        Returns:
            float: Progress percentage (0-100)
        """
        return (self.questions_asked / max_questions) * 100
    
    def get_game_duration(self) -> float:
        """
        Get game duration in seconds
        
        Returns:
            float: Duration in seconds
        """
        return (datetime.now() - self.start_time).total_seconds()
    
    def to_dict(self) -> Dict:
        """
        Convert game state to dictionary
        
        Returns:
            Dict: Game state data
        """
        active_items = self.get_active_items()
        
        return {
            'session_id': self.session_id,
            'category': self.category,
            'questions_asked': self.questions_asked,
            'total_items': len(self.items),
            'active_items': len(active_items),
            'duration_seconds': self.get_game_duration(),
            'answer_history_length': len(self.answer_history)
        }
    
    def get_answer_statistics(self) -> Dict:
        """
        Get statistics about answers given
        
        Returns:
            Dict: Answer statistics
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
    
    def get_attribute_usage(self) -> Dict[str, int]:
        """
        Get how many times each attribute was asked
        
        Returns:
            Dict: attribute -> count
        """
        from collections import Counter
        
        attributes = [q['attribute'] for q, _ in self.answer_history]
        return dict(Counter(attributes))
    
    def __repr__(self) -> str:
        """String representation"""
        return (
            f"GameState(category={self.category}, "
            f"questions={self.questions_asked}, "
            f"active_items={len(self.get_active_items())})"
        )
