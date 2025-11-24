from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from collections import defaultdict
import json
import math

app = Flask(__name__)
CORS(app)

class AdvancedAIEngine:
    """
    Advanced AI Engine using multiple techniques:
    1. Information Gain (Entropy-based)
    2. Bayesian Inference
    3. Decision Tree Optimization
    4. Weighted Probability Distribution
    5. Adaptive Question Selection
    """
    
    def __init__(self):
        self.answer_weights = {
            'yes': 1.0,
            'probably': 0.75,
            'dontknow': 0.5,
            'probablynot': 0.25,
            'no': 0.0
        }
        
        # Cache for performance
        self.entropy_cache = {}
        
    def calculate_entropy(self, items, attribute):
        """Calculate Shannon entropy for an attribute"""
        if not items:
            return 0
        
        # Count unique values
        value_counts = defaultdict(int)
        for item in items:
            value = item.get(attribute)
            if value is not None:
                value_counts[value] += 1
        
        total = len(items)
        entropy = 0
        
        for count in value_counts.values():
            if count > 0:
                probability = count / total
                entropy -= probability * math.log2(probability)
        
        return entropy
    
    def calculate_information_gain(self, items, question):
        """Calculate information gain using entropy"""
        if not items:
            return 0
        
        attribute = question['attribute']
        value = question['value']
        
        # Initial entropy
        initial_entropy = self.calculate_entropy(items, attribute)
        
        # Split items
        matching = [item for item in items if item.get(attribute) == value]
        non_matching = [item for item in items if item.get(attribute) != value]
        
        # Calculate weighted entropy after split
        total = len(items)
        if total == 0:
            return 0
        
        weighted_entropy = 0
        if matching:
            weighted_entropy += (len(matching) / total) * self.calculate_entropy(matching, attribute)
        if non_matching:
            weighted_entropy += (len(non_matching) / total) * self.calculate_entropy(non_matching, attribute)
        
        # Information gain
        info_gain = initial_entropy - weighted_entropy
        
        # Balance factor - prefer questions that split evenly
        if matching and non_matching:
            balance = min(len(matching), len(non_matching)) / max(len(matching), len(non_matching))
            info_gain *= (1 + balance) / 2
        
        return info_gain * question.get('weight', 1.0)
    
    def calculate_gini_impurity(self, items, attribute):
        """Calculate Gini impurity for an attribute"""
        if not items:
            return 0
        
        value_counts = defaultdict(int)
        for item in items:
            value = item.get(attribute)
            if value is not None:
                value_counts[value] += 1
        
        total = len(items)
        impurity = 1.0
        
        for count in value_counts.values():
            probability = count / total
            impurity -= probability ** 2
        
        return impurity
    
    def update_bayesian_probabilities(self, items, question, answer):
        """Update item probabilities using Bayesian inference"""
        attribute = question['attribute']
        value = question['value']
        answer_weight = self.answer_weights.get(answer, 0.5)
        
        updated_items = []
        
        for item in items:
            matches = item.get(attribute) == value
            probability = item.get('probability', 1.0)
            
            # Bayesian update
            if answer == 'yes':
                if matches:
                    probability *= 1.5  # Strong boost
                else:
                    probability *= 0.05  # Strong penalty
            elif answer == 'probably':
                if matches:
                    probability *= 1.2
                else:
                    probability *= 0.3
            elif answer == 'dontknow':
                probability *= 0.85  # Slight penalty for uncertainty
            elif answer == 'probablynot':
                if matches:
                    probability *= 0.3
                else:
                    probability *= 1.2
            elif answer == 'no':
                if matches:
                    probability *= 0.05  # Strong penalty
                else:
                    probability *= 1.5  # Strong boost
            
            # Normalize probability
            probability = max(0.001, min(probability, 10.0))
            
            item['probability'] = probability
            updated_items.append(item)
        
        return updated_items
    
    def filter_items_advanced(self, items, question, answer):
        """Advanced filtering with multiple strategies"""
        # Update probabilities
        items = self.update_bayesian_probabilities(items, question, answer)
        
        # Sort by probability
        items.sort(key=lambda x: x.get('probability', 0), reverse=True)
        
        # Aggressive filtering for definite answers
        if answer in ['yes', 'no']:
            # Keep top candidates and some low-probability ones (hedge strategy)
            total_prob = sum(item.get('probability', 0) for item in items)
            cumulative = 0
            filtered = []
            
            for item in items:
                cumulative += item.get('probability', 0)
                filtered.append(item)
                
                # Keep items until we have 95% of probability mass
                if cumulative / total_prob > 0.95:
                    break
            
            # Always keep at least top 3 and at most 50% of items
            min_keep = min(3, len(items))
            max_keep = max(min_keep, len(items) // 2)
            
            items = filtered[:max_keep] if len(filtered) > min_keep else items[:max_keep]
        
        # Renormalize probabilities
        total_prob = sum(item.get('probability', 0) for item in items)
        if total_prob > 0:
            for item in items:
                item['probability'] = item.get('probability', 0) / total_prob
        
        return items
    
    def select_best_question(self, questions, asked_questions, items):
        """Select the best question using multiple criteria"""
        available_questions = [
            q for q in questions 
            if q['question'] not in asked_questions
        ]
        
        if not available_questions or not items:
            return None
        
        best_question = None
        max_score = -1
        
        for question in available_questions:
            # Calculate information gain
            info_gain = self.calculate_information_gain(items, question)
            
            # Calculate Gini impurity reduction
            attribute = question['attribute']
            value = question['value']
            
            matching = [item for item in items if item.get(attribute) == value]
            non_matching = [item for item in items if item.get(attribute) != value]
            
            initial_gini = self.calculate_gini_impurity(items, attribute)
            
            weighted_gini = 0
            total = len(items)
            if total > 0:
                if matching:
                    weighted_gini += (len(matching) / total) * self.calculate_gini_impurity(matching, attribute)
                if non_matching:
                    weighted_gini += (len(non_matching) / total) * self.calculate_gini_impurity(non_matching, attribute)
            
            gini_reduction = initial_gini - weighted_gini
            
            # Combined score
            score = (info_gain * 0.7) + (gini_reduction * 0.3)
            
            # Boost for balanced splits
            if matching and non_matching:
                balance = min(len(matching), len(non_matching)) / max(len(matching), len(non_matching))
                score *= (1 + balance * 0.5)
            
            # Apply question weight
            score *= question.get('weight', 1.0)
            
            if score > max_score:
                max_score = score
                best_question = question
        
        return best_question
    
    def calculate_confidence(self, items):
        """Calculate confidence in top prediction"""
        if not items:
            return 0
        if len(items) == 1:
            return 95
        
        # Normalize probabilities
        total_prob = sum(item.get('probability', 1) for item in items)
        if total_prob == 0:
            return 0
        
        top_prob = items[0].get('probability', 1)
        confidence = min(95, int((top_prob / total_prob) * 100))
        
        return confidence
    
    def get_best_guess(self, items):
        """Get the best guess from remaining items"""
        if not items:
            return None
        
        # Sort by probability
        sorted_items = sorted(items, key=lambda x: x.get('probability', 0), reverse=True)
        return sorted_items[0]
    
    def should_stop_asking(self, items, questions_asked, max_questions):
        """Determine if we should stop asking questions"""
        if len(items) <= 1:
            return True
        
        if questions_asked >= max_questions:
            return True
        
        confidence = self.calculate_confidence(items)
        if confidence >= 90:
            return True
        
        # Stop if we have very few items left and good confidence
        if len(items) <= 3 and confidence >= 75 and questions_asked >= max_questions * 0.6:
            return True
        
        return False


# Global AI engine instance
ai_engine = AdvancedAIEngine()

# Store game data (in production, use a database)
game_data = {
    'country': [],
    'city': [],
    'place': []
}

question_banks = {
    'country': [],
    'city': [],
    'place': []
}


@app.route('/')
def home():
    return jsonify({
        'status': 'online',
        'message': 'GeoAI Advanced Backend API',
        'version': '2.0',
        'endpoints': {
            'health': '/health',
            'question': '/api/question (POST)',
            'filter': '/api/filter (POST)',
            'predict': '/api/predict (POST)',
            'data': '/api/data (GET)',
            'stats': '/api/stats (GET)'
        }
    })


@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'data_loaded': {
            'countries': len(game_data.get('country', [])),
            'cities': len(game_data.get('city', [])),
            'places': len(game_data.get('place', []))
        }
    })


