// api.js - API Communication and Data Loading

class APIHandler {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
        this.timeout = CONFIG.API.TIMEOUT;
        this.cache = new Map();
        this.dataCache = {
            countries: null,
            cities: null,
            places: null
        };
    }

    /**
     * Load JSON data from file
     */
    async loadJSON(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error loading JSON from ${path}:`, error);
            return [];
        }
    }

    /**
     * Load all game data
     */
    async loadAllData() {
        try {
            const [countries, cities, places] = await Promise.all([
                this.loadJSON(CONFIG.DATA.PATHS.COUNTRIES),
                this.loadJSON(CONFIG.DATA.PATHS.CITIES),
                this.loadJSON(CONFIG.DATA.PATHS.PLACES)
            ]);

            this.dataCache = {
                country: countries,
                city: cities,
                place: places
            };

            console.log('📊 Data loaded:', {
                countries: countries.length,
                cities: cities.length,
                places: places.length
            });

            return this.dataCache;
        } catch (error) {
            console.error('Error loading game data:', error);
            // Return fallback empty data
            return {
                country: [],
                city: [],
                place: []
            };
        }
    }

    /**
     * Get data for specific category
     */
    getData(category) {
        return this.dataCache[category] || [];
    }

    /**
     * Make API request to Python backend
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;

        // Check cache for GET requests
        if (method === 'GET' && CONFIG.PERFORMANCE.CACHE_API_RESPONSES) {
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
        }

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(this.timeout)
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            // Cache successful GET requests
            if (method === 'GET' && CONFIG.PERFORMANCE.CACHE_API_RESPONSES) {
                this.cache.set(cacheKey, result);
            }

            return result;
        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.error('Request timeout:', endpoint);
            } else {
                console.error('API request failed:', error);
            }
            throw error;
        }
    }

    /**
     * Get next question from Python API
     */
    async getNextQuestion(category, answers, possibleItems) {
        if (!CONFIG.FEATURES.USE_PYTHON_API) {
            // Use local algorithm
            return null;
        }

        try {
            const response = await this.makeRequest(
                CONFIG.API.ENDPOINTS.GET_QUESTION,
                'POST',
                {
                    category,
                    answers,
                    possibleItems: possibleItems.map(item => item.id)
                }
            );

            return response.question;
        } catch (error) {
            console.error('Error getting question from API:', error);
            return null;
        }
    }

    /**
     * Get prediction from Python API
     */
    async getPrediction(category, answers) {
        if (!CONFIG.FEATURES.USE_PYTHON_API) {
            return null;
        }

        try {
            const response = await this.makeRequest(
                CONFIG.API.ENDPOINTS.PREDICT,
                'POST',
                {
                    category,
                    answers
                }
            );

            return response;
        } catch (error) {
            console.error('Error getting prediction from API:', error);
            return null;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Local Algorithm (Fallback when Python API is not available)
class LocalAlgorithm {
    constructor() {
        this.answerWeights = CONFIG.ANSWER_WEIGHTS;
    }

    /**
     * Calculate information gain for a question
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

        // Calculate entropy - prefer questions that split evenly
        const yesRatio = yesCount / total;
        const noRatio = noCount / total;
        const balance = Math.min(yesRatio, noRatio);
        
        return balance * question.weight;
    }

    /**
     * Select the best question to ask
     */
    selectBestQuestion(questions, askedQuestions, possibleItems) {
        const availableQuestions = questions.filter(
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
     * Update probabilities based on answer
     */
    updateProbabilities(possibleItems, question, answer) {
        return possibleItems.map(item => {
            const matches = item[question.attribute] === question.value;
            let probability = item.probability || 1.0;
            
            if (answer === 'yes') {
                probability = matches ? probability * 1.2 : probability * 0.1;
            } else if (answer === 'probably') {
                probability = matches ? probability * 1.1 : probability * 0.4;
            } else if (answer === 'dontknow') {
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
     * Filter items based on answer
     */
    filterItems(possibleItems, question, answer) {
        let items = this.updateProbabilities(possibleItems, question, answer);

        // Aggressive filtering for definite answers
        if (answer === 'yes') {
            items = items.filter(item => 
                item[question.attribute] === question.value || item.probability > 0.15
            );
        } else if (answer === 'no') {
            items = items.filter(item => 
                item[question.attribute] !== question.value || item.probability > 0.15
            );
        }

        // Sort by probability
        items.sort((a, b) => (b.probability || 1) - (a.probability || 1));

        return items;
    }

    /**
     * Calculate confidence
     */
    calculateConfidence(possibleItems) {
        if (possibleItems.length === 0) return 0;
        if (possibleItems.length === 1) return 95;

        const totalProb = possibleItems.reduce((sum, item) => 
            sum + (item.probability || 1), 0
        );
        const topProb = possibleItems[0].probability || 1;
        
        return Math.min(95, Math.round((topProb / totalProb) * 100));
    }

    /**
     * Get best guess
     */
    getBestGuess(possibleItems) {
        if (possibleItems.length === 0) return null;
        
        const sorted = [...possibleItems].sort((a, b) => 
            (b.probability || 1) - (a.probability || 1)
        );
        
        return sorted[0];
    }

    /**
     * Check if should stop asking
     */
    shouldStopAsking(possibleItems, questionsAsked, maxQuestions) {
        if (possibleItems.length === 1) return true;
        if (questionsAsked >= maxQuestions) return true;
        
        const confidence = this.calculateConfidence(possibleItems);
        if (confidence >= CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS) return true;
        
        if (possibleItems.length <= 2 && questionsAsked >= maxQuestions * 0.7) return true;
        
        return false;
    }
}

// Create global instances
const apiHandler = new APIHandler();
const localAlgorithm = new LocalAlgorithm();