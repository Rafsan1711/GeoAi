import os
import json
import math
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import defaultdict

# কনফিগারেশন এবং লগিং সেটআপ
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------
# CONSTANTS & CONFIGURATIONS
# ---------------------------------------------------------

# কোন অ্যাট্রিবিউটগুলো প্রশ্ন করার জন্য উপযুক্ত এবং তাদের গুরুত্ব (Weight)
ATTRIBUTE_CONFIG = {
    'continent': {'weight': 1.0, 'type': 'categorical', 'text': 'Is it located in {}?'},
    'region': {'weight': 0.9, 'type': 'categorical', 'text': 'Is it in the {} region?'},
    'landlocked': {'weight': 0.8, 'type': 'boolean', 'text': 'Is it a landlocked country?'},
    'hasCoast': {'weight': 0.8, 'type': 'boolean', 'text': 'Does it have a coastline?'},
    'isIsland': {'weight': 0.9, 'type': 'boolean', 'text': 'Is it an island nation?'},
    'hasMountains': {'weight': 0.6, 'type': 'boolean', 'text': 'Is it known for having mountains?'},
    'driveSide': {'weight': 0.7, 'type': 'categorical', 'text': 'Do cars drive on the {}?'},
    'government': {'weight': 0.6, 'type': 'categorical', 'text': 'Is the government a {}?'},
    'mainReligion': {'weight': 0.5, 'type': 'categorical', 'text': 'Is the main religion {}?'},
    'climate': {'weight': 0.7, 'type': 'categorical', 'text': 'Is the climate primarily {}?'},
    'population': {'weight': 0.7, 'type': 'categorical', 'text': 'Does it have a {} population?'},
    'flagColors': {'weight': 0.6, 'type': 'list', 'text': 'Does the flag contain the color {}?'},
    'famousFor': {'weight': 0.5, 'type': 'categorical', 'text': 'Is it famous for {}?'}
}

# উত্তরের ওজনের ম্যাট্রিক্স (Probabilistic Logic এর জন্য)
ANSWER_WEIGHTS = {
    'yes': {'match': 2.5, 'mismatch': 0.05},        # হ্যা বললে ম্যাচিং আইটেমের স্কোর অনেক বাড়বে
    'probably': {'match': 1.5, 'mismatch': 0.4},
    'dontknow': {'match': 1.0, 'mismatch': 1.0},    # জানি না বললে কোনো পরিবর্তন হবে না
    'probablynot': {'match': 0.4, 'mismatch': 1.5},
    'no': {'match': 0.05, 'mismatch': 2.5}          # না বললে ম্যাচিং আইটেমের স্কোর অনেক কমবে
}

# ---------------------------------------------------------
# CORE AI ENGINE CLASSES
# ---------------------------------------------------------

class QuestionGenerator:
    """
    ডেটা থেকে হিউম্যান-রিডেবল প্রশ্ন তৈরি করার ক্লাস
    """
    @staticmethod
    def generate_question_text(attribute, value):
        config = ATTRIBUTE_CONFIG.get(attribute)
        if not config:
            return f"Is {attribute} {value}?"
        
        template = config['text']
        
        # ফরম্যাটিং সুন্দর করার জন্য কিছু লজিক
        if attribute == 'continent':
            # উত্তর আমেরিকা/দক্ষিণ আমেরিকার স্পেস ঠিক করা
            val_str = str(value).replace('northamerica', 'North America').replace('southamerica', 'South America').title()
            return template.format(val_str)
        
        if attribute == 'driveSide':
            return template.format(value + " side")
            
        if isinstance(value, str):
            return template.format(value.capitalize())
            
        return template.format(value)

