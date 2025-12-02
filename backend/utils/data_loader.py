"""
Data Loader - Loads and processes game data
"""

import json
import os
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

# CRITICAL FIX: Determine the base directory relative to the current file (data_loader.py)
# This file is assumed to be in 'backend/utils/'
# Data files are assumed to be in 'backend/data/'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 


class DataLoader:
    """
    Handles loading and caching of game data
    """
    
    def __init__(self, data_dir: str = 'data'):
        # data_dir is expected to be 'data'
        self.data_dir = data_dir
        self.cache = {}
        
    def load_json(self, filename: str) -> List[Dict]:
        """
        Load JSON file
        """
        if filename in self.cache:
            logger.debug(f"Loading {filename} from cache")
            return self.cache[filename]
        
        # CRITICAL FIX: Construct the absolute path from BASE_DIR
        # Path: {Project_Root}/backend/data/filename
        filepath = os.path.join(BASE_DIR, self.data_dir, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.cache[filename] = data
            
            logger.info(f"Loaded {len(data)} items from {filepath}")
            return data
            
        except FileNotFoundError:
            # Report the full path that failed
            logger.error(f"File not found: {filepath}")
            return []
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error in {filepath}: {e}")
            return []
    
    # ... (rest of the functions remain the same)
    
    def load_countries(self) -> List[Dict]:
        return self.load_json('countries.json')
    
    def load_cities(self) -> List[Dict]:
        return self.load_json('cities.json')
    
    def load_places(self) -> List[Dict]:
        return self.load_json('places.json')
    
    def load_all_data(self) -> Dict[str, List[Dict]]:
        return {
            'country': self.load_countries(),
            'city': self.load_cities(),
            'place': self.load_places()
        }
    
    def get_category_data(self, category: str) -> List[Dict]:
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
        self.cache.clear()
        logger.info("Data cache cleared")
    
    def get_data_stats(self) -> Dict:
        all_data = self.load_all_data()
        stats = {}
        for category, data in all_data.items():
            stats[category] = {
                'count': len(data),
                'cached': f'{category}.json' in self.cache
            }
        return stats
