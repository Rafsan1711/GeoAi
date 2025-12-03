"""
Data Loader - Loads and processes game data
"""

import json
import os
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class DataLoader:
    """
    Handles loading and caching of game data
    """
    
    def __init__(self, data_dir: str = 'data'):
        self.data_dir = data_dir
        self.cache = {}
        
    def load_json(self, filename: str) -> List[Dict]:
        """
        Load JSON file
        
        Args:
            filename: Name of JSON file
            
        Returns:
            List: Loaded data
        """
        # Check cache first
        if filename in self.cache:
            logger.debug(f"Loading {filename} from cache")
            return self.cache[filename]
        
        # Load from file
        filepath = os.path.join(self.data_dir, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Cache the data
            self.cache[filename] = data
            
            logger.info(f"Loaded {len(data)} items from {filename}")
            return data
            
        except FileNotFoundError:
            logger.error(f"File not found: {filepath}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in {filepath}: {e}")
            return []
    
    def load_countries(self) -> List[Dict]:
        """Load countries data"""
        return self.load_json('countries.json')
    
    def load_cities(self) -> List[Dict]:
        """Load cities data"""
        return self.load_json('cities.json')
    
    def load_places(self) -> List[Dict]:
        """Load places data"""
        return self.load_json('places.json')
    
    def load_all_data(self) -> Dict[str, List[Dict]]:
        """
        Load all game data
        
        Returns:
            Dict: category -> data
        """
        return {
            'country': self.load_countries(),
            'city': self.load_cities(),
            'place': self.load_places()
        }
    
    def validate_data(self, data: List[Dict], required_fields: List[str]) -> bool:
        """
        Validate data structure
        
        Args:
            data: Data to validate
            required_fields: Required fields in each item
            
        Returns:
            bool: True if valid
        """
        if not data:
            logger.warning("Empty data")
            return False
        
        for i, item in enumerate(data):
            for field in required_fields:
                if field not in item:
                    logger.error(f"Item {i} missing required field: {field}")
                    return False
        
        logger.info(f"Data validation passed for {len(data)} items")
        return True
    
    def get_category_data(self, category: str) -> List[Dict]:
        """
        Get data for specific category
        
        Args:
            category: Category name (country/city/place)
            
        Returns:
            List: Category data
        """
        category_map = {
            'country': 'countries.json',
            'city': 'cities.json',
            'place': 'places.json'
        }
        
        filename = category_map.get(category)
        if not filename:
            logger.error(f"Unknown category: {category}")
            return []
        
        return self.load_json(filename)
    
    def clear_cache(self):
        """Clear cached data"""
        self.cache.clear()
        logger.info("Data cache cleared")
    
    def get_data_stats(self) -> Dict:
        """
        Get statistics about loaded data
        
        Returns:
            Dict: Data statistics
        """
        all_data = self.load_all_data()
        
        stats = {}
        for category, data in all_data.items():
            stats[category] = {
                'count': len(data),
                'cached': f'{category}.json' in self.cache
            }
        
        return stats
