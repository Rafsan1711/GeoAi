// algorithm.js - Ultra Advanced Decision Tree Algorithm

class AIEngine {
    constructor() {
        this.answerWeights = CONFIG.ANSWER_WEIGHTS;
        
        // Question stage tracking
        this.questionStages = {
            continent: 0,      // Stage 0: Find continent
            region: 1,         // Stage 1: Find region
            geography: 2,      // Stage 2: Geographic features
            population: 3,     // Stage 3: Population/size
            culture: 4,        // Stage 4: Cultural features
            specific: 5        // Stage 5: Specific identifiers
        };
        
        this.currentStage = 0;
        this.askedAttributes = new Set();
    }

    /**
     * Enhanced match checker with fuzzy matching
     */
    checkMatch(itemValue, questionValue) {
        if (itemValue === undefined || itemValue === null) return false;

        // Array handling
        if (Array.isArray(itemValue)) {
            return itemValue.some(v => {
                if (typeof v === 'string' && typeof questionValue === 'string') {
                    const itemStr = v.toLowerCase().trim();
                    const questionStr = questionValue.toLowerCase().trim();
                    // Exact match or contains
                    return itemStr === questionStr || itemStr.includes(questionStr);
                }
                return v === questionValue;
            });
        }

        // String handling with fuzzy match
        if (typeof itemValue === 'string' && typeof questionValue === 'string') {
            const itemStr = itemValue.toLowerCase().trim();
            const questionStr = questionValue.toLowerCase().trim();
            return itemStr === questionStr || itemStr.includes(questionStr);
        }

        // Direct comparison
        return itemValue === questionValue;
    }

    /**
     * Calculate Shannon Entropy for items
     */
    calculateEntropy(possibleItems) {
        if (possibleItems.length <= 1) return 0;

        const totalProb = possibleItems.reduce((sum, item) => sum + item.probability, 0);
        if (totalProb === 0) return 0;

        let entropy = 0;
        possibleItems.forEach(item => {
            const p = item.probability / totalProb;
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        });

        return entropy;
    }

    /**
     * Advanced Information Gain with Entropy Reduction
     */
    calculateInformationGain(question, possibleItems) {
        if (possibleItems.length === 0) return 0;

        // Current entropy
        const currentEntropy = this.calculateEntropy(possibleItems);

        // Split items into yes/no groups
        let yesItems = [];
        let noItems = [];
        let yesProb = 0;
        let noProb = 0;

        possibleItems.forEach(item => {
            if (this.checkMatch(item[question.attribute], question.value)) {
                yesItems.push(item);
                yesProb += item.probability;
            } else {
                noItems.push(item);
                noProb += item.probability;
            }
        });

        const totalProb = yesProb + noProb;
        if (totalProb === 0) return 0;

        // Calculate weighted entropy after split
        const yesWeight = yesProb / totalProb;
        const noWeight = noProb / totalProb;
        const yesEntropy = this.calculateEntropy(yesItems);
        const noEntropy = this.calculateEntropy(noItems);
        const expectedEntropy = yesWeight * yesEntropy + noWeight * noEntropy;

        // Information gain
        const infoGain = currentEntropy - expectedEntropy;

        // Normalize by current entropy
        const normalizedGain = currentEntropy > 0 ? infoGain / currentEntropy : 0;

        // Apply question weight
        return normalizedGain * (question.weight || 1.0);
    }

    /**
     * Get question stage based on attribute
     */
    getQuestionStage(attribute) {
        const stageMap = {
            'continent': 0,
            'region': 1,
            'subRegion': 1,
            'hasCoast': 2,
            'landlocked': 2,
            'isIsland': 2,
            'hasMountains': 2,
            'population': 3,
            'size': 3,
            'climate': 2,
            'government': 4,
            'mainReligion': 4,
            'language': 5,
            'famousFor': 5,
            'driveSide': 4,
            'flagColors': 4,
            'neighbors': 5,
            'exports': 4,
            'country': 5
        };

        return stageMap[attribute] !== undefined ? stageMap[attribute] : 5;
    }

