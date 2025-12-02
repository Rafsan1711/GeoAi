"""
Item Model - Represents a game item (country/city/place)
"""

from typing import Dict, Any, List, Tuple
import logging

logger = logging.getLogger(__name__)


class Item:
    """
    Represents a single item in the game (country, city, or place)
    """
    
    def __init__(self, item_id: int, name: str, attributes: Dict[str, Any], 
                 emoji: str = "", info: str = ""):
        self.id = item_id
        self.name = name
        self.attributes = attributes  # All item attributes
        self.emoji = emoji
        self.info = info
        
        # Probability tracking
        self.probability: float = 0.0  # Initial probability set by InferenceEngine
        self.eliminated: bool = False  # Whether item is eliminated
        
        # Evidence tracking
        # List of (question_text, answer, likelihood_applied)
        self.evidence: List[Tuple[str, str, float]] = [] 
        self.match_history: List[Tuple[str, bool]] = []
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Item':
        """
        Create Item from dictionary
        """
        item_id = data.get('id', 0)
        name = data.get('name', 'Unknown')
        emoji = data.get('emoji', '🎯')
        info = data.get('info', '')
        
        # Extract attributes (all keys except metadata)
        metadata_keys = {'id', 'name', 'emoji', 'info', 'probability', 'eliminated', 'evidence'}
        attributes = {k: v for k, v in data.items() if k not in metadata_keys}
        
        item = cls(item_id, name, attributes, emoji, info)
        item.probability = data.get('probability', 0.0) # Load existing prob if available
        item.eliminated = data.get('eliminated', False)
        return item
    
    def to_dict(self) -> Dict:
        """
        Convert Item to dictionary
        """
        return {
            'id': self.id,
            'name': self.name,
            'emoji': self.emoji,
            'info': self.info,
            'probability': self.probability,
            'eliminated': self.eliminated,
            'evidence': self.evidence, # Export evidence for persistence
            **self.attributes  # Include all attributes
        }
    
    def matches_question(self, question: Dict) -> bool:
        """
        Check if item matches a question (updated to be a static check)
        """
        attribute = question['attribute']
        target_value = question['value']
        
        item_value = self.attributes.get(attribute)
        
        if item_value is None:
            return False
            
        # Handle list attributes (like flagColors, neighbors, famousFor)
        if isinstance(item_value, list):
            # Fuzzy match for strings in array
            if isinstance(target_value, str):
                target_value_lower = target_value.lower().strip()
                return any(str(v).lower().strip() == target_value_lower or target_value_lower in str(v).lower().strip() for v in item_value)
            return target_value in item_value
        
        # Handle string attributes
        if isinstance(item_value, str) and isinstance(target_value, str):
            item_str = item_value.lower().strip()
            target_str = target_value.lower().strip()
            # Exact or contains match (for famousFor single-string checks)
            return item_str == target_str or target_str in item_str

        # Direct comparison for boolean/numeric
        return item_value == target_value

    
    def reset_probability(self):
        """Reset probability to initial state"""
        self.probability = 0.0
        self.eliminated = False
        self.evidence = []
        self.match_history = []
    
    def __repr__(self) -> str:
        """String representation"""
        return f"Item(id={self.id}, name='{self.name}', prob={self.probability:.4f})"
