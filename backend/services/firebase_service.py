"""
Firebase Service - Handles persistence and logging using Firebase RTDB REST API.
This is optimized for low-resource environments (Render.com Free Tier) and avoids heavy SDKs.
"""

import requests
from typing import Optional, Dict
import logging
import json
import os
from datetime import datetime

# Local Imports
from backend.config import FIREBASE_CONFIG

logger = logging.getLogger(__name__)

class FirebaseService:
    """Singleton class for Firebase Realtime Database operations via REST API."""
    
    _instance = None

    def __new__(cls):
        """Implement Singleton pattern."""
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
            
            # CRITICAL FIX: Direct URL injection for guaranteed testing.
            # RENDER EV should be set, but this line ensures the correct URL is used.
            env_url = os.getenv('FIREBASE_DATABASE_URL', "https://default-rtdb.firebaseio.com")
            
            # Use the URL you provided
            cls._instance._base_url = "https://rating-system-c7adc-default-rtdb.asia-southeast1.firebasedatabase.app/" if 'default-rtdb.firebaseio.com' in env_url else env_url
            
            cls._instance._auth = FIREBASE_CONFIG['apiKey']
            cls._instance._session = requests.Session() 
            
            if not cls._instance._base_url.endswith('/'):
                 cls._instance._base_url += '/'
                 
            if 'default-rtdb.firebaseio.com' in cls._instance._base_url:
                logger.error(
                    "❌ CRITICAL FIREBASE URL ERROR: Persistence will FAIL. "
                    "You MUST set FIREBASE_DATABASE_URL to your actual URL in Render EV."
                )
            
            logger.info(f"✅ Firebase REST Service initialized with URL: {cls._instance._base_url}")
            
        return cls._instance

    def _send_request(self, method: str, path: str, data: Optional[Dict] = None) -> Optional[Dict]:
        """Generic method to send a request to Firebase RTDB."""
        
        if 'default-rtdb.firebaseio.com' in self._base_url:
            return None
            
        url = self._base_url + path + ".json"
        params = {}
        if self._auth:
            params['auth'] = self._auth
            
        try:
            timeout = 3 if method in ['PUT', 'POST'] else 5 
            
            if method == 'PUT':
                response = self._session.put(url, params=params, json=data, timeout=timeout)
            elif method == 'GET':
                response = self._session.get(url, params=params, timeout=timeout)
            elif method == 'POST':
                response = self._session.post(url, params=params, json=data, timeout=timeout)
            elif method == 'DELETE':
                response = self._session.delete(url, params=params, timeout=timeout)
            else:
                return None
            
            if response.status_code in [401, 404]:
                logger.error(f"❌ Firebase REST Error ({method} {path}): {response.status_code} {response.reason}. Check Rules or URL.")
            
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Firebase REST Error ({method} {path}): {e}")
            return None
            
    # --- REST OF THE FUNCTIONS (UNCHANGED) ---
    def save_game_state(self, game_state):
        try:
            state_dict = game_state.to_dict()
            self._send_request('PUT', f'games/{game_state.session_id}', state_dict)
        except Exception:
            pass

    def load_game_state(self, session_id):
        return self._send_request('GET', f'games/{session_id}')
        
    def delete_game_state(self, session_id):
        self._send_request('DELETE', f'games/{session_id}')

    def log_game_result(self, game_state, final_guess, confidence, was_correct, failure_reason, actual_answer=None):
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
            
    def update_question_effectiveness(self, question, information_gain, was_effective):
        attr = question['attribute']
        val_key = str(question['value']).replace('.', '_').replace('#', '_').replace('$', '_').replace('[', '_').replace(']', '_')
        category = question['category']
        path = f'learning/questions/{category}/{attr}/{val_key}'
        current_data = self._send_request('GET', path)
        
        if current_data is None:
            current_data = {'times_asked': 0, 'total_ig': 0.0, 'effective_count': 0, 'question_text': question['question']}

        current_data['times_asked'] += 1
        current_data['total_ig'] += information_gain
        if was_effective:
            current_data['effective_count'] += 1
        current_data['avg_ig'] = current_data['total_ig'] / current_data['times_asked']

        self._send_request('PUT', path, current_data)