class InferenceEngine:
    """
    Bayesian Inference এবং Entropy ক্যালকুলেশন হ্যান্ডেল করে
    """
    
    def calculate_entropy(self, items):
        """Shannon Entropy ক্যালকুলেট করে (Data Purity মাপার জন্য)"""
        if not items:
            return 0
        
        total = len(items)
        probability_mass = sum(item.get('probability', 1.0) for item in items)
        
        if probability_mass == 0:
            return 0
            
        entropy = 0
        for item in items:
            prob = item.get('probability', 1.0) / probability_mass
            if prob > 0:
                entropy -= prob * math.log2(prob)
                
        return entropy

    def get_best_question(self, items, asked_attributes):
        """
        Information Gain (Entropy) ব্যবহার করে সেরা প্রশ্ন খুঁজে বের করে।
        এটি প্রতিটি অ্যাট্রিবিউট চেক করে দেখে কোন প্রশ্ন করলে ডেটা সবথেকে ভালো ভাগ হবে।
        """
        best_question = None
        max_info_gain = -1
        
        total_mass = sum(item.get('probability', 1.0) for item in items)
        
        # সব অ্যাট্রিবিউট চেক করা
        for attr, config in ATTRIBUTE_CONFIG.items():
            # ইউনিক ভ্যালুগুলো বের করা
            unique_values = set()
            for item in items:
                val = item.get(attr)
                if isinstance(val, list):
                    for v in val:
                        unique_values.add(v)
                elif val is not None:
                    unique_values.add(val)
            
            # প্রতিটি ভ্যালুর জন্য Information Gain হিসাব করা
            for val in unique_values:
                # যদি এই প্রশ্ন আগে করা হয়ে থাকে তবে স্কিপ
                question_id = f"{attr}:{val}"
                if question_id in asked_attributes:
                    continue

                # আইটেমগুলো ভাগ করা (Matching vs Non-Matching)
                match_mass = 0
                non_match_mass = 0
                
                for item in items:
                    prob = item.get('probability', 1.0)
                    item_val = item.get(attr)
                    
                    is_match = False
                    if isinstance(item_val, list):
                        is_match = val in item_val
                    else:
                        is_match = item_val == val
                        
                    if is_match:
                        match_mass += prob
                    else:
                        non_match_mass += prob
                
                # যদি কোনো প্রশ্ন সবাইকে একদিকে নিয়ে যায়, তবে সেটা ভালো প্রশ্ন না
                if match_mass == 0 or non_match_mass == 0:
                    continue

                # Entropy Calculation
                p_match = match_mass / total_mass
                p_non_match = non_match_mass / total_mass
                
                # Balance Factor (আমরা চাই প্রশ্নটি যেন ৫০-৫০ ভাগে ভাগ করে)
                balance = 1.0 - abs(p_match - p_non_match)
                
                # Weighted Score
                info_gain = balance * config['weight']
                
                if info_gain > max_info_gain:
                    max_info_gain = info_gain
                    best_question = {
                        'attribute': attr,
                        'value': val,
                        'question': QuestionGenerator.generate_question_text(attr, val),
                        'id': question_id
                    }
                    
        return best_question

    def update_probabilities(self, items, question, answer):
        """
        ইউজারের উত্তরের ওপর ভিত্তি করে প্রতিটি আইটেমের Probability আপডেট করে।
        এটি 'Soft Filtering' করে, অর্থাৎ ভুল উত্তরে কাউকে পুরোপুরি বাদ দেয় না।
        """
        attr = question['attribute']
        val = question['value']
        weights = ANSWER_WEIGHTS.get(answer, ANSWER_WEIGHTS['dontknow'])
        
        updated_items = []
        
        for item in items:
            item_val = item.get(attr)
            current_prob = item.get('probability', 1.0)
            
            # চেক করি ম্যাচ করে কি না
            is_match = False
            if isinstance(item_val, list):
                is_match = val in item_val
            else:
                is_match = item_val == val
            
            # Bayesian Update
            if is_match:
                new_prob = current_prob * weights['match']
            else:
                new_prob = current_prob * weights['mismatch']
            
            # Probability বাউন্ডারি চেক (০ বা অসীম হওয়া রোধ করতে)
            new_prob = max(1e-10, min(new_prob, 1000.0))
            
            item['probability'] = new_prob
            updated_items.append(item)
            
        # নরমালাইজেশন (যাতে সব মিলিয়ে ১০০% এর মতো থাকে, ক্যালকুলেশনের সুবিধার জন্য)
        total_prob = sum(i['probability'] for i in updated_items)
        if total_prob > 0:
            for item in updated_items:
                item['probability'] = (item['probability'] / total_prob) * 100.0
                
        # Probability অনুযায়ী সর্ট করা
        updated_items.sort(key=lambda x: x['probability'], reverse=True)
        
        return updated_items

