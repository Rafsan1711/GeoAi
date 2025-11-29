"""
GeoAI Backend Configuration - Centralized Management
All settings, API keys, and deployment parameters are stored here.
"""

import os

# --- SERVICE CONFIGURATION ---

# IMPORTANT: Render.com free tier does not automatically provide disk persistence.
# Firebase RTDB is used for all state persistence and analytics.

# Firebase RTDB (Google Service Account or Direct Creds needed)
FIREBASE_CONFIG = {
    'databaseURL': os.getenv('FIREBASE_DATABASE_URL', "https://default-rtdb.firebaseio.com"),
    # Path to the service account JSON file on Render.com
    'credential_path': os.getenv('FIREBASE_CREDENTIAL_PATH', 'firebase-sa-key.json') 
}

# --- GAME & ALGORITHM CONFIGURATION ---

GAME_CONFIG = {
    'max_questions': 50,  # Max questions allowed before forcing a guess
    
    # Adaptive Confidence Thresholds (Guessing Logic)
    'confidence_threshold_stage_1': 99.0,  # Questions 1-15: Need high confidence
    'confidence_threshold_stage_2': 98.0,  # Questions 16-30: Slightly lower confidence allowed
    'confidence_threshold_stage_3': 95.0,  # Questions 31-50: Minimum confidence to guess
    
    'min_items_to_guess': 1,  # Stop asking if item count hits this
    'soft_filter_threshold': 1e-6, # Minimum probability for Soft Elimination
    'enable_learning': True, # Enable sending success/failure data to Firebase
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
    # Weighting factors for blended question scoring (sum to 1.0)
    'question_score_weights': {
        'information_gain': 0.45, # How well it splits the data
        'strategy_alignment': 0.30, # Does it align with the game stage?
        'bayesian_belief': 0.15, # Does it confirm/deny a strong belief?
        'balance_split': 0.05, # Is the split close to 50/50?
        'feature_importance': 0.05 # How inherently useful is the attribute?
    },
    
    # Probability Manager Likelihoods
    # Multiplier applied to P_prior based on answer and match status
    'likelihood_multipliers': {
        'yes': {'match': 5.0, 'mismatch': 0.005},
        'probably': {'match': 2.5, 'mismatch': 0.2},
        'dontknow': {'match': 1.0, 'mismatch': 1.0},
        'probablynot': {'match': 0.2, 'mismatch': 2.5},
        'no': {'match': 0.005, 'mismatch': 5.0}
    },
    
    # Confidence Calculator Weights (sum to 1.0)
    'confidence_weights': {
        'probability_gap': 0.40,
        'normalized_prob': 0.30,
        'item_count': 0.20,
        'entropy': 0.10
    }
}
