"""
Firebase Service - Handles persistence and logging using Firebase RTDB REST API.
This is optimized for low-resource environments (Render.com Free Tier) and avoids heavy SDKs.
"""

import requests
from typing import Optional, Dict
import logging
import json
from datetime import datetime

# Local Imports
from backend.config import FIREBASE_CONFIG
from models.game_state import GameState # Required for type hinting/dict conversion

logger = logging.getLogger(__name__)

class FirebaseService:
    """Singleton class for Firebase Realtime Database operations via REST API."""
    
    _instance = None

    def __new__(cls):
        """Implement Singleton pattern."""
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
            cls._instance._base_url = FIREBASE_CONFIG['databaseURL']
            cls._instance._auth = FIREBASE_CONFIG['apiKey']
            cls._instance._session = requests.Session() # Use a session for performance
            
            if not cls._instance._base_url.endswith('/'):
                 cls._instance._base_url += '/'
                 
            logger.info(f"✅ Firebase REST Service initialized: {cls._instance._base_url}")
            
        return cls._instance

    def _send_request(self, method: str, path: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Generic method to send a request to Firebase RTDB."""
        url = self._base_url + path + ".json"
        params = {}
        if self._auth:
            params['auth'] = self._auth
            
        try:
            if method == 'PUT':
                response = self._session.put(url, params=params, json=data, timeout=5)
            elif method == 'GET':
                response = self._session.get(url, params=params, timeout=5)
            elif method == 'POST':
                response = self._session.post(url, params=params, json=data, timeout=5)
            elif method == 'DELETE':
                response = self._session.delete(url, params=params, timeout=5)
            else:
                return None
            
            response.raise_for_status() # Raise HTTPError for bad responses
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Firebase REST Error ({method} {path}): {e}")
            return None
            
    # --- SESSION STATE MANAGEMENT ---

    def save_game_state(self, game_state: GameState):
        """Save the current GameState object to Firebase RTDB (PUT/Overwrite)."""
        try:
            state_dict = game_state.to_dict()
            self._send_request('PUT', f'games/{game_state.session_id}', state_dict)
        except Exception:
            # Error already logged in _send_request
            pass

    def load_game_state(self, session_id: str) -> Optional[Dict]:
        """Load the GameState dictionary from Firebase RTDB (GET)."""
        return self._send_request('GET', f'games/{session_id}')
        
    def delete_game_state(self, session_id: str):
        """Delete game state (DELETE)."""
        self._send_request('DELETE', f'games/{session_id}')

    # --- ANALYTICS & LEARNING ---

    def log_game_result(self, game_state: GameState, final_guess: str, confidence: float, was_correct: bool, failure_reason: str, actual_answer: Optional[str] = None):
        """Log final game result for later analytics/learning (POST/Push)."""
        
        result_data = {
            'session_id': game_state.session_id,
            'category': game_state.category,
            'questions_asked': game_state.questions_asked,
            'final_guess': final_guess,
            'actual_answer': actual_answer,
            'was_correct': was_correct,
            'confidence': round(confidence, 1),
            'failure_reason': failure_reason,
            'duration_seconds': round(game_state.get_game_duration(), 2),
            'answer_history_summary': game_state.get_answer_statistics(),
            'timestamp': datetime.now().isoformat()
        }
        
        self._send_request('POST', 'analytics/game_results', result_data)
            
    def update_question_effectiveness(self, question: Dict, information_gain: float, was_effective: bool):
        """
        Increment effectiveness metrics for a question (Simplified update via GET-PUT).
        NOTE: This is not a true transaction, so concurrent updates might overwrite.
        For low-traffic, non-critical data, this is acceptable for the free tier.
        """
        attr = question['attribute']
        # Sanitize value for Firebase path
        val_key = str(question['value']).replace('.', '_').replace('#', '_').replace('$', '_').replace('[', '_').replace(']', '_')
        category = question['category']
        
        path = f'learning/questions/{category}/{attr}/{val_key}'
        
        # 1. GET current data
        current_data = self._send_request('GET', path)
        
        if current_data is None:
            current_data = {
                'times_asked': 0,
                'total_ig': 0.0,
                'effective_count': 0,
                'question_text': question['question']
            }

        # 2. Update logic
        current_data['times_asked'] += 1
        current_data['total_ig'] += information_gain
        if was_effective:
            current_data['effective_count'] += 1
        
        current_data['avg_ig'] = current_data['total_ig'] / current_data['times_asked']

        # 3. PUT (Overwrite) updated data
        self._send_request('PUT', path, current_data)
