// main.js - Application Entry Point

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🌍 GeoAI - Mind Reading Geography Game');
    console.log('Version 2.0 | Initializing...');

    // Initialize animations
    animationController.init();

    // Initialize game
    await game.initialize();

    // Show welcome screen
    game.showWelcomeScreen();

    // Add keyboard shortcuts
    addKeyboardShortcuts();

    // Add visibility change handler
    addVisibilityHandler();

    // Add window resize handler
    addResizeHandler();

    // Log performance metrics
    logPerformanceMetrics();

    // Show console welcome message
    showConsoleWelcome();

    console.log('✅ Application ready!');
});

/**
 * Add keyboard shortcuts for better UX
 */
function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const currentScreen = document.querySelector('.screen.active');
        if (!currentScreen) return;

        // Question screen shortcuts
        if (currentScreen.id === 'questionScreen') {
            switch(e.key) {
                case '1':
                    game.answerQuestion('yes');
                    break;
                case '2':
                    game.answerQuestion('probably');
                    break;
                case '3':
                    game.answerQuestion('dontknow');
                    break;
                case '4':
                    game.answerQuestion('probablynot');
                    break;
                case '5':
                    game.answerQuestion('no');
                    break;
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
            } else if (currentScreen.id !== 'welcomeScreen') {
                if (confirm('Are you sure you want to exit the current game?')) {
                    game.showWelcomeScreen();
                }
            }
        }
    });
}

/**
 * Add visibility change handler
 */
function addVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (CONFIG.DEBUG.ENABLED) {
                console.log('⏸️ App paused (tab hidden)');
            }
        } else {
            if (CONFIG.DEBUG.ENABLED) {
                console.log('▶️ App resumed (tab visible)');
            }
        }
    });
}

/**
 * Add window resize handler
 */
function addResizeHandler() {
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (CONFIG.DEBUG.ENABLED) {
                console.log('📐 Window resized:', {
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            }
        }, 250);
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
                    console.log('⚡ Performance Metrics:', {
                        loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms',
                        domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart) + 'ms',
                        firstPaint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0) + 'ms'
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
%c🌍 GeoAI - Mind Reading Geography Game
%cVersion 2.0 | Built with Advanced AI Algorithm
%cCommands:
• toggleDebug() - Toggle debug mode
• exportGameData() - Export current game data
• clearCache() - Clear API cache
• getStats() - Get game statistics
`,
'font-size: 20px; font-weight: bold; color: #6366f1',
'font-size: 12px; color: #94a3b8',
'font-size: 11px; color: #64748b'
    );
}

/**
 * Utility: Export game data (for debugging)
 */
window.exportGameData = () => {
    const data = {
        category: game.state.category,
        answers: game.state.answers,
        questionNumber: game.state.questionNumber,
        finalGuess: localAlgorithm.getBestGuess(game.state.possibleItems),
        confidence: localAlgorithm.calculateConfidence(game.state.possibleItems),
        possibleItems: game.state.possibleItems.length,
        timestamp: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geoai-game-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('📥 Game data exported');
};

/**
 * Utility: Toggle debug mode
 */
window.toggleDebug = () => {
    CONFIG.DEBUG.ENABLED = !CONFIG.DEBUG.ENABLED;
    console.log('🛠️ Debug mode:', CONFIG.DEBUG.ENABLED ? 'ON' : 'OFF');
    
    if (CONFIG.DEBUG.ENABLED) {
        console.log('Current game state:', game.state);
    }
};

/**
 * Utility: Clear API cache
 */
window.clearCache = () => {
    apiHandler.clearCache();
    console.log('🗑️ API cache cleared');
};

/**
 * Utility: Get game statistics
 */
window.getStats = () => {
    const stats = {
        gameState: {
            category: game.state.category,
            questionNumber: game.state.questionNumber,
            possibleItems: game.state.possibleItems.length,
            askedQuestions: game.state.askedQuestions.length
        },
        apiCache: apiHandler.getCacheStats(),
        performance: {
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
            } : 'N/A'
        }
    };
    
    console.table(stats.gameState);
    console.log('📊 Full stats:', stats);
    return stats;
};

/**
 * Utility: Test API connection
 */
window.testAPI = async () => {
    console.log('🔌 Testing API connection...');
    
    try {
        const response = await fetch(CONFIG.API.BASE_URL);
        const data = await response.json();
        console.log('✅ API connected:', data);
        return data;
    } catch (error) {
        console.error('❌ API connection failed:', error);
        return null;
    }
};

/**
 * Utility: Reload game data
 */
window.reloadData = async () => {
    console.log('🔄 Reloading game data...');
    await apiHandler.loadAllData();
    console.log('✅ Data reloaded');
};

/**
 * Handle beforeunload - warn user if game is in progress
 */
window.addEventListener('beforeunload', (e) => {
    if (game.state.questionNumber > 0 && game.state.questionNumber < game.state.maxQuestions) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

/**
 * Handle errors globally
 */
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    
    if (CONFIG.DEBUG.ENABLED) {
        console.error('Error details:', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno
        });
    }
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    
    if (CONFIG.DEBUG.ENABLED) {
        console.error('Promise rejection details:', e);
    }
});

/**
 * Service Worker registration (for PWA - optional)
 */
if ('serviceWorker' in navigator && CONFIG.FEATURES.ENABLE_PWA) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker registered:', reg.scope))
            .catch(err => console.log('❌ Service Worker registration failed:', err));
    });
}

// Expose instances for debugging
if (CONFIG.DEBUG.ENABLED) {
    window.game = game;
    window.apiHandler = apiHandler;
    window.localAlgorithm = localAlgorithm;
    window.animationController = animationController;
    window.CONFIG = CONFIG;
}
