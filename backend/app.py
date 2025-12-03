"""
GeoAI Backend - Advanced AI Engine
Flask API with sophisticated algorithms
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import core components
from core.inference_engine import InferenceEngine
from utils.data_loader import DataLoader
from utils.logger import setup_logger

# Setup logging
logger = setup_logger('geoai', level='INFO')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global instances
data_loader = DataLoader(data_dir='data')
inference_engine = InferenceEngine()

# In-memory storage for active games (by session ID)
active_games = {}


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '3.0.0',
        'engine': 'Advanced Bayesian AI',
        'features': [
            'Information Gain',
            'Bayesian Network',
            'Feature Importance',
            'Adaptive Strategy'
        ]
    })


@app.route('/api/start-game', methods=['POST'])
def start_game():
    """
    Start a new game session
    
    Request body:
    {
        "category": "country" | "city" | "place",
        "items": [...],  # Optional, will load from file if not provided
        "questions": [...]  # Question bank
    }
    """
    try:
        data = request.json
        category = data.get('category')
        
        if not category:
            return jsonify({'error': 'Category required'}), 400
        
        # Load items if not provided
        items = data.get('items')
        if not items:
            items = data_loader.get_category_data(category)
        
        if not items:
            return jsonify({'error': f'No data for category: {category}'}), 400
        
        # Get questions
        questions = data.get('questions', [])
        
        if not questions:
            return jsonify({'error': 'Questions required'}), 400
        
        # Start new game
        game_state = inference_engine.start_new_game(category, items, questions)
        
        # Store in active games
        session_id = game_state.session_id
        active_games[session_id] = game_state
        
        logger.info(f"New game started: {session_id}")
        
        return jsonify({
            'session_id': session_id,
            'category': category,
            'total_items': len(items),
            'message': 'Game started successfully'
        })
        
    except Exception as e:
        logger.error(f"Error starting game: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/question', methods=['POST'])
def get_next_question():
    """
    Get next question to ask
    
    Request body:
    {
        "session_id": "...",  # Optional if using items directly
        "items": [...],  # Optional
        "asked_questions": [...]  # Optional
    }
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        
        # If session_id provided, use existing game
        if session_id and session_id in active_games:
            game_state = active_games[session_id]
            inference_engine.current_game = game_state
        else:
            # Fallback: use provided items (for backward compatibility)
            items = data.get('items', [])
            asked_questions = data.get('asked_questions', [])
            
            if not items:
                return jsonify({'error': 'No active game or items provided'}), 400
        
        # Get next question
        question = inference_engine.get_next_question()
        
        if question is None:
            # Should stop asking
            return jsonify({
                'question': None,
                'ready_to_guess': True,
                'message': 'Ready to make prediction'
            })
        
        # Get current state
        game_state = inference_engine.current_game
        active_items = game_state.get_active_items()
        confidence = inference_engine.confidence_calculator.calculate(active_items)
        
        return jsonify({
            'question': question,
            'ready_to_guess': False,
            'confidence': int(confidence),
            'questions_asked': game_state.questions_asked,
            'active_items_count': len(active_items)
        })
        
    except Exception as e:
        logger.error(f"Error getting question: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/answer', methods=['POST'])
def process_answer():
    """
    Process user's answer
    
    Request body:
    {
        "session_id": "...",
        "answer": "yes" | "probably" | "dontknow" | "probablynot" | "no"
    }
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        answer = data.get('answer')
        
        if not session_id or session_id not in active_games:
            return jsonify({'error': 'Invalid or expired session'}), 400
        
        if not answer:
            return jsonify({'error': 'Answer required'}), 400
        
        # Get game state
        game_state = active_games[session_id]
        inference_engine.current_game = game_state
        
        # Process answer
        result = inference_engine.process_answer(answer)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error processing answer: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/filter', methods=['POST'])
def filter_items():
    """
    Filter items based on answer (backward compatible)
    
    Request body:
    {
        "items": [...],
        "question": {...},
        "answer": "..."
    }
    """
    try:
        data = request.json
        items_data = data.get('items', [])
        question = data.get('question')
        answer = data.get('answer')
        
        if not items_data or not question or not answer:
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Convert to Item objects
        from models.item_model import Item
        items = [Item.from_dict(item_dict) for item_dict in items_data]
        
        # Update probabilities
        updated_items = inference_engine.probability_manager.update_item_probability
        
        for item in items:
            item.probability = updated_items(item, question, answer)
        
        # Normalize
        inference_engine.probability_manager.normalize_probabilities(items)
        
        # Soft filter
        inference_engine.probability_manager.soft_filter(items)
        
        # Convert back to dicts
        filtered_items = [item.to_dict() for item in items if not item.eliminated]
        
        # Sort by probability
        filtered_items.sort(key=lambda x: x['probability'], reverse=True)
        
        return jsonify({
            'items': filtered_items
        })
        
    except Exception as e:
        logger.error(f"Error filtering items: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict', methods=['POST'])
def get_prediction():
    """
    Get final prediction
    
    Request body:
    {
        "session_id": "...",  # Optional
        "items": [...]  # Optional if session_id provided
    }
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        
        # Use session if available
        if session_id and session_id in active_games:
            game_state = active_games[session_id]
            inference_engine.current_game = game_state
            
            result = inference_engine.get_final_prediction()
            
            # Clean up session
            del active_games[session_id]
            
            return jsonify(result)
        else:
            # Fallback for backward compatibility
            items_data = data.get('items', [])
            
            if not items_data:
                return jsonify({'error': 'No session or items provided'}), 400
            
            from models.item_model import Item
            items = [Item.from_dict(item_dict) for item_dict in items_data]
            
            # Get best guess
            sorted_items = sorted(items, key=lambda x: x.probability, reverse=True)
            best_guess = sorted_items[0] if sorted_items else None
            
            if not best_guess:
                return jsonify({'error': 'No prediction possible'}), 400
            
            # Calculate confidence
            confidence = inference_engine.confidence_calculator.calculate(items)
            
            return jsonify({
                'prediction': best_guess.to_dict(),
                'confidence': int(confidence),
                'alternatives': [item.to_dict() for item in sorted_items[1:4]],
                'questions_asked': data.get('questions_asked', 0)
            })
            
    except Exception as e:
        logger.error(f"Error making prediction: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get session statistics"""
    try:
        stats = inference_engine.get_session_stats()
        data_stats = data_loader.get_data_stats()
        
        return jsonify({
            'session': stats,
            'data': data_stats,
            'active_games': len(active_games)
        })
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/load-data', methods=['POST'])
def load_data():
    """
    Load data into backend (backward compatible)
    Frontend can send data during initialization
    """
    try:
        data = request.json
        category = data.get('category')
        items = data.get('items', [])
        questions = data.get('questions', [])
        
        logger.info(f"Data loaded for {category}: {len(items)} items, {len(questions)} questions")
        
        return jsonify({
            'status': 'success',
            'message': f'Loaded {len(items)} items and {len(questions)} questions'
        })
        
    except Exception as e:
        logger.error(f"Error loading data: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting GeoAI Backend on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
