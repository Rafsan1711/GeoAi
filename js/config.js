// config.js - Ultra Configuration for Maximum Accuracy

const CONFIG = {
    // API Configuration
    API: {
        // CRITICAL FIX: Use the actual Render Web Service URL for the Backend
        BASE_URL: 'https://sliding-puzzle-with-solver-ida-1.onrender.com', 
        TIMEOUT: 10000, // 10 seconds for robustness
        ENDPOINTS: { /* Defined in api_enhanced.js */ }
    },

    // Game Configuration - ULTRA MODE
    GAME: {
        MAX_QUESTIONS: 50,  // Max limit
        MIN_CONFIDENCE_TO_GUESS: 95, // Min confidence to stop asking
        EARLY_STOP_CONFIDENCE: 99,  // Early stop
        MIN_ITEMS_TO_GUESS: 1,  // Continue until 1 item
        THINKING_DURATION: 3000, // Longer thinking time for better user experience
        QUESTION_DELAY: 500, // Delay between questions
        
        // Advanced stopping criteria (Handled by backend)
        ADAPTIVE_STOPPING: true,
    },

    // Data Paths
    DATA: {
        PATHS: {
            COUNTRIES: 'data/countries.json',
            CITIES: 'data/cities.json',
            PLACES: 'data/places.json',
            QUESTIONS: 'data/questions.json' // New consolidated question bank
        }
    },
    
    // UI Colors (Used for dynamic status display)
    COLORS: {
        SUCCESS: '#10b981',
        ERROR: '#ef4444',
        PRIMARY: '#6366f1'
    },

    // Feature Flags (Frontend only)
    FEATURES: {
        USE_PYTHON_API: true, // Now mandatory
        USE_SESSION_API: true, // Now mandatory
        ENABLE_PWA: false,
    },

    // UI Configuration
    UI: {
        ENABLE_ANIMATIONS: true,
        CONFETTI_COUNT: 50,
        PARTICLE_COUNT: 30
    },

    // Debug Configuration
    DEBUG: {
        ENABLED: true, // Start in Debug mode for easier initial testing
        LOG_API_CALLS: true,
        LOG_ALGORITHM: false, // Algorithm logic is now on the backend
        LOG_QUESTIONS: false
    }
};
