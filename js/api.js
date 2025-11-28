// api.js - Optimized API Handler for Ultra Accuracy Mode

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
        this.sessionId = null;
    }

    /**
     * Check if backend is healthy
     */
    async checkBackendHealth() {
        if (!CONFIG.FEATURES.USE_PYTHON_API) {
            this.backendHealthy = false;
            return false;
        }

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
            console.log('💻 Using local algorithm (backend not available)');
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

            console.log('📊 Data loaded successfully:');
            console.log(`  🌍 Countries: ${countries.length}`);
            console.log(`  🏙️ Cities: ${cities.length}`);
            console.log(`  🏛️ Places: ${places.length}`);

            // Check backend health
            if (CONFIG.FEATURES.USE_PYTHON_API) {
                await this.checkBackendHealth();
            }

            return this.dataCache;
        } catch (error) {
            console.error('❌ Error loading game data:', error);
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
     * Get next question (Local Algorithm Priority)
     */
    async getNextQuestion(category, askedQuestions, possibleItems) {
        // Always use local algorithm for ultra accuracy
        if (CONFIG.FEATURES.USE_LOCAL_ALGORITHM) {
            return localAlgorithm.selectBestQuestion(
                category,
                askedQuestions,
                possibleItems
            );
        }

        return null;
    }

    /**
     * Filter items (Local Algorithm)
     */
    async filterItems(possibleItems, question, answer) {
        // Use local algorithm
        if (CONFIG.FEATURES.USE_LOCAL_ALGORITHM) {
            return localAlgorithm.filterItems(
                possibleItems,
                question,
                answer
            );
        }

        return possibleItems;
    }

    /**
     * Get prediction (Local Algorithm)
     */
    async getPrediction(possibleItems, questionsAsked) {
        // Use local algorithm
        if (CONFIG.FEATURES.USE_LOCAL_ALGORITHM) {
            return {
                prediction: localAlgorithm.getBestGuess(possibleItems),
                confidence: localAlgorithm.calculateConfidence(possibleItems),
                alternatives: possibleItems.slice(1, 4),
                questions_asked: questionsAsked,
                items_remaining: possibleItems.length
            };
        }

        return null;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            backendHealthy: this.backendHealthy,
            sessionId: this.sessionId,
            dataLoaded: {
                countries: this.dataCache.country?.length || 0,
                cities: this.dataCache.city?.length || 0,
                places: this.dataCache.place?.length || 0
            }
        };
    }

    /**
     * Retry backend connection
     */
    async retryBackendConnection() {
        console.log('🔄 Retrying backend connection...');
        return await this.checkBackendHealth();
    }

    /**
     * End session
     */
    endSession() {
        this.sessionId = null;
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            cache: this.getCacheStats(),
            algorithm: {
                mode: 'ultra',
                maxQuestions: CONFIG.GAME.MAX_QUESTIONS,
                minConfidence: CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS,
                features: {
                    decisionTree: CONFIG.FEATURES.USE_DECISION_TREE,
                    smartPruning: CONFIG.FEATURES.USE_SMART_PRUNING,
                    contextual: CONFIG.FEATURES.USE_CONTEXTUAL_QUESTIONS
                }
            }
        };
    }
}

// Create global instance
const apiHandler = new APIHandler();
