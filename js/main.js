// main.js - Ultra Application Entry Point

/**
 * Global Configuration is expected to be loaded via config.js before this script.
 * We rely on the global 'CONFIG' variable.
 */

// If CONFIG is not defined, we should ensure it is defined (for safety, assuming config.js loads first)
// The error "Identifier 'CONFIG' has already been declared" means config.js re-declares it.
// We remove the line 'const CONFIG = window.CONFIG;' which was a bad practice.

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Check for necessary CONFIG variable loaded from config.js
    if (typeof CONFIG === 'undefined') {
        console.error("CRITICAL ERROR: CONFIG object not found. Ensure config.js loads first.");
        alert("Configuration Error. Please check console and ensure config.js is loaded.");
        return;
    }
    
    console.log('%c🌍 GeoAI Ultra - Maximum Accuracy Mode', 'font-size: 20px; font-weight: bold; color: #f59e0b');
    console.log('%cVersion 3.0 Ultra | Backend Integrated', 'font-size: 12px; color: #94a3b8');

    // Initialize animations
    animationController.init();

    // Initialize game
    await game.initialize();

    // Show welcome screen
    game.showWelcomeScreen();

    // Add keyboard shortcuts
    addKeyboardShortcuts();

    // Log performance metrics
    logPerformanceMetrics();

    // Show console welcome message
    showConsoleWelcome();

    console.log('✅ Ultra Mode Ready!');
});

/**
 * Add keyboard shortcuts for better UX
 */
function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const currentScreen = document.querySelector('.screen.active');
        if (!currentScreen) return;

        // Question screen shortcuts
        if (currentScreen.id === 'questionScreen' && game.state.currentQuestion) {
            switch(e.key) {
                case '1': game.answerQuestion('yes'); break;
                case '2': game.answerQuestion('probably'); break;
                case '3': game.answerQuestion('dontknow'); break;
                case '4': game.answerQuestion('probablynot'); break;
                case '5': game.answerQuestion('no'); break;
            }
        }
        
        // Guess screen shortcuts
        if (currentScreen.id === 'guessScreen' && document.getElementById('guessButtons').classList.contains('hidden') === false) {
            if (e.key === 'y' || e.key === 'Y' || e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('guessYesBtn').click();
            } else if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                document.getElementById('guessNoBtn').click();
            }
        }

        // Result screen shortcuts
        if (currentScreen.id === 'resultScreen') {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                game.playAgain();
            }
        }

        // Global shortcuts
        if (e.key === 'Escape') {
            if (currentScreen.id === 'engineScreen') {
                game.closeEngineScreen();
            } else if (document.getElementById('feedbackModal').classList.contains('visible')) {
                game.closeFeedbackModal();
            } else if (currentScreen.id !== 'welcomeScreen' && currentScreen.id !== 'thinkingScreen') {
                if (confirm('Are you sure you want to exit the current game? All progress will be lost.')) {
                    game.resetGame();
                }
            }
        }

        // Debug mode toggle (Ctrl+D)
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            window.toggleDebug();
        }
    });
}

/**
 * Log performance metrics
 */
function logPerformanceMetrics() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    console.log('%c⚡ Performance Metrics', 'font-weight: bold; color: #3b82f6');
                    console.table({
                        'Load Time': Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms',
                        'DOM Ready': Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart) + 'ms',
                    });
                }
            }, 0);
        });
    }
}

/**
 * Show console welcome message
 */
function showConsoleWelcome() {
    console.log(`
%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
%c🌍 GeoAI Ultra - Maximum Accuracy Mode
%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

%c📊 ULTRA MODE FEATURES:
• New Backend API (Render.com)
• Real-time Learning via User Feedback
• Adaptive Bayesian Algorithm
• 50 Question Limit for Max Precision

%c🎮 KEYBOARD SHORTCUTS:
• 1-5: Answer questions
• Y/N: Yes/No on Guess Screen
• Ctrl+D: Toggle debug mode

%c💻 DEVELOPER COMMANDS:
• toggleDebug() - Toggle debug mode
• getStats() - Get detailed statistics
• game.resetGame() - Start a new game
• game.state - View current game state

%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`,
'color: #6b7280',
'font-size: 16px; font-weight: bold; color: #f59e0b',
'color: #6b7280',
'font-size: 12px; color: #10b981',
'font-size: 12px; color: #3b82f6',
'font-size: 11px; color: #8b5cf6',
'color: #6b7280'
    );
}

// --- Debug & Utility Functions (Exposed to Window) ---

/**
 * Utility: Toggle debug mode
 */
window.toggleDebug = () => {
    // Assuming CONFIG is loaded globally
    if (typeof CONFIG === 'undefined') return; 
    
    CONFIG.DEBUG.ENABLED = !CONFIG.DEBUG.ENABLED;
    CONFIG.DEBUG.LOG_ALGORITHM = CONFIG.DEBUG.ENABLED;
    CONFIG.DEBUG.LOG_QUESTIONS = CONFIG.DEBUG.ENABLED;
    CONFIG.DEBUG.LOG_API_CALLS = CONFIG.DEBUG.ENABLED;
    
    console.log('%c🛠️ Debug mode: ' + (CONFIG.DEBUG.ENABLED ? 'ON' : 'OFF'), 
        'font-weight: bold; color: ' + (CONFIG.DEBUG.ENABLED ? '#10b981' : '#ef4444'));
    
    if (CONFIG.DEBUG.ENABLED) {
        window.game = game;
        window.apiHandler = apiHandler;
        window.CONFIG = CONFIG;
        console.log('Current game state:', game.state);
    } else {
        delete window.game;
        delete window.apiHandler;
    }
};

/**
 * Utility: Get game statistics from backend
 */
window.getStats = async () => {
    // Assuming apiHandler is loaded globally
    if (typeof apiHandler === 'undefined') return;
    
    try {
        const stats = await apiHandler.getStats();
        
        console.log('%c📊 ULTRA MODE STATISTICS (Backend)', 'font-size: 14px; font-weight: bold; color: #f59e0b');
        console.table(stats.local_session_stats);
        console.log('%cData Stats:', 'font-weight: bold; color: #3b82f6', stats.data_stats);
        console.log('%cConfig:', 'font-weight: bold; color: #10b981', stats.config);
        
        return stats;
    } catch (e) {
        console.error("Failed to fetch stats from backend:", e);
        return { error: e.message };
    }
};


/**
 * Handle beforeunload - warn user if game is in progress
 */
window.addEventListener('beforeunload', (e) => {
    if (game.state.questionNumber > 0 && game.state.questionNumber < game.state.maxQuestions) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to exit the current game? All progress will be lost.';
        return e.returnValue;
    }
});

// Initial debug exposure
if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG.ENABLED) {
    window.toggleDebug();
}

console.log('%c✨ Please start a game by clicking "Start Ultra Mode"', 'color: #8b5cf6');
