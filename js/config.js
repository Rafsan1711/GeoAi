// config.js - Ultra Configuration for Maximum Accuracy

const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'https://sliding-puzzle-with-solver-ida-1.onrender.com',
        TIMEOUT: 30000,
        ENDPOINTS: {
            START_GAME: '/start-game',
            GET_QUESTION: '/question',
            PROCESS_ANSWER: '/answer',
            FILTER: '/filter',
            PREDICT: '/predict',
            STATS: '/stats'
        }
    },

    // Game Configuration - ULTRA MODE
    GAME: {
        MAX_QUESTIONS: 50,  // Much higher limit
        MIN_CONFIDENCE_TO_GUESS: 98,  // Very high confidence needed
        EARLY_STOP_CONFIDENCE: 99,  // Only stop if almost certain
        MIN_ITEMS_TO_GUESS: 1,  // Continue until 1 item
        THINKING_DURATION: 2000,
        QUESTION_DELAY: 300,
        
        // Advanced stopping criteria
        ADAPTIVE_STOPPING: true,
        CONFIDENCE_THRESHOLD_PER_STAGE: {
            early: 99,    // Questions 1-10: need 99%
            mid: 98,      // Questions 11-25: need 98%
            late: 95      // Questions 26+: need 95%
        }
    },

    // Data Paths
    DATA: {
        PATHS: {
            COUNTRIES: 'data/countries.json',
            CITIES: 'data/cities.json',
            PLACES: 'data/places.json'
        }
    },

    // Feature Flags
    FEATURES: {
        USE_PYTHON_API: false,
        USE_SESSION_API: false,
        USE_LOCAL_ALGORITHM: true,
        ENABLE_PWA: false,
        
        // Advanced features
        USE_DECISION_TREE: true,
        USE_SMART_PRUNING: true,
        USE_CONTEXTUAL_QUESTIONS: true
    },

    // UI Configuration
    UI: {
        ENABLE_ANIMATIONS: true,
        CONFETTI_COUNT: 50,
        PARTICLE_COUNT: 30
    },

    // Answer Weights - More aggressive
    ANSWER_WEIGHTS: {
        'yes': {
            match: 5.0,      // Very strong boost for matches
            mismatch: 0.001  // Almost eliminate mismatches
        },
        'probably': {
            match: 2.5,
            mismatch: 0.1
        },
        'dontknow': {
            match: 1.0,
            mismatch: 1.0
        },
        'probablynot': {
            match: 0.1,
            mismatch: 2.5
        },
        'no': {
            match: 0.001,    // Almost eliminate matches
            mismatch: 5.0    // Very strong boost for mismatches
        }
    },

    // Debug Configuration
    DEBUG: {
        ENABLED: false,
        LOG_API_CALLS: false,
        LOG_ALGORITHM: true,
        LOG_QUESTIONS: true
    }
};