    /**
     * Check if question is redundant based on previous answers
     */
    isRedundantQuestion(question, possibleItems, askedQuestions) {
        // Already asked
        if (askedQuestions.includes(question.question)) return true;

        // Check if this attribute has been asked too many times
        const attributeCount = askedQuestions.filter(q => {
            const asked = game.state.questions?.find(gq => gq.question === q);
            return asked && asked.attribute === question.attribute;
        }).length;

        if (attributeCount >= 3) return true;

        // Check if all remaining items have same value for this attribute
        const uniqueValues = new Set();
        possibleItems.forEach(item => {
            const value = item[question.attribute];
            uniqueValues.add(JSON.stringify(value));
        });

        if (uniqueValues.size <= 1) return true;

        return false;
    }

    /**
     * Select Best Question with Decision Tree Logic
     */
    selectBestQuestion(category, askedQuestions, possibleItems) {
        const questions = game.questionBank[category] || [];

        if (possibleItems.length === 0) return null;

        // Filter available questions
        let availableQuestions = questions.filter(q => 
            !this.isRedundantQuestion(q, possibleItems, askedQuestions)
        );

        if (availableQuestions.length === 0) return null;

        // Determine current stage based on progress
        const progress = askedQuestions.length;
        if (progress < 3) this.currentStage = 0;  // Continent/Region
        else if (progress < 8) this.currentStage = 2;  // Geography
        else if (progress < 15) this.currentStage = 4;  // Culture
        else this.currentStage = 5;  // Specific

        // Prioritize questions from current and next stage
        const priorityQuestions = availableQuestions.filter(q => {
            const qStage = this.getQuestionStage(q.attribute);
            return qStage <= this.currentStage + 1;
        });

        const questionsToConsider = priorityQuestions.length > 0 
            ? priorityQuestions 
            : availableQuestions;

        // Calculate scores for each question
        let bestQuestion = null;
        let maxScore = -1;

        questionsToConsider.forEach(question => {
            // Information gain (most important)
            const infoGain = this.calculateInformationGain(question, possibleItems);
            
            // Stage bonus (prefer current stage questions)
            const qStage = this.getQuestionStage(question.attribute);
            const stageBonus = qStage === this.currentStage ? 0.2 : 0;
            
            // Balance bonus (prefer questions that split ~50/50)
            let yesCount = 0;
            possibleItems.forEach(item => {
                if (this.checkMatch(item[question.attribute], question.value)) {
                    yesCount++;
                }
            });
            const ratio = yesCount / possibleItems.length;
            const balanceBonus = 1 - Math.abs(0.5 - ratio);
            
            // Final score
            const score = infoGain + stageBonus + (balanceBonus * 0.1) + (Math.random() * 0.01);
            
            if (score > maxScore) {
                maxScore = score;
                bestQuestion = question;
            }
        });

        if (CONFIG.DEBUG.LOG_QUESTIONS) {
            console.log('Selected question:', bestQuestion?.question, 'Score:', maxScore.toFixed(3));
        }

        return bestQuestion;
    }

    /**
     * Advanced Probability Update with Confidence Scaling
     */
    updateProbabilities(possibleItems, question, answer) {
        const weights = this.answerWeights[answer] || this.answerWeights['dontknow'];
        
        return possibleItems.map(item => {
            const matches = this.checkMatch(item[question.attribute], question.value);
            let probability = item.probability || 1.0;
            
            if (answer === 'yes') {
                probability = matches ? probability * weights.match : probability * weights.mismatch;
            } else if (answer === 'probably') {
                probability = matches ? probability * weights.match : probability * weights.mismatch;
            } else if (answer === 'dontknow') {
                probability = probability * weights.match;
            } else if (answer === 'probablynot') {
                probability = matches ? probability * weights.mismatch : probability * weights.match;
            } else if (answer === 'no') {
                probability = matches ? probability * weights.mismatch : probability * weights.match;
            }

            return {
                ...item,
                probability: Math.max(probability, 0.000001)  // Never completely eliminate
            };
        });
    }

