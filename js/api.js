// api_enhanced.js - Enhanced API Handler for Backend Communication

class APIHandler {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
        this.dataCache = {
            country: null,
            city: null,
            place: null
        };
        this.backendHealthy = false;
        this.sessionId = null;
        this.endpoints = {
            START_GAME: '/api/start-game',
            GET_QUESTION: '/api/question',
            PROCESS_ANSWER: '/api/answer',
            PREDICT: '/api/predict',
            FEEDBACK: '/api/feedback',
            HEALTH: '/health',
            STATS: '/api/stats'
        };
    }

    /**
     * Generic REST API Caller
     */
    async _apiCall(endpoint, method = 'GET', data = null, timeout = CONFIG.API.TIMEOUT) {
        const url = this.baseURL + endpoint;
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(timeout)
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            if (CONFIG.DEBUG.LOG_API_CALLS) {
                console.log(`📡 API Call: ${method} ${url}`, data);
            }
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `HTTP Error ${response.status}` }));
                throw new Error(errorData.error || `HTTP Error ${response.status}`);
            }

            return response.json();
        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.error(`❌ API Timeout: ${url}`, error);
            } else {
                console.error(`❌ API Failed: ${url}`, error);
            }
            throw error;
        }
    }

    /**
     * Check if backend is healthy
     */
    async checkBackendHealth() {
        try {
            const data = await this._apiCall(this.endpoints.HEALTH, 'GET', null, 5000);
            this.backendHealthy = data?.status === 'healthy';
            if (this.backendHealthy) {
                console.log('✅ Backend is healthy:', data);
            }
            return this.backendHealthy;
        } catch (error) {
            this.backendHealthy = false;
            console.warn('💻 Using local data mode (Backend API not available or failed health check).');
            return false;
        }
    }

    /**
     * Load JSON data from file (Client-side Data Loading is MANDATORY)
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
     * Load all game data (must load all on client-side for questions/UI)
     */
    async loadAllData() {
        const [countries, cities, places, questions] = await Promise.all([
            this.loadJSON(CONFIG.DATA.PATHS.COUNTRIES),
            this.loadJSON(CONFIG.DATA.PATHS.CITIES),
            this.loadJSON(CONFIG.DATA.PATHS.PLACES),
            this.loadJSON(CONFIG.DATA.PATHS.QUESTIONS) // Assuming a new combined questions.json file exists
        ]);

        this.dataCache = {
            country: countries,
            city: cities,
            place: places,
            questions: questions
        };

        console.log(`📊 Data loaded: Countries=${countries.length}, Cities=${cities.length}, Places=${places.length}`);

        // Check backend health only if data load is successful
        if (countries.length > 0) {
            await this.checkBackendHealth();
        }
        
        return this.dataCache;
    }

    /**
     * Get data for specific category
     */
    getData(category) {
        return this.dataCache[category] || [];
    }
    
    /**
     * Get question bank
     */
    getQuestionBank() {
        return this.dataCache.questions || {};
    }

    // --- Backend-dependent calls ---

    async startGame(category, questions) {
        if (!this.backendHealthy) {
            throw new Error("Backend is offline. Cannot start game.");
        }
        const data = await this._apiCall(this.endpoints.START_GAME, 'POST', {
            category: category,
            questions: questions // Send full question bank
        });
        this.sessionId = data.session_id;
        return data;
    }

    async getNextQuestion(sessionId) {
        return this._apiCall(this.endpoints.GET_QUESTION, 'POST', {
            session_id: sessionId
        });
    }

    async processAnswer(sessionId, answer) {
        return this._apiCall(this.endpoints.PROCESS_ANSWER, 'POST', {
            session_id: sessionId,
            answer: answer
        });
    }

    async getPrediction(sessionId) {
        const prediction = await this._apiCall(this.endpoints.PREDICT, 'POST', {
            session_id: sessionId
        });
        this.sessionId = null; // Session ends after final prediction
        return prediction;
    }
    
    async submitFeedback(sessionId, actualAnswerName) {
        return this._apiCall(this.endpoints.FEEDBACK, 'POST', {
            session_id: sessionId,
            actual_answer: actualAnswerName
        });
    }
    
    async getStats() {
        return this._apiCall(this.endpoints.STATS);
    }
}

// Create global instance
const apiHandler = new APIHandler();
