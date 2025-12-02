"""
GeoAI Core Module
Advanced AI Engine for Geography Game
"""

# CRITICAL FIX: Removed ALL relative imports from __init__.py to prevent NameError/ImportError 
# and cyclic dependency issues in Gunicorn/Render.

__all__ = [
    'InferenceEngine',
    'QuestionSelector', 
    'ProbabilityManager',
    'ConfidenceCalculator'
]
