// config.js - Updated for Advanced Backend

const CONFIG = {
    // API Configuration
    API: {
        // Your Render.com backend URL (update this after deployment)
        BASE_URL: 'https://sliding-puzzle-with-solver-ida-1.onrender.com',
        ENDPOINTS: {
            START_GAME: '/api/start-game',      // NEW: Initialize game session
            GET_QUESTION: '/api/question',
            PROCESS_ANSWER: '/api/answer',       // NEW: Process answer endpoint
            FILTER: '/api/filter',
            PREDICT: '/api/predict',
            STATS: '/api/stats',
            LOAD_DATA: '/api/load-data',
            HEALTH: '/health'
        },
        TIMEOUT: 20000, // 20 seconds (increased for complex calculations)
        RETRY_ATTEMPTS: 3
    },

    // Game Configuration
    GAME: {
        MAX_QUESTIONS: 15,
        MIN_CONFIDENCE_TO_GUESS: 90,  // Increased from 85 to 90
        THINKING_DURATION: 3000,
        QUESTION_DELAY: 500,           // Increased for smoother UX
        ANIMATION_DURATION: 600,
        USE_SESSION_MODE: true          // NEW: Use session-based API calls
    },

    // Data Configuration
    DATA: {
        PATHS: {
            COUNTRIES: './data/countries.json',
            CITIES: './data/cities.json',
            PLACES: './data/places.json'
        }
    },

    // Answer Weights (kept for local fallback)
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
        SHOW_CONFIDENCE_BREAKDOWN: false  // NEW: Show detailed confidence
    },

    // Debug Configuration
    DEBUG: {
        ENABLED: false,
        LOG_API_CALLS: true,
        LOG_STATE_CHANGES: false,
        SHOW_PROBABILITY_SCORES: false,
        LOG_BACKEND_RESPONSES: true      // NEW: Log backend AI responses
    },

    // Feature Flags
    FEATURES: {
        USE_PYTHON_API: true,             // ✅ Always use Python backend now
        USE_LOCAL_ALGORITHM: true,        // Fallback if API fails
        USE_SESSION_API: true,            // NEW: Use session-based endpoints
        ENABLE_MULTIPLAYER: false,
        ENABLE_LEADERBOARD: false,
        ENABLE_ANSWER_EXPLANATIONS: false // NEW: Future feature
    },

    // Performance
    PERFORMANCE: {
        LAZY_LOAD_DATA: false,
        CACHE_API_RESPONSES: true,
        PRELOAD_IMAGES: false,
        USE_REQUEST_BATCHING: false      // NEW: Batch multiple API calls
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
        TRACK_AI_ACCURACY: true          // NEW: Track AI performance
    }
};

// Validation function
function validateConfig() {
    if (CONFIG.GAME.MAX_QUESTIONS < 5 || CONFIG.GAME.MAX_QUESTIONS > 30) {
        console.warn('⚠️  MAX_QUESTIONS should be between 5 and 30');
    }
    
    if (CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS < 50 || CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS > 99) {
        console.warn('⚠️  MIN_CONFIDENCE_TO_GUESS should be between 50 and 99');
    }
    
    // Check if BASE_URL is configured
    if (CONFIG.API.BASE_URL.includes('your-backend-url') || 
        CONFIG.API.BASE_URL.includes('sliding-puzzle')) {
        console.warn('⚠️  Please update API.BASE_URL in config.js with your actual Render.com backend URL!');
    }
    
    // Check if Python API is enabled
    if (!CONFIG.FEATURES.USE_PYTHON_API) {
        console.warn('⚠️  Python API is disabled. Using local algorithm only.');
    }
    
    console.log('✅ Config validation complete');
    console.log(`🤖 AI Engine: ${CONFIG.AI.ALGORITHM} v${CONFIG.AI.VERSION}`);
    
    return true;
}

// Initialize configuration
validateConfig();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
