// main.js - Ultra Application Entry Point

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('%c🌍 GeoAI Ultra - Maximum Accuracy Mode', 'font-size: 20px; font-weight: bold; color: #f59e0b');
    console.log('%cVersion 3.0 Ultra | No Question Limits', 'font-size: 12px; color: #94a3b8');

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

        // Debug mode toggle (Ctrl+D)
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            toggleDebug();
        }

        // Show stats (Ctrl+S)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            getStats();
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
                    console.log('%c⚡ Performance Metrics', 'font-weight: bold; color: #3b82f6');
                    console.table({
                        'Load Time': Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms',
                        'DOM Ready': Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart) + 'ms',
                        'First Paint': Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0) + 'ms'
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
• No question limits (up to 50 questions)
• 99% confidence requirement
• Advanced decision tree algorithm
• Entropy-based information gain
• Smart question pruning
• 157+ countries with rich data

%c🎮 KEYBOARD SHORTCUTS:
• 1-5: Answer questions
• Ctrl+D: Toggle debug mode
• Ctrl+S: Show statistics
• Esc: Exit current screen

%c💻 DEVELOPER COMMANDS:
• toggleDebug() - Toggle debug mode
• getStats() - Get detailed statistics
• exportGameData() - Export current game
• testAlgorithm() - Test algorithm performance
• clearCache() - Clear API cache
• reloadData() - Reload game data

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

/**
 * Utility: Export game data (for debugging)
 */
