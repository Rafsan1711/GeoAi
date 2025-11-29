"""
Firebase Service - Handles persistence and logging using Firebase RTDB.
Replaces Redis, MongoDB, and Supabase integration.
"""

import firebase_admin
from firebase_admin import db, credentials
from typing import Optional, Dict
import logging
import json
import os
from datetime import datetime

# Local Imports
# Assuming backend/config.py is at the root of python modules, 
# or adjust path if necessary (e.g. from ..config import ...)
from backend.config import FIREBASE_CONFIG 
from models.game_state import GameState # Required for type hinting/dict conversion

logger = logging.getLogger(__name__)

class FirebaseService:
    """Singleton class for Firebase Realtime Database operations."""
    
    _instance = None
    _db_client = None

    def __new__(cls):
        """Implement Singleton pattern."""
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
            cls._instance._initialize_firebase()
        return cls._instance

    def _initialize_firebase(self):
        """Initializes the Firebase app if not already done."""
        if not firebase_admin._apps:
            try:
                # IMPORTANT: For Render.com, the service account file should be uploaded 
                # or base64 encoded into an environment variable and decoded on startup.
                
                cred_path = FIREBASE_CONFIG['credential_path']
                
                # Check for direct file path first (common in local dev/Render build)
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                
                # Check for a single env var if file doesn't exist (better for security)
                elif os.getenv('FIREBASE_SA_KEY_JSON'):
                    # Load from environment variable (base64 decoded JSON string)
                    import base64
                    json_data = base64.b64decode(os.getenv('FIREBASE_SA_KEY_JSON')).decode('utf-8')
                    service_account_json = json.loads(json_data)
                    cred = credentials.Certificate(service_account_json)
                
                else:
                    logger.error("No Firebase credentials found. Skipping Firebase initialization.")
                    return

                firebase_admin.initialize_app(cred, {
                    'databaseURL': FIREBASE_CONFIG['databaseURL']
                })
                self._db_client = db
                logger.info("✅ Firebase RTDB initialized successfully.")
                
            except Exception as e:
                logger.error(f"❌ Failed to initialize Firebase: {e}", exc_info=True)
                
    # --- SESSION STATE MANAGEMENT (Replaces Redis) ---

    def save_game_state(self, game_state: GameState):
        """Save the current GameState object to Firebase RTDB."""
        if not self._db_client:
            return
        
        try:
            # GameState.to_dict() is complex, so we limit the update path 
            # for better performance and smaller payload.
            state_dict = game_state.to_dict()
            
            ref = self._db_client.reference(f'games/{game_state.session_id}')
            # Store the entire state under the session ID
            ref.set(state_dict) 
            
        except Exception as e:
            logger.error(f"Error saving game state for {game_state.session_id}: {e}")

    def load_game_state(self, session_id: str) -> Optional[Dict]:
        """Load the GameState dictionary from Firebase RTDB."""
        if not self._db_client:
            return None
            
        try:
            ref = self._db_client.reference(f'games/{session_id}')
            state_dict = ref.get()
            
            if state_dict and isinstance(state_dict, dict):
                return state_dict
            
        except Exception as e:
            logger.error(f"Error loading game state for {session_id}: {e}")
            
        return None
        
    def delete_game_state(self, session_id: str):
        """Delete game state after game ends or expires."""
        if not self._db_client:
            return
        
        try:
            ref = self._db_client.reference(f'games/{session_id}')
            ref.delete()
            logger.info(f"Deleted game state for session: {session_id}")
        except Exception as e:
            logger.error(f"Error deleting game state for {session_id}: {e}")

    # --- ANALYTICS & LEARNING (Replaces MongoDB/Supabase) ---

    def log_game_result(self, game_state: GameState, final_guess: str, confidence: float, was_correct: bool, failure_reason: str, actual_answer: Optional[str] = None):
        """Log final game result for later analytics/learning."""
        if not self._db_client:
            return

        try:
            result_data = {
                'session_id': game_state.session_id,
                'category': game_state.category,
                'questions_asked': game_state.questions_asked,
                'final_guess': final_guess,
                'actual_answer': actual_answer,
                'was_correct': was_correct,
                'confidence': round(confidence, 1),
                'failure_reason': failure_reason,
                'duration_seconds': game_state.get_game_duration(),
                'answer_history_summary': game_state.get_answer_statistics(),
                'timestamp': datetime.now().isoformat()
            }
            
            ref = self._db_client.reference(f'analytics/game_results')
            ref.push(result_data)
            
        except Exception as e:
            logger.error(f"Error logging game result for {game_state.session_id}: {e}")
            
    def update_question_effectiveness(self, question: Dict, information_gain: float, was_effective: bool):
        """
        Increment effectiveness metrics for a question to train the model.
        (This is simplified for Firebase RTDB)
        """
        if not self._db_client:
            return
            
        attr = question['attribute']
        # Sanitize value for Firebase path
        val_key = str(question['value']).replace('.', '_').replace('#', '_').replace('$', '_').replace('[', '_').replace(']', '_')
        
        try:
            ref = self._db_client.reference(f'learning/questions/{question["category"]}/{attr}/{val_key}')
            
            def transaction_handler(current_data):
                if current_data is None:
                    current_data = {
                        'times_asked': 0,
                        'total_ig': 0.0,
                        'effective_count': 0,
                        'question_text': question['question']
                    }
                
                current_data['times_asked'] += 1
                current_data['total_ig'] += information_gain
                if was_effective:
                    current_data['effective_count'] += 1
                    
                # Calculate average IG (simple running average)
                current_data['avg_ig'] = current_data['total_ig'] / current_data['times_asked']
                
                return current_data
                
            ref.transaction(transaction_handler)
            
        except Exception as e:
            logger.error(f"Error updating question effectiveness for {attr}/{val_key}: {e}")
            
    # --- END OF FIREBASE SERVICE ---