@app.route('/api/question', methods=['POST'])
def get_next_question():
    """Get the next best question to ask"""
    try:
        data = request.json
        category = data.get('category')
        asked_questions = data.get('asked_questions', [])
        items = data.get('items', [])
        
        if not category or not items:
            return jsonify({'error': 'Invalid request'}), 400
        
        questions = question_banks.get(category, [])
        
        # Select best question
        question = ai_engine.select_best_question(
            questions,
            asked_questions,
            items
        )
        
        if not question:
            return jsonify({'question': None})
        
        return jsonify({
            'question': question,
            'remaining_items': len(items),
            'confidence': ai_engine.calculate_confidence(items)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/filter', methods=['POST'])
def filter_items():
    """Filter items based on answer"""
    try:
        data = request.json
        items = data.get('items', [])
        question = data.get('question')
        answer = data.get('answer')
        
        if not items or not question or not answer:
            return jsonify({'error': 'Invalid request'}), 400
        
        # Filter items
        filtered_items = ai_engine.filter_items_advanced(
            items,
            question,
            answer
        )
        
        return jsonify({
            'items': filtered_items,
            'count': len(filtered_items),
            'confidence': ai_engine.calculate_confidence(filtered_items)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/predict', methods=['POST'])
def predict():
    """Get prediction based on current state"""
    try:
        data = request.json
        items = data.get('items', [])
        questions_asked = data.get('questions_asked', 0)
        
        if not items:
            return jsonify({'error': 'No items provided'}), 400
        
        best_guess = ai_engine.get_best_guess(items)
        confidence = ai_engine.calculate_confidence(items)
        should_stop = ai_engine.should_stop_asking(items, questions_asked, 15)
        
        return jsonify({
            'prediction': best_guess,
            'confidence': confidence,
            'should_stop': should_stop,
            'alternatives': items[:5]  # Top 5 alternatives
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/data', methods=['GET'])
def get_data():
    """Get game data"""
    category = request.args.get('category')
    
    if category:
        return jsonify({
            'category': category,
            'data': game_data.get(category, [])
        })
    
    return jsonify(game_data)


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics"""
    return jsonify({
        'total_countries': len(game_data.get('country', [])),
        'total_cities': len(game_data.get('city', [])),
        'total_places': len(game_data.get('place', [])),
        'total_questions': {
            'country': len(question_banks.get('country', [])),
            'city': len(question_banks.get('city', [])),
            'place': len(question_banks.get('place', []))
        }
    })


@app.route('/api/load-data', methods=['POST'])
def load_data():
    """Load data from frontend"""
    try:
        data = request.json
        category = data.get('category')
        items = data.get('items', [])
        questions = data.get('questions', [])
        
        if category:
            game_data[category] = items
            question_banks[category] = questions
            
            return jsonify({
                'success': True,
                'message': f'Loaded {len(items)} items and {len(questions)} questions for {category}'
            })
        
        return jsonify({'error': 'Invalid category'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Load initial data if available
    try:
        with open('data.json', 'r') as f:
            loaded_data = json.load(f)
            game_data.update(loaded_data.get('data', {}))
            question_banks.update(loaded_data.get('questions', {}))
            print("✅ Data loaded from file")
    except FileNotFoundError:
        print("⚠️  No data file found, will use frontend data")
    
    # Run the app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
