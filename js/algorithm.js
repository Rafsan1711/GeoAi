// algorithm.js - Advanced AI Algorithm using Information Gain and Bayesian Inference

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
     * Calculate information gain for a question
     * Uses entropy-based calculation to find the most informative question
     */
    calculateInformationGain(question, possibleItems) {
        if (possibleItems.length === 0) return 0;

        let yesCount = 0;
        let noCount = 0;

        possibleItems.forEach(item => {
            if (item[question.attribute] === question.value) {
                yesCount++;
            } else {
                noCount++;
            }
        });

        const total = yesCount + noCount;
        
        if (total === 0) return 0;

        // Calculate entropy - we want questions that split the data most evenly
        const yesRatio = yesCount / total;
        const noRatio = noCount / total;

        // Prefer questions that create a more balanced split
        // The closer to 0.5, the better the split
        const balance = Math.min(yesRatio, noRatio);
        
        // Factor in the question's inherent weight (importance)
        const weightedGain = balance * question.weight;

        return weightedGain;
    }

    /**
     * Select the best next question to ask
     * This uses a greedy approach to maximize information gain
     */
    selectBestQuestion(category, askedQuestions, possibleItems) {
        const availableQuestions = questionBank[category].filter(
            q => !askedQuestions.includes(q.question)
        );

        if (availableQuestions.length === 0) return null;

        let bestQuestion = null;
        let maxGain = -1;

        availableQuestions.forEach(question => {
            const gain = this.calculateInformationGain(question, possibleItems);
            
            if (gain > maxGain) {
                maxGain = gain;
                bestQuestion = question;
            }
        });

        return bestQuestion;
    }

    /**
     * Update item probabilities based on answer using Bayesian inference
     */
    updateProbabilities(possibleItems, question, answer) {
        const weight = this.answerWeights[answer];
        
        return possibleItems.map(item => {
            const matches = item[question.attribute] === question.value;
            
            // Calculate new probability
            let probability = item.probability || 1.0;
            
            if (answer === 'yes') {
                probability = matches ? probability * 1.2 : probability * 0.1;
            } else if (answer === 'probably') {
                probability = matches ? probability * 1.1 : probability * 0.4;
            } else if (answer === 'dontknow') {
                // No change for "don't know"
                probability = probability * 0.9;
            } else if (answer === 'probablynot') {
                probability = matches ? probability * 0.4 : probability * 1.1;
            } else if (answer === 'no') {
                probability = matches ? probability * 0.1 : probability * 1.2;
            }

            return {
                ...item,
                probability: probability
            };
        });
    }

    /**
     * Filter items based on answer with weighted approach
     */
    filterItems(possibleItems, question, answer) {
        const weight = this.answerWeights[answer];

        // Update probabilities first
        let items = this.updateProbabilities(possibleItems, question, answer);

        // For strong answers (yes/no), we can filter more aggressively
        if (answer === 'yes') {
            // Keep items that match, but also keep some non-matching with low probability
            items = items.filter(item => {
                if (item[question.attribute] === question.value) return true;
                return item.probability > 0.15; // Keep some unlikely candidates
            });
        } else if (answer === 'no') {
            // Remove items that match, but keep some with very low probability
            items = items.filter(item => {
                if (item[question.attribute] !== question.value) return true;
                return item.probability > 0.15; // Keep some unlikely candidates
            });
        } else if (answer === 'probably' || answer === 'probablynot') {
            // For uncertain answers, keep all but lower some probabilities
            // Already handled in updateProbabilities
        }
        // For 'dontknow', keep all items (probabilities slightly lowered)

        // Sort by probability
        items.sort((a, b) => (b.probability || 1) - (a.probability || 1));

        return items;
    }

    /**
     * Calculate confidence in the current top guess
     */
    calculateConfidence(possibleItems) {
        if (possibleItems.length === 0) return 0;
        if (possibleItems.length === 1) return 95;

        // Normalize probabilities
        const totalProb = possibleItems.reduce((sum, item) => sum + (item.probability || 1), 0);
        const topProb = possibleItems[0].probability || 1;
        
        const confidence = Math.min(95, Math.round((topProb / totalProb) * 100));
        
        return confidence;
    }

    /**
     * Get the best guess from remaining items
     */
    getBestGuess(possibleItems) {
        if (possibleItems.length === 0) return null;
        
        // Sort by probability
        const sorted = [...possibleItems].sort((a, b) => 
            (b.probability || 1) - (a.probability || 1)
        );
        
        return sorted[0];
    }

    /**
     * Check if we should stop asking questions
     */
    shouldStopAsking(possibleItems, questionsAsked, maxQuestions) {
        // Stop if we have a clear winner
        if (possibleItems.length === 1) return true;
        
        // Stop if we've asked max questions
        if (questionsAsked >= maxQuestions) return true;
        
        // Stop if confidence is very high
        const confidence = this.calculateConfidence(possibleItems);
        if (confidence >= 90) return true;
        
        // Stop if we have very few items left
        if (possibleItems.length <= 2 && questionsAsked >= maxQuestions * 0.7) return true;
        
        return false;
    }

    /**
     * Initialize probabilities for all items
     */
    initializeItems(items) {
        return items.map(item => ({
            ...item,
            probability: 1.0
        }));
    }

    /**
     * Get statistics about the current game state
     */
    getStats(possibleItems) {
        const totalProb = possibleItems.reduce((sum, item) => sum + (item.probability || 1), 0);
        
        return {
            itemCount: possibleItems.length,
            topProbability: possibleItems.length > 0 ? possibleItems[0].probability : 0,
            confidence: this.calculateConfidence(possibleItems),
            normalized: possibleItems.map(item => ({
                ...item,
                normalizedProb: ((item.probability || 1) / totalProb * 100).toFixed(1)
            }))
        };
    }
}

// Create global AI engine instance
const aiEngine = new AIEngine();