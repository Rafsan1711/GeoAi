// config.js - Application Configuration

const CONFIG = {
    // API Configuration
    API: {
        // Update this URL after deploying to Render.com
        BASE_URL: 'https://sliding-puzzle-with-solver-ida-1.onrender.com',  // Change this!
        ENDPOINTS: {
            PREDICT: '/api/predict',
            GET_QUESTION: '/api/question',
            FILTER: '/api/filter',
            DATA: '/api/data',
            STATS: '/api/stats',
            LOAD_DATA: '/api/load-data'
        },
        TIMEOUT: 15000, // 15 seconds
        RETRY_ATTEMPTS: 3
    },

    // Game Configuration
    GAME: {
        MAX_QUESTIONS: 15,
        MIN_CONFIDENCE_TO_GUESS: 85,
        THINKING_DURATION: 3000, // 3 seconds
        QUESTION_DELAY: 300, // milliseconds
        ANIMATION_DURATION: 600 // milliseconds
    },

    // Data Configuration
    DATA: {
        PATHS: {
            COUNTRIES: './data/countries.json',
            CITIES: './data/cities.json',
            PLACES: './data/places.json'
        }
    },

    // Answer Weights for Algorithm
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
        THEME: 'dark'
    },

    // Debug Configuration
    DEBUG: {
        ENABLED: false,
        LOG_API_CALLS: true,
        LOG_STATE_CHANGES: false,
        SHOW_PROBABILITY_SCORES: false
    },

    // Feature Flags
    FEATURES: {
        USE_PYTHON_API: true, // ✅ Enable Python backend
        USE_LOCAL_ALGORITHM: true, // Fallback if API fails
        ENABLE_MULTIPLAYER: false,
        ENABLE_LEADERBOARD: false
    },

    // Performance
    PERFORMANCE: {
        LAZY_LOAD_DATA: false,
        CACHE_API_RESPONSES: true,
        PRELOAD_IMAGES: false
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
        TRACK_ERRORS: true
    }
};

// Validation function
function validateConfig() {
    if (CONFIG.GAME.MAX_QUESTIONS < 5 || CONFIG.GAME.MAX_QUESTIONS > 30) {
        console.warn('MAX_QUESTIONS should be between 5 and 30');
    }
    
    if (CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS < 50 || CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS > 99) {
        console.warn('MIN_CONFIDENCE_TO_GUESS should be between 50 and 99');
    }
    
    // Check if BASE_URL is configured
    if (CONFIG.API.BASE_URL.includes('your-backend-url')) {
        console.warn('⚠️  Please update API.BASE_URL in config.js with your Render.com backend URL!');
    }
    
    return true;
}

// Initialize configuration
validateConfig();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
        }
