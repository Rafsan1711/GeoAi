"""
Item Model - Represents a game item (country/city/place)
"""

from typing import Dict, Any
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
        self.probability = 1.0  # Initial probability
        self.eliminated = False  # Whether item is eliminated
        
        # History tracking
        self.match_history = []  # List of (question, matched: bool)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Item':
        """
        Create Item from dictionary
        
        Args:
            data: Dictionary with item data
            
        Returns:
            Item: New Item object
        """
        item_id = data.get('id', 0)
        name = data.get('name', 'Unknown')
        emoji = data.get('emoji', '🎯')
        info = data.get('info', '')
        
        # Extract attributes (all keys except metadata)
        metadata_keys = {'id', 'name', 'emoji', 'info', 'probability', 'eliminated'}
        attributes = {k: v for k, v in data.items() if k not in metadata_keys}
        
        return cls(item_id, name, attributes, emoji, info)
    
    def to_dict(self) -> Dict:
        """
        Convert Item to dictionary
        
        Returns:
            Dict: Item data
        """
        return {
            'id': self.id,
            'name': self.name,
            'emoji': self.emoji,
            'info': self.info,
            'probability': self.probability,
            'eliminated': self.eliminated,
            **self.attributes  # Include all attributes
        }
    
    def matches_question(self, question: Dict) -> bool:
        """
        Check if item matches a question
        
        Args:
            question: Question dict with 'attribute' and 'value'
            
        Returns:
            bool: True if matches
        """
        attribute = question['attribute']
        target_value = question['value']
        
        item_value = self.attributes.get(attribute)
        
        # Handle list attributes (like flagColors)
        if isinstance(item_value, list):
            matches = target_value in item_value
        else:
            matches = item_value == target_value
        
        # Record match history
        self.match_history.append((question['question'], matches))
        
        return matches
    
    def get_attribute(self, attribute: str, default=None):
        """
        Get attribute value with default
        
        Args:
            attribute: Attribute name
            default: Default value if not found
            
        Returns:
            Any: Attribute value
        """
        return self.attributes.get(attribute, default)
    
    def has_attribute(self, attribute: str) -> bool:
        """
        Check if item has an attribute defined
        
        Args:
            attribute: Attribute name
            
        Returns:
            bool: True if has attribute
        """
        return attribute in self.attributes and self.attributes[attribute] is not None
    
    def get_match_rate(self) -> float:
        """
        Get percentage of questions this item matched
        
        Returns:
            float: Match rate (0-1)
        """
        if not self.match_history:
            return 0.0
        
        matches = sum(1 for _, matched in self.match_history if matched)
        return matches / len(self.match_history)
    
    def reset_probability(self):
        """Reset probability to initial state"""
        self.probability = 1.0
        self.eliminated = False
        self.match_history = []
    
    def __repr__(self) -> str:
        """String representation"""
        return f"Item(id={self.id}, name='{self.name}', prob={self.probability:.4f})"
    
    def __str__(self) -> str:
        """String representation"""
        status = "eliminated" if self.eliminated else "active"
        return f"{self.emoji} {self.name} ({status}, prob={self.probability:.2f})"
    
    def __eq__(self, other) -> bool:
        """Equality comparison"""
        if not isinstance(other, Item):
            return False
        return self.id == other.id and self.name == other.name
    
    def __hash__(self) -> int:
        """Hash for use in sets/dicts"""
        return hash((self.id, self.name))
