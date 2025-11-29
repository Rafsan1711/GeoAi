"""
GeoAI Backend Configuration - Centralized Management
All settings, API keys, and deployment parameters are stored here.
"""

import os

# --- SERVICE CONFIGURATION ---

FIREBASE_CONFIG = {
    'databaseURL': os.getenv('FIREBASE_DATABASE_URL', "https://default-rtdb.firebaseio.com"),
    'apiKey': os.getenv('FIREBASE_API_KEY', None) 
}

# --- GAME & ALGORITHM CONFIGURATION ---

GAME_CONFIG = {
    'max_questions': 50,  
    'min_items_to_guess': 1,  
    'soft_filter_threshold': 1e-6, 
    'enable_learning': True, 
    
    # Adaptive Confidence Thresholds (Guessing Logic)
    'confidence_threshold_stage_1': 99.0,  
    'confidence_threshold_stage_2': 98.0,  
    'confidence_threshold_stage_3': 95.0,  
}

# --- DEPLOYMENT & LOGGING ---

DEPLOYMENT_CONFIG = {
    'debug': os.getenv('FLASK_DEBUG', 'False').lower() == 'true',
    'port': int(os.getenv('PORT', 8000)),
    'version': '3.0.0-ULTRA',
    'log_level': os.getenv('LOG_LEVEL', 'INFO')
}

# --- ALGORITHM TUNING PARAMETERS ---

ALGORITHM_PARAMS = {
    'question_score_weights': {
        'information_gain': 0.45,
        'strategy_alignment': 0.30,
        'bayesian_belief': 0.15,
        'balance_split': 0.05,
        'feature_importance': 0.05
    },
    
    'likelihood_multipliers': {
        'yes': {'match': 5.0, 'mismatch': 0.005},
        'probably': {'match': 2.5, 'mismatch': 0.2},
        'dontknow': {'match': 1.0, 'mismatch': 1.0},
        'probablynot': {'match': 0.2, 'mismatch': 2.5},
        'no': {'match': 0.005, 'mismatch': 5.0}
    },
    
    'confidence_weights': {
        'probability_gap': 0.40,
        'normalized_prob': 0.30,
        'item_count': 0.20,
        'entropy': 0.10
    }
}
