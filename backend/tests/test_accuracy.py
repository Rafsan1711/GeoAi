"""
Test Accuracy - Simulates game play with 'perfect' answers to measure true algorithm performance.
Pure Python, offline test to validate 95%+ accuracy target.
"""

import unittest
import json
import os
from typing import List, Dict, Tuple
from collections import defaultdict
import random

# Adjust path to import core logic
from core.inference_engine import InferenceEngine
from models.item_model import Item
from utils.data_loader import DataLoader
from backend.config import GAME_CONFIG

class MockFirebaseService:
    """Mock for FirebaseService to prevent real API calls during testing."""
    def save_game_state(self, game_state): pass
    def load_game_state(self, session_id): return None
    def delete_game_state(self, session_id): pass
    def log_game_result(self, *args, **kwargs): pass
    def update_question_effectiveness(self, *args, **kwargs): pass

class AccuracyTest(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Setup shared resources for all tests."""
        # Mock the Firebase Service for all engine instances
        InferenceEngine.firebase_service = MockFirebaseService()
        
        # Load real data and questions
        cls.data_loader = DataLoader(data_dir='data')
        cls.countries = cls.data_loader.get_category_data('country')
        
        # NOTE: Question bank is hardcoded in frontend's game.js in the original project,
        # but for backend testing, we'll load the full question list from a static/mock source 
        # or simplify:
        # Since we don't have a direct 'questions.json', we rely on the attributes present
        # in the countries data itself to generate a list of simple test questions.
        cls.question_bank = cls._generate_test_questions(cls.countries)
        
        if not cls.countries or not cls.question_bank:
            raise Exception("Cannot run tests: Data or question bank is missing.")

    @staticmethod
    def _generate_test_questions(items: List[Dict]) -> List[Dict]:
        """Generates a comprehensive list of test questions from item attributes."""
        questions = []
        attributes_to_test = ['continent', 'region', 'landlocked', 'isIsland', 'population', 'language', 'mainReligion', 'hasMountains']
        weights = {'continent': 1.0, 'language': 0.9, 'population': 0.8}
        
        for attr in attributes_to_test:
            all_values = set()
            for item in items:
                val = item.get(attr)
                if val is not None:
                    if isinstance(val, list):
                        all_values.update(val)
                    else:
                        all_values.add(val)
            
            for value in all_values:
                q = {
                    'question': f"Is the country's {attr} {value}?",
                    'attribute': attr,
                    'value': value,
                    'weight': weights.get(attr, 0.7)
                }
                questions.append(q)
        
        return questions

    def _simulate_game(self, target_country: str, max_qs: int = GAME_CONFIG['max_questions']) -> Tuple[str, float, int, bool]:
        """Simulates a game with perfect answers for a target country."""
        engine = InferenceEngine()
        target = next(item for item in self.countries if item['name'] == target_country)
        
        game_state = engine.start_new_game('country', self.countries, self.question_bank)
        
        # Simulation Loop
        for i in range(max_qs):
            question = engine.get_next_question(game_state)
            
            if question is None:
                break
                
            # Simulate perfect answer
            item_instance = Item.from_dict(target)
            matches = item_instance.matches_question(question)
            answer = 'yes' if matches else 'no'
            
            engine.process_answer(game_state, answer)
            
            # Check for immediate prediction possibility (high confidence)
            active_items = game_state.get_active_items()
            confidence = engine.confidence_calculator.calculate(active_items)
            
            if engine.confidence_calculator.should_make_guess(confidence, game_state.questions_asked):
                break
            
        # Final Prediction
        result = engine.get_final_prediction(game_state)
        final_guess = result['prediction']['name'] if result['prediction'] else "None"
        confidence = result['confidence']
        questions_asked = result['questions_asked']
        is_correct = final_guess == target_country
        
        return final_guess, confidence, questions_asked, is_correct

    # --- TEST CASES ---
    
    def test_overall_accuracy_target(self):
        """Test a random sample of 20 countries to ensure 95%+ overall accuracy."""
        test_sample_size = 20
        random.seed(42) # Ensure reproducible results
        test_targets = random.sample([c['name'] for c in self.countries], min(test_sample_size, len(self.countries)))
        
        results = []
        for target in test_targets:
            final_guess, confidence, qs_asked, is_correct = self._simulate_game(target, max_qs=35)
            results.append({
                'target': target, 
                'guess': final_guess, 
                'correct': is_correct, 
                'qs': qs_asked, 
                'conf': confidence
            })
            print(f"Test {target}: Correct={is_correct}, Qs={qs_asked}, Conf={confidence}%")

        correct_count = sum(r['correct'] for r in results)
        accuracy = (correct_count / len(results)) * 100
        avg_qs = sum(r['qs'] for r in results) / len(results)
        
        print("\n--- Summary ---")
        print(f"Tested {len(results)} samples.")
        print(f"Accuracy: {accuracy:.2f}%")
        print(f"Avg Questions: {avg_qs:.2f}")
        
        # CRITICAL ASSERTION: The core goal of the task
        self.assertGreaterEqual(accuracy, 95.0, f"Target accuracy of 95% not met! Achieved {accuracy:.2f}%.")
        self.assertLessEqual(avg_qs, 30.0, f"Average questions too high: {avg_qs:.2f} (Target < 30).")

    def test_similar_countries(self):
        """Test discrimination between highly similar countries (e.g., India/Pakistan/Bangladesh)."""
        test_pairs = {
            "Bangladesh": "India",
            "Spain": "Portugal",
            "Canada": "United States",
            "Switzerland": "Austria"
        }
        
        for target, similar in test_pairs.items():
            final_guess, confidence, qs_asked, is_correct = self._simulate_game(target, max_qs=40)
            
            self.assertTrue(is_correct, f"Failed to discriminate {target} from {similar}.")
            self.assertGreaterEqual(qs_asked, 5, f"Guessed {target} too early (Q{qs_asked}) without enough data.")

    def test_early_stop_condition(self):
        """Ensure that early high-confidence guesses work correctly."""
        # Target a country with very distinct features (e.g., Vatican City)
        final_guess, confidence, qs_asked, is_correct = self._simulate_game("Vatican City", max_qs=50)
        
        self.assertTrue(is_correct, "Failed to guess Vatican City correctly.")
        self.assertLessEqual(qs_asked, 8, f"Vatican City should be guessed very early (Q{qs_asked}).")
        self.assertGreaterEqual(confidence, GAME_CONFIG['confidence_threshold_stage_1'], "Confidence check failed for early stop.")

if __name__ == '__main__':
    unittest.main()
