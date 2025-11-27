// config.js - Updated for Unlimited Questions

const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'https://sliding-puzzle-with-solver-ida-1.onrender.com',
        ENDPOINTS: {
            START_GAME: '/api/start-game',
            GET_QUESTION: '/api/question',
            PROCESS_ANSWER: '/api/answer',
            FILTER: '/api/filter',
            PREDICT: '/api/predict',
            STATS: '/api/stats',
            LOAD_DATA: '/api/load-data',
            HEALTH: '/health'
        },
        TIMEOUT: 20000,
        RETRY_ATTEMPTS: 3
    },

    // Game Configuration
    GAME: {
        MAX_QUESTIONS: 50,              // Increased from 15 to 50
        MIN_CONFIDENCE_TO_GUESS: 92,    // Increased from 90 to 92 for better accuracy
        THINKING_DURATION: 3000,
        QUESTION_DELAY: 500,
        ANIMATION_DURATION: 600,
        USE_SESSION_MODE: true,
        ALLOW_UNLIMITED_QUESTIONS: true  // NEW: Allow unlimited questions if needed
    },

    // Data Configuration
    DATA: {
        PATHS: {
            COUNTRIES: './data/countries.json',
            CITIES: './data/cities.json',
            PLACES: './data/places.json'
        }
    },

    // Answer Weights
    ANSWER_WEIGHTS: {
        'yes': 1.0,
        'probably': 0.75,
        'dontknow': 0.5,
        'probablynot': 0.25,
        'no': 0.0
    },

    // UI Configuration
    UI: {
        PARTICLE_COUNT: 30,
        CONFETTI_COUNT: 50,
        ENABLE_ANIMATIONS: true,
        ENABLE_SOUND: false,
        THEME: 'dark',
        SHOW_CONFIDENCE_BREAKDOWN: false
    },

    // Debug Configuration
    DEBUG: {
        ENABLED: false,
        LOG_API_CALLS: true,
        LOG_STATE_CHANGES: false,
        SHOW_PROBABILITY_SCORES: false,
        LOG_BACKEND_RESPONSES: true
    },

    // Feature Flags
    FEATURES: {
        USE_PYTHON_API: true,
        USE_LOCAL_ALGORITHM: true,
        USE_SESSION_API: true,
        ENABLE_MULTIPLAYER: false,
        ENABLE_LEADERBOARD: false,
        ENABLE_ANSWER_EXPLANATIONS: false
    },

    // Performance
    PERFORMANCE: {
        LAZY_LOAD_DATA: false,
        CACHE_API_RESPONSES: true,
        PRELOAD_IMAGES: false,
        USE_REQUEST_BATCHING: false
    },

    // Backend AI Configuration
    AI: {
        ALGORITHM: 'Advanced Bayesian Network',
        VERSION: '3.0',
        FEATURES: [
            'Information Gain',
            'Bayesian Inference',
            'Feature Importance',
            'Adaptive Strategy',
            'Context Awareness'
        ]
    },

    // Localization
    LOCALE: {
        DEFAULT: 'en',
        AVAILABLE: ['en', 'bn'],
        DATE_FORMAT: 'YYYY-MM-DD'
    },

    // Analytics
    ANALYTICS: {
        ENABLED: false,
        TRACK_GAMEPLAY: true,
        TRACK_ERRORS: true,
        TRACK_AI_ACCURACY: true
    }
};

// Validation function
function validateConfig() {
    if (CONFIG.GAME.MAX_QUESTIONS < 10 || CONFIG.GAME.MAX_QUESTIONS > 100) {
        console.warn('⚠️  MAX_QUESTIONS should be between 10 and 100');
    }
    
    if (CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS < 50 || CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS > 99) {
        console.warn('⚠️  MIN_CONFIDENCE_TO_GUESS should be between 50 and 99');
    }
    
    if (CONFIG.API.BASE_URL.includes('your-backend-url') || 
        CONFIG.API.BASE_URL.includes('sliding-puzzle')) {
        console.warn('⚠️  Please update API.BASE_URL in config.js with your actual Render.com backend URL!');
    }
    
    if (!CONFIG.FEATURES.USE_PYTHON_API) {
        console.warn('⚠️  Python API is disabled. Using local algorithm only.');
    }
    
    console.log('✅ Config validation complete');
    console.log(`🤖 AI Engine: ${CONFIG.AI.ALGORITHM} v${CONFIG.AI.VERSION}`);
    console.log(`🎯 Max Questions: ${CONFIG.GAME.MAX_QUESTIONS} (Confidence threshold: ${CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS}%)`);
    
    return true;
}

// Initialize configuration
validateConfig();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