# গ্লোবাল ইনস্ট্যান্স
inference_engine = InferenceEngine()

# ---------------------------------------------------------
# FLASK ROUTES
# ---------------------------------------------------------

@app.route('/api/question', methods=['POST'])
def get_next_question():
    try:
        data = request.json
        items = data.get('items', [])
        asked_questions = set(data.get('asked_questions', [])) # এখানে আমরা ID লিস্ট আশা করছি
        
        # আইটেম না থাকলে এরর
        if not items:
            return jsonify({'error': 'No items provided'}), 400
            
        # ১. যদি মাত্র ১টি আইটেম বাকি থাকে এবং কনফিডেন্স হাই হয়
        top_item = items[0]
        confidence = top_item.get('probability', 0)
        
        # যদি কনফিডেন্স ৮০% এর বেশি হয় অথবা আইটেম সংখ্যা খুব কমে যায়
        remaining_count = sum(1 for i in items if i.get('probability', 0) > 1.0)
        
        if (confidence > 85) or (remaining_count <= 1 and confidence > 50):
            return jsonify({
                'question': None,
                'ready_to_guess': True,
                'guess': top_item
            })

        # ২. সেরা প্রশ্নটি খুঁজে বের করা
        question = inference_engine.get_best_question(items, asked_questions)
        
        if not question:
            # প্রশ্ন শেষ হয়ে গেলে গেস করা
            return jsonify({
                'question': None,
                'ready_to_guess': True,
                'guess': top_item
            })
            
        return jsonify({
            'question': question,
            'ready_to_guess': False,
            'confidence': confidence
        })

    except Exception as e:
        logger.error(f"Error getting question: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/filter', methods=['POST'])
def filter_items():
    try:
        data = request.json
        items = data.get('items', [])
        question = data.get('question')
        answer = data.get('answer')
        
        if not items or not question:
            return jsonify({'error': 'Invalid request data'}), 400
            
        # ১. Probability আপডেট করা
        updated_items = inference_engine.update_probabilities(items, question, answer)
        
        # ২. খুব কম Probability এর আইটেমগুলো বাদ দেওয়া (অপ্টিমাইজেশনের জন্য)
        # কিন্তু অন্তত ৩টা আইটেম রাখবোই, যাতে রিকভার করা যায়
        cutoff_threshold = 0.5 # ০.৫% এর নিচে হলে বাদ
        filtered_items = [i for i in updated_items if i['probability'] > cutoff_threshold]
        
        # যদি বেশি ফিল্টার হয়ে যায়, তাহলে টপ ৫টা রাখি
        if len(filtered_items) < 3:
            filtered_items = updated_items[:5]
            
        return jsonify({
            'items': filtered_items
        })

    except Exception as e:
        logger.error(f"Error filtering: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    ফাইনাল প্রেডিকশন পাওয়ার জন্য
    """
    try:
        data = request.json
        items = data.get('items', [])
        
        if not items:
            return jsonify({'error': 'No items'}), 400
            
        # সর্ট করা আছে ধরে নিচ্ছি, কারণ ফিল্টারে সর্ট হয়
        best_guess = items[0]
        confidence = items[0].get('probability', 0)
        
        return jsonify({
            'prediction': best_guess,
            'confidence': int(confidence)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'advanced_ai_active', 'version': '3.0'})

# গেম ডেটা লোড করার জন্য (Frontend থেকে পাঠানো হয়)
@app.route('/api/load-data', methods=['POST'])
def load_data():
    return jsonify({'status': 'success', 'message': 'Data processed stateless-ly'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)