    /**
     * Filter and Normalize Items
     */
    filterItems(possibleItems, question, answer) {
        // Update probabilities
        let items = this.updateProbabilities(possibleItems, question, answer);

        // Normalize probabilities
        const totalProb = items.reduce((sum, item) => sum + item.probability, 0);
        if (totalProb > 0) {
            items = items.map(item => ({
                ...item,
                probability: item.probability / totalProb
            }));
        }

        // Soft filter (keep top items even if low probability)
        items = items.filter(item => item.probability > 0.0001);

        // Always keep at least top 10 items or all if less
        if (items.length > 10) {
            items.sort((a, b) => b.probability - a.probability);
            const threshold = items[9].probability * 0.1;
            items = items.filter(item => item.probability >= threshold);
        }

        // Final sort
        items.sort((a, b) => b.probability - a.probability);

        if (CONFIG.DEBUG.LOG_ALGORITHM) {
            console.log(`After filtering: ${items.length} items remaining`);
            console.log('Top 5:', items.slice(0, 5).map(i => 
                `${i.name} (${(i.probability * 100).toFixed(2)}%)`
            ));
        }

        return items;
    }

    /**
     * Calculate Confidence with Advanced Metrics
     */
    calculateConfidence(possibleItems) {
        if (possibleItems.length === 0) return 0;
        if (possibleItems.length === 1) return 99;

        const totalProb = possibleItems.reduce((sum, item) => sum + item.probability, 0);
        if (totalProb === 0) return 0;

        const topProb = possibleItems[0].probability;
        const secondProb = possibleItems.length > 1 ? possibleItems[1].probability : 0;

        // Confidence based on top probability
        const probConfidence = (topProb / totalProb) * 100;

        // Confidence based on gap between top and second
        const gapConfidence = topProb > 0 ? ((topProb - secondProb) / topProb) * 100 : 0;

        // Confidence based on number of items
        const countConfidence = 100 * (1 - Math.min(possibleItems.length / 50, 1));

        // Weighted average
        const confidence = (probConfidence * 0.5) + (gapConfidence * 0.3) + (countConfidence * 0.2);
        
        return Math.min(99, Math.round(confidence));
    }

    /**
     * Get Best Guess
     */
    getBestGuess(possibleItems) {
        if (possibleItems.length === 0) return null;
        return possibleItems[0];
    }

    /**
     * Adaptive Stopping Logic
     */
    shouldStopAsking(possibleItems, questionsAsked, maxQuestions) {
        // Only one item left
        if (possibleItems.length === 1) return true;

        // No items (shouldn't happen)
        if (possibleItems.length === 0) return true;
        
        // Calculate confidence
        const confidence = this.calculateConfidence(possibleItems);

        // Adaptive confidence threshold based on stage
        let requiredConfidence;
        if (questionsAsked <= 10) {
            requiredConfidence = CONFIG.GAME.CONFIDENCE_THRESHOLD_PER_STAGE.early;
        } else if (questionsAsked <= 25) {
            requiredConfidence = CONFIG.GAME.CONFIDENCE_THRESHOLD_PER_STAGE.mid;
        } else {
            requiredConfidence = CONFIG.GAME.CONFIDENCE_THRESHOLD_PER_STAGE.late;
        }

        // Stop if confidence is high enough
        if (confidence >= requiredConfidence) {
            console.log(`Stopping: Confidence ${confidence}% >= ${requiredConfidence}%`);
            return true;
        }

        // Absolute max questions reached
        if (questionsAsked >= maxQuestions) {
            console.log('Stopping: Max questions reached');
            return true;
        }

        // Very few items left with decent confidence
        if (possibleItems.length <= 2 && confidence >= 85 && questionsAsked >= 15) {
            console.log('Stopping: 2 items, 85% confidence');
            return true;
        }

        return false;
    }

    /**
     * Reset for new game
     */
    reset() {
        this.currentStage = 0;
        this.askedAttributes.clear();
    }
}

// Create global AI engine instance
const localAlgorithm = new AIEngine();
