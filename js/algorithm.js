// algorithm.js - Enhanced AI Algorithm with Full Array Support

class AIEngine {
    constructor() {
        this.answerWeights = {
            'yes': 1.0,
            'probably': 0.75,
            'dontknow': 0.5,
            'probablynot': 0.25,
            'no': 0.0
        };
    }

    /**
     * Enhanced match checker - handles Strings, Booleans, Numbers, and Arrays
     */
    checkMatch(itemValue, questionValue) {
        // Handle undefined or null
        if (itemValue === undefined || itemValue === null) return false;

        // 1. If item attribute is an Array (e.g., famousFor: ['Cricket', 'Tea'])
        if (Array.isArray(itemValue)) {
            // Case-insensitive check if array includes the question value
            return itemValue.some(v => {
                if (typeof v === 'string' && typeof questionValue === 'string') {
                    return v.toLowerCase().trim() === questionValue.toLowerCase().trim();
                }
                return v === questionValue;
            });
        }

        // 2. If item attribute is a String
        if (typeof itemValue === 'string' && typeof questionValue === 'string') {
            return itemValue.toLowerCase().trim() === questionValue.toLowerCase().trim();
        }

        // 3. If item attribute is Boolean or Number
        return itemValue === questionValue;
    }

    /**
     * Calculate Information Gain (Entropy-based)
     */
    calculateInformationGain(question, possibleItems) {
        if (possibleItems.length === 0) return 0;

        let yesCount = 0;
        let noCount = 0;

        possibleItems.forEach(item => {
            if (this.checkMatch(item[question.attribute], question.value)) {
                yesCount++;
            } else {
                noCount++;
            }
        });

        const total = yesCount + noCount;
        if (total === 0) return 0;

        const yesRatio = yesCount / total;
        const noRatio = noCount / total;

        // Balance score - prefer 50/50 splits
        const balance = Math.min(yesRatio, noRatio);
        
        // Apply question weight
        const weightedGain = balance * (question.weight || 1.0);

        return weightedGain;
    }

    /**
     * Select the Best Question to ask next
     */
    selectBestQuestion(category, askedQuestions, possibleItems) {
        const questions = game.questionBank[category] || [];

        // Filter out already asked questions
        const availableQuestions = questions.filter(
            q => !askedQuestions.includes(q.question)
        );

        if (availableQuestions.length === 0) return null;

        let bestQuestion = null;
        let maxGain = -1;

        // Find question with highest information gain
        availableQuestions.forEach(question => {
            const gain = this.calculateInformationGain(question, possibleItems);
            
            // Add tiny random factor to prevent same order
            const randomFactor = Math.random() * 0.01;
            
            if ((gain + randomFactor) > maxGain) {
                maxGain = gain + randomFactor;
                bestQuestion = question;
            }
        });

        return bestQuestion;
    }

    /**
     * Update Probabilities based on User Answer (Bayesian Inference)
     */
    updateProbabilities(possibleItems, question, answer) {
        return possibleItems.map(item => {
            const matches = this.checkMatch(item[question.attribute], question.value);
            
            let probability = item.probability || 1.0;
            
            if (answer === 'yes') {
                probability = matches ? probability * 2.0 : probability * 0.01;
            } else if (answer === 'probably') {
                probability = matches ? probability * 1.5 : probability * 0.25;
            } else if (answer === 'dontknow') {
                probability = probability * 0.9;
            } else if (answer === 'probablynot') {
                probability = matches ? probability * 0.25 : probability * 1.5;
            } else if (answer === 'no') {
                probability = matches ? probability * 0.01 : probability * 2.0;
            }

            return {
                ...item,
                probability: probability
            };
        });
    }

    /**
     * Filter Items and sort by probability
     */
    filterItems(possibleItems, question, answer) {
        // 1. Update Probabilities
        let items = this.updateProbabilities(possibleItems, question, answer);

        // 2. Soft Filter (very low threshold for recovery)
        items = items.filter(item => item.probability > 0.0001);

        // 3. Sort by Probability (Descending)
        items.sort((a, b) => b.probability - a.probability);

        return items;
    }

    /**
     * Calculate Confidence Score (0-100%)
     */
    calculateConfidence(possibleItems) {
        if (possibleItems.length === 0) return 0;
        if (possibleItems.length === 1) return 99;

        const totalProb = possibleItems.reduce((sum, item) => sum + item.probability, 0);
        const topProb = possibleItems[0].probability;
        
        if (totalProb === 0) return 0;

        const confidence = Math.min(99, Math.round((topProb / totalProb) * 100));
        
        return confidence;
    }

    /**
     * Get the current best guess
     */
    getBestGuess(possibleItems) {
        if (possibleItems.length === 0) return null;
        return possibleItems[0];
    }

    /**
     * Logic to decide if AI should make final guess
     */
    shouldStopAsking(possibleItems, questionsAsked, maxQuestions) {
        // 1. Only one item left
        if (possibleItems.length === 1) return true;
        
        // 2. Reached max questions
        if (questionsAsked >= maxQuestions) return true;
        
        // 3. Confidence is very high
        const confidence = this.calculateConfidence(possibleItems);
        if (confidence >= 93) return true;
        
        // 4. Few items left and enough questions asked
        if (possibleItems.length <= 3 && questionsAsked >= 12 && confidence >= 80) return true;
        
        return false;
    }
}

// Create global AI engine instance
const localAlgorithm = new AIEngine();
