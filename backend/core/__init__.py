"""
GeoAI Core Module
Advanced AI Engine for Geography Game
"""

# NOTE: Removed relative imports to prevent ImportError chain reaction on Gunicorn start.
# Modules are now imported directly within core/app.py or other files as needed.
# This file serves only as a package marker and __all__ list.

from .inference_engine import InferenceEngine
from .question_selector import QuestionSelector
from .probability_manager import ProbabilityManager
from .confidence_calculator import ConfidenceCalculator

__all__ = [
    'InferenceEngine',
    'QuestionSelector', 
    'ProbabilityManager',
    'ConfidenceCalculator'
]
