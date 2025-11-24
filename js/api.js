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
        this.backendHealthy = false;
        this.dataLoadedToBackend = false;
    }

    /**
     * Check if backend is healthy
     */
    async checkBackendHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const data = await response.json();
                this.backendHealthy = true;
                console.log('✅ Backend is healthy:', data);
                return true;
            }
        } catch (error) {
            console.warn('⚠️  Backend not available, using local algorithm');
            this.backendHealthy = false;
        }
        return false;
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

            // Check backend health
            if (CONFIG.FEATURES.USE_PYTHON_API) {
                await this.checkBackendHealth();
                
                // Load data to backend if healthy
                if (this.backendHealthy) {
                    await this.loadDataToBackend();
                }
            }

            return this.dataCache;
        } catch (error) {
            console.error('Error loading game data:', error);
            return {
                country: [],
                city: [],
                place: []
            };
        }
    }

    /**
     * Load data and questions to backend
     */
    async loadDataToBackend() {
        if (this.dataLoadedToBackend) return;
        
        try {
            console.log('📤 Loading data to backend...');
            
            // Load questions
            const questionBanks = {
                country: game.questionBank.country || [],
                city: game.questionBank.city || [],
                place: game.questionBank.place || []
            };
            
            // Send data for each category
            for (const [category, items] of Object.entries(this.dataCache)) {
                const response = await this.makeRequest(
                    CONFIG.API.ENDPOINTS.LOAD_DATA,
                    'POST',
                    {
                        category: category,
                        items: items,
                        questions: questionBanks[category]
                    }
                );
                
                if (response) {
                    console.log(`✅ Loaded ${category} data to backend`);
                }
            }
            
            this.dataLoadedToBackend = true;
            console.log('✅ All data loaded to backend successfully');
            
        } catch (error) {
            console.error('Error loading data to backend:', error);
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
            if (CONFIG.DEBUG.LOG_API_CALLS) {
                console.log(`🔵 API Request: ${method} ${endpoint}`, data);
            }

            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (CONFIG.DEBUG.LOG_API_CALLS) {
                console.log(`🟢 API Response:`, result);
            }

            // Cache successful GET requests
            if (method === 'GET' && CONFIG.PERFORMANCE.CACHE_API_RESPONSES) {
                this.cache.set(cacheKey, result);
            }

            return result;
        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.error('⏱️  Request timeout:', endpoint);
            } else if (error.name === 'AbortError') {
                console.error('🚫 Request aborted:', endpoint);
            } else {
                console.error('❌ API request failed:', error);
            }
            throw error;
        }
    }

    /**
     * Get next question from Python API with fallback
     */
    async getNextQuestion(category, askedQuestions, possibleItems) {
        // Try Python API first if enabled and healthy
        if (CONFIG.FEATURES.USE_PYTHON_API && this.backendHealthy) {
            try {
                const response = await this.makeRequest(
                    CONFIG.API.ENDPOINTS.GET_QUESTION,
                    'POST',
                    {
                        category: category,
                        asked_questions: askedQuestions,
                        items: possibleItems
                    }
                );

                if (response && response.question) {
                    console.log('🤖 Using backend AI question');
                    return response.question;
                }
            } catch (error) {
                console.warn('Backend question failed, using local algorithm');
                this.backendHealthy = false;
            }
        }

        // Fallback to local algorithm
        if (CONFIG.FEATURES.USE_LOCAL_ALGORITHM) {
            console.log('💻 Using local algorithm question');
            const questions = game.questionBank[category] || [];
            return localAlgorithm.selectBestQuestion(
                questions,
                askedQuestions,
                possibleItems
            );
        }

        return null;
    }

    /**
     * Filter items using Python API with fallback
     */
    async filterItems(possibleItems, question, answer) {
        // Try Python API first if enabled and healthy
        if (CONFIG.FEATURES.USE_PYTHON_API && this.backendHealthy) {
            try {
                const response = await this.makeRequest(
                    CONFIG.API.ENDPOINTS.FILTER,
                    'POST',
                    {
                        items: possibleItems,
                        question: question,
                        answer: answer
                    }
                );

                if (response && response.items) {
                    console.log('🤖 Using backend filtering');
                    return response.items;
                }
            } catch (error) {
                console.warn('Backend filtering failed, using local algorithm');
                this.backendHealthy = false;
            }
        }

        // Fallback to local algorithm
        if (CONFIG.FEATURES.USE_LOCAL_ALGORITHM) {
            console.log('💻 Using local algorithm filtering');
            return localAlgorithm.filterItems(
                possibleItems,
                question,
                answer
            );
        }

        return possibleItems;
    }

    /**
     * Get prediction from Python API with fallback
     */
    async getPrediction(possibleItems, questionsAsked) {
        // Try Python API first if enabled and healthy
        if (CONFIG.FEATURES.USE_PYTHON_API && this.backendHealthy) {
            try {
                const response = await this.makeRequest(
                    CONFIG.API.ENDPOINTS.PREDICT,
                    'POST',
                    {
                        items: possibleItems,
                        questions_asked: questionsAsked
                    }
                );

                if (response) {
                    console.log('🤖 Using backend prediction');
                    return response;
                }
            } catch (error) {
                console.warn('Backend prediction failed, using local algorithm');
                this.backendHealthy = false;
            }
        }

        // Fallback to local algorithm
        if (CONFIG.FEATURES.USE_LOCAL_ALGORITHM) {
            console.log('💻 Using local algorithm prediction');
            return {
                prediction: localAlgorithm.getBestGuess(possibleItems),
                confidence: localAlgorithm.calculateConfidence(possibleItems),
                should_stop: localAlgorithm.shouldStopAsking(
                    possibleItems,
                    questionsAsked,
                    CONFIG.GAME.MAX_QUESTIONS
                )
            };
        }

        return null;
    }

    /**
     * Get statistics from backend
     */
    async getStats() {
        if (!this.backendHealthy) return null;
        
        try {
            return await this.makeRequest(CONFIG.API.ENDPOINTS.STATS);
        } catch (error) {
            console.error('Error getting stats:', error);
            return null;
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️  Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            backendHealthy: this.backendHealthy,
            dataLoadedToBackend: this.dataLoadedToBackend
        };
    }

    /**
     * Retry backend connection
     */
    async retryBackendConnection() {
        console.log('🔄 Retrying backend connection...');
        const healthy = await this.checkBackendHealth();
        
        if (healthy && !this.dataLoadedToBackend) {
            await this.loadDataToBackend();
        }
        
        return healthy;
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
                probability = matches ? probability * 1.5 : probability * 0.05;
            } else if (answer === 'probably') {
                probability = matches ? probability * 1.2 : probability * 0.3;
            } else if (answer === 'dontknow') {
                probability = probability * 0.85;
            } else if (answer === 'probablynot') {
                probability = matches ? probability * 0.3 : probability * 1.2;
            } else if (answer === 'no') {
                probability = matches ? probability * 0.05 : probability * 1.5;
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

        if (answer === 'yes') {
            items = items.filter(item => 
                item[question.attribute] === question.value || item.probability > 0.15
            );
        } else if (answer === 'no') {
            items = items.filter(item => 
                item[question.attribute] !== question.value || item.probability > 0.15
            );
        }

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
