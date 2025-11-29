"""
GeoAI Backend - Advanced AI Engine
Flask API with sophisticated algorithms and Firebase RTDB integration (REST API)
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# CRITICAL FIX: Direct, non-relative imports based on Gunicorn's --chdir backend
# This ensures that 'config', 'core', 'utils', 'models' are treated as top-level modules
from config import DEPLOYMENT_CONFIG
from core.inference_engine import InferenceEngine
from utils.data_loader import DataLoader
from utils.logger import setup_logger
from models.item_model import Item 

# Setup logging
logger = setup_logger('geoai', level=DEPLOYMENT_CONFIG['log_level'])

# Initialize Flask app
app = Flask(__name__)
CORS(app) # Enable CORS for frontend communication

# Global instances
# NOTE: data_dir is relative to the directory Gunicorn starts in ('backend')
data_loader = DataLoader(data_dir='data')
inference_engine = InferenceEngine()

# --- UTILITIES ---

def _get_game_state(session_id: str):
    """Utility to retrieve game state or return error."""
    game_state = inference_engine.get_game_state(session_id)
    if not game_state:
        # Note: Game state cleanup in cache is important on failure
        if session_id in inference_engine.active_games:
            del inference_engine.active_games[session_id]
        return None, jsonify({'error': 'Invalid or expired session'}), 400
    return game_state, None, None

# --- API ENDPOINTS ---

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': DEPLOYMENT_CONFIG['version'],
        'engine': 'Advanced Bayesian AI (REST API)',
        'data_stats': data_loader.get_data_stats()
    })


@app.route('/api/start-game', methods=['POST'])
def start_game():
    """
    Start a new game session (loads data from local files on backend)
    """
    try:
        data = request.json
        category = data.get('category')
        
        if not category:
            return jsonify({'error': 'Category required'}), 400
        
        items = data_loader.get_category_data(category)
        questions = data.get('questions', []) 
        
        if not items:
            return jsonify({'error': f'No data for category: {category} on backend'}), 400
        
        if not questions:
            return jsonify({'error': 'Question bank required from frontend'}), 400
        
        # Start new game
        game_state = inference_engine.start_new_game(category, items, questions)
        
        logger.info(f"New game started: {game_state.session_id}")
        
        return jsonify({
            'session_id': game_state.session_id,
            'category': category,
            'total_items': len(items),
            'questions_available': len(questions),
            'message': 'Game started successfully'
        })
        
    except Exception as e:
        logger.error(f"Error starting game: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/question', methods=['POST'])
def get_next_question():
    """Get next question to ask for the current session."""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        game_state, error_response, status = _get_game_state(session_id)
        if error_response: return error_response, status

        question = inference_engine.get_next_question(game_state)
        
        active_items = game_state.get_active_items()
        confidence = inference_engine.confidence_calculator.calculate(active_items)
        top_item = game_state.get_top_prediction()
        
        ready_to_guess = question is None
        
        response = {
            'question': question,
            'ready_to_guess': ready_to_guess,
            'confidence': int(confidence),
            'questions_asked': game_state.questions_asked,
            'active_items_count': len(active_items),
            'top_guess': top_item.name if top_item else None
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error getting question: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/answer', methods=['POST'])
def process_answer():
    """Process user's answer, update state, and return new metrics."""
    try:
        data = request.json
        session_id = data.get('session_id')
        answer = data.get('answer')
        
        game_state, error_response, status = _get_game_state(session_id)
        if error_response: return error_response, status
        
        if not answer:
            return jsonify({'error': 'Answer required'}), 400
        
        result = inference_engine.process_answer(game_state, answer)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error processing answer: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def get_prediction():
    """Get final prediction and end the session."""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        game_state, error_response, status = _get_game_state(session_id)
        if error_response: return error_response, status
        
        result = inference_engine.get_final_prediction(game_state)
        
        inference_engine.firebase_service.delete_game_state(session_id)
        
        return jsonify(result)
            
    except Exception as e:
        logger.error(f"Error making prediction: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """
    Handle user feedback after a wrong guess, allowing the AI to learn
    and the user to continue playing.
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        actual_answer_name = data.get('actual_answer')
        
        game_state, error_response, status = _get_game_state(session_id)
        if error_response: return error_response, status

        top_item = game_state.get_top_prediction()
        
        actual_item = next((item for item in game_state.items if item.name.lower() == actual_answer_name.lower()), None)
        
        if actual_item:
            inference_engine.firebase_service.log_game_result(
                game_state, 
                top_item.name if top_item else "None", 
                inference_engine.confidence_calculator.calculate(game_state.get_active_items()), 
                was_correct=False, 
                failure_reason="user_correction", 
                actual_answer=actual_answer_name
            )
        
            for item in game_state.items:
                if item.id == actual_item.id:
                    item.probability *= 10.0 
                    item.eliminated = False
                else:
                    item.probability *= 0.1 
                    
            inference_engine.probability_manager.normalize_probabilities(game_state.items)
            inference_engine.probability_manager.soft_filter(game_state.items)

        if game_state.questions_asked >= GAME_CONFIG['max_questions']:
            return jsonify({'message': 'Max questions reached, forcing final prediction.', 'questions_asked': game_state.questions_asked}), 400

        inference_engine.firebase_service.save_game_state(game_state)
        
        return jsonify({
            'status': 'learning_in_progress',
            'message': 'AI learned from the mistake and will continue asking better questions.',
            'questions_asked': game_state.questions_asked
        })
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get session statistics and data stats."""
    try:
        stats = inference_engine.get_session_stats()
        data_stats = data_loader.get_data_stats()
        
        return jsonify({
            'local_session_stats': stats,
            'data_stats': data_stats,
            'config': {
                'version': DEPLOYMENT_CONFIG['version'],
                'max_questions': DEPLOYMENT_CONFIG['max_questions']
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error("Internal Server Error: %s", error, exc_info=True)
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = DEPLOYMENT_CONFIG['port']
    debug = DEPLOYMENT_CONFIG['debug']
    
    logger.info(f"Starting GeoAI Backend on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
