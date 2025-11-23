"""
Advanced AI Algorithm for GeoAI Game
Uses Information Gain and Bayesian Inference
"""

import numpy as np
from typing import List, Dict, Any, Optional


class AIAlgorithm:
    """
    Advanced AI Algorithm using Information Gain and Bayesian Inference
    """
    
    def __init__(self):
        self.answer_weights = {
            'yes': 1.0,
            'probably': 0.75,
            'dontknow': 0.5,
            'probablynot': 0.25,
            'no': 0.0
        }
    
    def calculate_entropy(self, items: List[Dict[str, Any]], attribute: str, value: Any) -> float:
        """
        Calculate entropy for information gain
        
        Args:
            items: List of possible items
            attribute: Attribute to check
            value: Value to compare
            
        Returns:
            Entropy value
        """
        if not items:
            return 0.0
        
        yes_count = sum(1 for item in items if item.get(attribute) == value)
        no_count = len(items) - yes_count
        total = len(items)
        
        if total == 0:
            return 0.0
        
        yes_ratio = yes_count / total
        no_ratio = no_count / total
        
        # Calculate entropy
        entropy = 0.0
        if yes_ratio > 0:
            entropy -= yes_ratio * np.log2(yes_ratio)
        if no_ratio > 0:
            entropy -= no_ratio * np.log2(no_ratio)
        
        return entropy
    
    def calculate_information_gain(
        self, 
        question: Dict[str, Any], 
        items: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate information gain for a question
        
        Args:
            question: Question dictionary with attribute, value, and weight
            items: List of possible items
            
        Returns:
            Information gain value
        """
        if not items:
            return 0.0
        
        # Count matching and non-matching items
        yes_count = sum(1 for item in items if item.get(question['attribute']) == question['value'])
        no_count = len(items) - yes_count
        total = len(items)
        
        if total == 0:
            return 0.0
        
        # Calculate balance (prefer 50/50 splits)
        yes_ratio = yes_count / total
        no_ratio = no_count / total
        balance = min(yes_ratio, no_ratio)
        
        # Weight by question importance
        weighted_gain = balance * question.get('weight', 1.0)
        
        return weighted_gain
    
    def select_best_question(
        self, 
        questions: List[Dict[str, Any]], 
        asked_questions: List[str],
        items: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Select the best question to ask next
        
        Args:
            questions: Available questions
            asked_questions: Questions already asked
            items: Current possible items
            
        Returns:
            Best question or None
        """
        # Filter out already asked questions
        available_questions = [
            q for q in questions 
            if q['question'] not in asked_questions
        ]
        
        if not available_questions:
            return None
        
        # Calculate information gain for each question
        best_question = None
        max_gain = -1
        
        for question in available_questions:
            gain = self.calculate_information_gain(question, items)
            
            if gain > max_gain:
                max_gain = gain
                best_question = question
        
        return best_question
    
    def update_probabilities(
        self, 
        items: List[Dict[str, Any]], 
        question: Dict[str, Any], 
        answer: str
    ) -> List[Dict[str, Any]]:
        """
        Update item probabilities based on answer using Bayesian inference
        
        Args:
            items: Current items with probabilities
            question: The question that was asked
            answer: User's answer
            
        Returns:
            Updated items with new probabilities
        """
        updated_items = []
        
        for item in items:
            matches = item.get(question['attribute']) == question['value']
            probability = item.get('probability', 1.0)
            
            # Update probability based on answer
            if answer == 'yes':
                probability = probability * 1.2 if matches else probability * 0.1
            elif answer == 'probably':
                probability = probability * 1.1 if matches else probability * 0.4
            elif answer == 'dontknow':
                probability = probability * 0.9
            elif answer == 'probablynot':
                probability = probability * 0.4 if matches else probability * 1.1
            elif answer == 'no':
                probability = probability * 0.1 if matches else probability * 1.2
            
            # Create updated item
            updated_item = item.copy()
            updated_item['probability'] = probability
            updated_items.append(updated_item)
        
        return updated_items
    
    def filter_items(
        self, 
        items: List[Dict[str, Any]], 
        question: Dict[str, Any], 
        answer: str
    ) -> List[Dict[str, Any]]:
        """
        Filter items based on answer with weighted approach
        
        Args:
            items: Current possible items
            question: The question that was asked
            answer: User's answer
            
        Returns:
            Filtered and sorted items
        """
        # Update probabilities first
        items = self.update_probabilities(items, question, answer)
        
        # Aggressive filtering for definite answers
        if answer == 'yes':
            items = [
                item for item in items 
                if item.get(question['attribute']) == question['value'] or item.get('probability', 0) > 0.15
            ]
        elif answer == 'no':
            items = [
                item for item in items 
                if item.get(question['attribute']) != question['value'] or item.get('probability', 0) > 0.15
            ]
        
        # Sort by probability
        items.sort(key=lambda x: x.get('probability', 0), reverse=True)
        
        return items
    
    def calculate_confidence(self, items: List[Dict[str, Any]]) -> int:
        """
        Calculate confidence in the top guess
        
        Args:
            items: Current possible items
            
        Returns:
            Confidence percentage (0-95)
        """
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
    
    def get_best_guess(self, items: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Get the best guess from remaining items
        
        Args:
            items: Current possible items
            
        Returns:
            Best guess item or None
        """
        if not items:
            return None
        
        # Sort by probability
        sorted_items = sorted(items, key=lambda x: x.get('probability', 0), reverse=True)
        
        return sorted_items[0]
    
    def should_stop_asking(
        self, 
        items: List[Dict[str, Any]], 
        questions_asked: int, 
        max_questions: int
    ) -> bool:
        """
        Determine if we should stop asking questions
        
        Args:
            items: Current possible items
            questions_asked: Number of questions asked
            max_questions: Maximum questions allowed
            
        Returns:
            True if should stop, False otherwise
        """
        # Stop if only one item left
        if len(items) <= 1:
            return True
        
        # Stop if max questions reached
        if questions_asked >= max_questions:
            return True
        
        # Stop if confidence is very high
        confidence = self.calculate_confidence(items)
        if confidence >= 90:
            return True
        
        # Stop if very few items left and many questions asked
        if len(items) <= 2 and questions_asked >= max_questions * 0.7:
            return True
        
        return False
    
    def get_statistics(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get statistics about current state
        
        Args:
            items: Current possible items
            
        Returns:
            Statistics dictionary
        """
        if not items:
            return {
                'item_count': 0,
                'confidence': 0,
                'top_probability': 0
            }
        
        total_prob = sum(item.get('probability', 1) for item in items)
        
        return {
            'item_count': len(items),
            'confidence': self.calculate_confidence(items),
            'top_probability': items[0].get('probability', 0),
            'total_probability': total_prob,
            'normalized_probabilities': [
                {
                    'name': item.get('name'),
                    'probability': (item.get('probability', 1) / total_prob * 100) if total_prob > 0 else 0
                }
                for item in items[:5]  # Top 5
            ]
        }