window.exportGameData = () => {
    const data = {
        mode: 'ultra',
        category: game.state.category,
        answers: game.state.answers,
        questionNumber: game.state.questionNumber,
        maxQuestions: game.state.maxQuestions,
        finalGuess: localAlgorithm.getBestGuess(game.state.possibleItems),
        confidence: localAlgorithm.calculateConfidence(game.state.possibleItems),
        possibleItems: game.state.possibleItems.length,
        itemsData: game.state.possibleItems.slice(0, 10).map(i => ({
            name: i.name,
            probability: i.probability
        })),
        timestamp: new Date().toISOString(),
        config: {
            maxQuestions: CONFIG.GAME.MAX_QUESTIONS,
            minConfidence: CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS,
            earlyStop: CONFIG.GAME.EARLY_STOP_CONFIDENCE
        }
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geoai-ultra-game-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('📥 Game data exported');
};

/**
 * Utility: Toggle debug mode
 */
window.toggleDebug = () => {
    CONFIG.DEBUG.ENABLED = !CONFIG.DEBUG.ENABLED;
    CONFIG.DEBUG.LOG_ALGORITHM = CONFIG.DEBUG.ENABLED;
    CONFIG.DEBUG.LOG_QUESTIONS = CONFIG.DEBUG.ENABLED;
    
    console.log('%c🛠️ Debug mode: ' + (CONFIG.DEBUG.ENABLED ? 'ON' : 'OFF'), 
        'font-weight: bold; color: ' + (CONFIG.DEBUG.ENABLED ? '#10b981' : '#ef4444'));
    
    if (CONFIG.DEBUG.ENABLED) {
        console.log('Current game state:', game.state);
        console.log('Algorithm stage:', localAlgorithm.currentStage);
        console.log('Asked attributes:', Array.from(localAlgorithm.askedAttributes));
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
        game: {
            mode: 'ULTRA',
            category: game.state.category,
            questionNumber: game.state.questionNumber,
            possibleItems: game.state.possibleItems.length,
            askedQuestions: game.state.askedQuestions.length,
            confidence: localAlgorithm.calculateConfidence(game.state.possibleItems) + '%'
        },
        algorithm: {
            currentStage: localAlgorithm.currentStage,
            askedAttributes: Array.from(localAlgorithm.askedAttributes),
            totalQuestions: game.state.questions?.length || 0
        },
        config: {
            maxQuestions: CONFIG.GAME.MAX_QUESTIONS,
            minConfidence: CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS + '%',
            earlyStop: CONFIG.GAME.EARLY_STOP_CONFIDENCE + '%',
            features: {
                decisionTree: CONFIG.FEATURES.USE_DECISION_TREE,
                smartPruning: CONFIG.FEATURES.USE_SMART_PRUNING,
                contextual: CONFIG.FEATURES.USE_CONTEXTUAL_QUESTIONS
            }
        },
        topItems: game.state.possibleItems.slice(0, 5).map(i => ({
            name: i.name,
            probability: (i.probability * 100).toFixed(2) + '%'
        })),
        api: apiHandler.getCacheStats()
    };
    
    console.log('%c📊 ULTRA MODE STATISTICS', 'font-size: 14px; font-weight: bold; color: #f59e0b');
    console.table(stats.game);
    console.log('%cAlgorithm Status:', 'font-weight: bold; color: #3b82f6', stats.algorithm);
    console.log('%cTop Items:', 'font-weight: bold; color: #10b981');
    console.table(stats.topItems);
    console.log('%cFull Stats:', 'color: #6b7280', stats);
    
    return stats;
};

/**
 * Utility: Test algorithm performance
 */
window.testAlgorithm = () => {
    console.log('%c🧪 Testing Algorithm Performance', 'font-size: 14px; font-weight: bold; color: #8b5cf6');
    
    const items = apiHandler.getData('country');
    if (items.length === 0) {
        console.error('❌ No data loaded');
        return;
    }

    console.log('📊 Testing with', items.length, 'countries');
    
    // Test entropy calculation
    const testItems = items.slice(0, 10).map(i => ({ ...i, probability: 1.0 }));
    const entropy = localAlgorithm.calculateEntropy(testItems);
    console.log('🔍 Entropy for 10 items:', entropy.toFixed(3));
    
    // Test information gain
    const testQuestion = game.questionBank.country[0];
    const infoGain = localAlgorithm.calculateInformationGain(testQuestion, testItems);
    console.log('📈 Information Gain:', infoGain.toFixed(3));
    
    // Test confidence calculation
    testItems[0].probability = 0.5;
    const confidence = localAlgorithm.calculateConfidence(testItems);
    console.log('🎯 Confidence:', confidence + '%');
    
    console.log('✅ Algorithm test complete');
};

/**
 * Utility: Reload game data
 */
window.reloadData = async () => {
    console.log('🔄 Reloading game data...');
    await apiHandler.loadAllData();
    console.log('✅ Data reloaded');
    console.log('📊 Stats:', apiHandler.getCacheStats().dataLoaded);
};

/**
 * Utility: Simulate a game
 */
window.simulateGame = (country = 'Bangladesh') => {
    console.log(`%c🎮 Simulating game for: ${country}`, 'font-size: 14px; font-weight: bold; color: #10b981');
    
    const items = apiHandler.getData('country');
    const target = items.find(i => i.name === country);
    
    if (!target) {
        console.error('❌ Country not found:', country);
        return;
    }
    
    console.log('🎯 Target:', target.name);
    console.log('📍 Continent:', target.continent);
    console.log('🗣️ Language:', target.language);
    console.log('🏛️ Government:', target.government);
    console.log('⭐ Famous for:', target.famousFor);
    
    let possibleItems = items.map(i => ({ ...i, probability: 1.0 }));
    let questionCount = 0;
    const maxQuestions = 20;
    
    while (possibleItems.length > 1 && questionCount < maxQuestions) {
        const question = localAlgorithm.selectBestQuestion('country', [], possibleItems);
        if (!question) break;
        
        questionCount++;
        
        // Auto-answer based on target
        const matches = localAlgorithm.checkMatch(target[question.attribute], question.value);
        const answer = matches ? 'yes' : 'no';
        
        console.log(`❓ Q${questionCount}: ${question.question} → ${answer}`);
        
        possibleItems = localAlgorithm.filterItems(possibleItems, question, answer);
        
        const confidence = localAlgorithm.calculateConfidence(possibleItems);
        console.log(`   📊 Items: ${possibleItems.length}, Confidence: ${confidence}%`);
        
        if (possibleItems.length <= 3) {
            console.log('   🔝 Top 3:', possibleItems.map(i => i.name).join(', '));
        }
    }
    
    const finalGuess = localAlgorithm.getBestGuess(possibleItems);
    const finalConfidence = localAlgorithm.calculateConfidence(possibleItems);
    
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6b7280');
    console.log(`%c🎯 Final Guess: ${finalGuess?.name}`, 'font-weight: bold; color: ' + (finalGuess?.name === country ? '#10b981' : '#ef4444'));
    console.log(`%c📊 Confidence: ${finalConfidence}%`, 'font-weight: bold; color: #3b82f6');
    console.log(`%c❓ Questions: ${questionCount}`, 'color: #6b7280');
    console.log(`%c✅ Success: ${finalGuess?.name === country ? 'YES' : 'NO'}`, 'font-weight: bold; color: ' + (finalGuess?.name === country ? '#10b981' : '#ef4444'));
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #6b7280');
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
    console.error('%c❌ Global Error', 'font-weight: bold; color: #ef4444', e.error);
    
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
    console.error('%c❌ Unhandled Promise Rejection', 'font-weight: bold; color: #ef4444', e.reason);
    
    if (CONFIG.DEBUG.ENABLED) {
        console.error('Promise rejection details:', e);
    }
});

// Expose instances for debugging
if (CONFIG.DEBUG.ENABLED) {
    window.game = game;
    window.apiHandler = apiHandler;
    window.localAlgorithm = localAlgorithm;
    window.animationController = animationController;
    window.CONFIG = CONFIG;
}

console.log('%c✨ Type "simulateGame()" to test the algorithm', 'color: #8b5cf6');
