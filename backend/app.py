"""
Flask API Server for GeoAI Game
Provides endpoints for the AI algorithm
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from algorithm import AIAlgorithm

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize AI Algorithm
ai_algorithm = AIAlgorithm()

# Load data
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')


def load_json_data(filename):
    """Load JSON data from file"""
    filepath = os.path.join(DATA_DIR, filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return []


# Load all data at startup
COUNTRIES = load_json_data('countries.json')
CITIES = load_json_data('cities.json')
PLACES = load_json_data('places.json')

DATA = {
    'country': COUNTRIES,
    'city': CITIES,
    'place': PLACES
}

# Question banks
QUESTION_BANKS = {
    'country': [
        {"question": "Is it located in Asia?", "attribute": "continent", "value": "asia", "weight": 1.0},
        {"question": "Is it located in Europe?", "attribute": "continent", "value": "europe", "weight": 1.0},
        {"question": "Is it located in Africa?", "attribute": "continent", "value": "africa", "weight": 1.0},
        {"question": "Is it located in North America?", "attribute": "continent", "value": "northamerica", "weight": 1.0},
        {"question": "Is it located in South America?", "attribute": "continent", "value": "southamerica", "weight": 1.0},
        {"question": "Is it located in Oceania?", "attribute": "continent", "value": "oceania", "weight": 1.0},
        {"question": "Does this country have a coastline?", "attribute": "hasCoast", "value": True, "weight": 0.7},
        {"question": "Does it have major mountain ranges?", "attribute": "hasMountains", "value": True, "weight": 0.6},
        {"question": "Is it an island nation?", "attribute": "isIsland", "value": True, "weight": 0.8},
        {"question": "Does it have a very large population (over 200 million)?", "attribute": "population", "value": "verylarge", "weight": 0.85},
        {"question": "Does it have a tropical climate?", "attribute": "climate", "value": "tropical", "weight": 0.65},
    ],
    'city': [
        {"question": "Is it a capital city?", "attribute": "isCapital", "value": True, "weight": 0.85},
        {"question": "Is it located in Asia?", "attribute": "continent", "value": "asia", "weight": 1.0},
        {"question": "Is it located in Europe?", "attribute": "continent", "value": "europe", "weight": 1.0},
        {"question": "Does a major river run through it?", "attribute": "hasRiver", "value": True, "weight": 0.7},
        {"question": "Is it a very large city (over 10 million people)?", "attribute": "size", "value": "verylarge", "weight": 0.8},
    ],
    'place': [
        {"question": "Is it located in Asia?", "attribute": "continent", "value": "asia", "weight": 1.0},
        {"question": "Is it located in Europe?", "attribute": "continent", "value": "europe", "weight": 1.0},
        {"question": "Is it located in Africa?", "attribute": "continent", "value": "africa", "weight": 1.0},
        {"question": "Is it a monument or memorial?", "attribute": "type", "value": "monument", "weight": 0.8},
        {"question": "Is it from ancient times (over 2000 years old)?", "attribute": "age", "value": "ancient", "weight": 0.85},
        {"question": "Is it a completely natural place (not man-made)?", "attribute": "isNatural", "value": True, "weight": 0.85},
    ]
}


@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'message': 'GeoAI API Server',
        'version': '2.0.0',
        'endpoints': {
            '/api/question': 'POST - Get next question',
            '/api/predict': 'POST - Get prediction',
            '/api/data/<category>': 'GET - Get data for category',
            '/api/stats': 'GET - Get statistics'
        }
    })


@app.route('/api/question', methods=['POST'])
def get_question():
    """
    Get the next best question to ask
    
    Request body:
    {
        "category": "country|city|place",
        "answers": [...],
        "possibleItems": [...]
    }
    """
    try:
        data = request.get_json()
        
        category = data.get('category')
        answers = data.get('answers', [])
        possible_items = data.get('possibleItems', [])
        
        if not category or category not in DATA:
            return jsonify({'error': 'Invalid category'}), 400
        
        # Get items if not provided
        if not possible_items:
            possible_items = DATA[category]
        
        # Get asked questions
        asked_questions = [ans['question'] for ans in answers]
        
        # Get question bank
        questions = QUESTION_BANKS.get(category, [])
        
        # Select best question
        best_question = ai_algorithm.select_best_question(
            questions,
            asked_questions,
            possible_items
        )
        
        if not best_question:
            return jsonify({'error': 'No more questions available'}), 404
        
        # Calculate current confidence
        confidence = ai_algorithm.calculate_confidence(possible_items)
        
        return jsonify({
            'question': best_question,
            'confidence': confidence,
            'remaining_items': len(possible_items)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Get prediction based on answers
    
    Request body:
    {
        "category": "country|city|place",
        "answers": [...]
    }
    """
    try:
        data = request.get_json()
        
        category = data.get('category')
        answers = data.get('answers', [])
        
        if not category or category not in DATA:
            return jsonify({'error': 'Invalid category'}), 400
        
        # Start with all items
        possible_items = [{'probability': 1.0, **item} for item in DATA[category]]
        
        # Get questions
        questions = QUESTION_BANKS.get(category, [])
        question_dict = {q['question']: q for q in questions}
        
        # Apply each answer to filter items
        for answer_data in answers:
            question_text = answer_data.get('question')
            answer = answer_data.get('answer')
            
            if question_text in question_dict:
                question = question_dict[question_text]
                possible_items = ai_algorithm.filter_items(
                    possible_items,
                    question,
                    answer
                )
        
        # Get best guess
        best_guess = ai_algorithm.get_best_guess(possible_items)
        confidence = ai_algorithm.calculate_confidence(possible_items)
        
        return jsonify({
            'prediction': best_guess,
            'confidence': confidence,
            'possible_matches': len(possible_items),
            'top_matches': possible_items[:3] if len(possible_items) > 1 else []
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/data/<category>', methods=['GET'])
def get_data(category):
    """Get all data for a specific category"""
    if category not in DATA:
        return jsonify({'error': 'Invalid category'}), 400
    
    return jsonify({
        'category': category,
        'count': len(DATA[category]),
        'data': DATA[category]
    })


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get overall statistics"""
    return jsonify({
        'total_countries': len(COUNTRIES),
        'total_cities': len(CITIES),
        'total_places': len(PLACES),
        'total_items': len(COUNTRIES) + len(CITIES) + len(PLACES),
        'categories': list(DATA.keys())
    })


@app.route('/api/filter', methods=['POST'])
def filter_items():
    """
    Filter items based on a single answer
    
    Request body:
    {
        "items": [...],
        "question": {...},
        "answer": "yes|probably|dontknow|probablynot|no"
    }
    """
    try:
        data = request.get_json()
        
        items = data.get('items', [])
        question = data.get('question')
        answer = data.get('answer')
        
        if not items or not question or not answer:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Filter items
        filtered_items = ai_algorithm.filter_items(items, question, answer)
        
        # Get statistics
        stats = ai_algorithm.get_statistics(filtered_items)
        
        return jsonify({
            'filtered_items': filtered_items,
            'statistics': stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # For local development
    app.run(debug=True, host='0.0.0.0', port=5000)