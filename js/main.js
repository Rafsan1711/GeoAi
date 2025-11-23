// main.js - Application initialization and global event handlers

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize animations
    animations.init();

    // Show welcome screen
    game.showWelcomeScreen();

    // Add keyboard shortcuts
    addKeyboardShortcuts();

    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Prevent accidental page refresh
    window.addEventListener('beforeunload', (e) => {
        if (game.state.questionNumber > 0 && game.state.questionNumber < game.state.maxQuestions) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Add gradient to confidence circle
    addSVGGradient();

    // Log initialization
    console.log('🌍 GeoAI initialized successfully!');
    console.log('📊 Dataset loaded:', {
        countries: dataset.country.length,
        cities: dataset.city.length,
        places: dataset.place.length
    });
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
                case 'y':
                    game.answerQuestion('yes');
                    break;
                case '2':
                case 'p':
                    game.answerQuestion('probably');
                    break;
                case '3':
                case 'd':
                    game.answerQuestion('dontknow');
                    break;
                case '4':
                case 'n':
                    game.answerQuestion('probablynot');
                    break;
                case '5':
                case 'x':
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
 * Add SVG gradient for confidence circle
 */
function addSVGGradient() {
    const svg = document.querySelector('.confidence-svg');
    if (!svg) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#3b82f6');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#60a5fa');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);
}

/**
 * Utility: Log game statistics (for debugging)
 */
function logGameStats() {
    if (game.state.possibleItems.length > 0) {
        const stats = aiEngine.getStats(game.state.possibleItems);
        console.log('📈 Current Game Stats:', {
            questionNumber: game.state.questionNumber,
            possibleItems: stats.itemCount,
            confidence: stats.confidence + '%',
            topGuess: game.state.possibleItems[0]?.name,
            topProbability: stats.topProbability?.toFixed(2)
        });
    }
}

/**
 * Utility: Debug mode toggle
 */
let debugMode = false;
window.toggleDebug = () => {
    debugMode = !debugMode;
    console.log('🐛 Debug mode:', debugMode ? 'ON' : 'OFF');
    
    if (debugMode) {
        // Show additional info
        document.addEventListener('click', logGameStats);
    } else {
        document.removeEventListener('click', logGameStats);
    }
};

/**
 * Utility: Export game data (for analysis)
 */
window.exportGameData = () => {
    const data = {
        category: game.state.category,
        answers: game.state.answers,
        questionNumber: game.state.questionNumber,
        finalGuess: aiEngine.getBestGuess(game.state.possibleItems),
        confidence: aiEngine.calculateConfidence(game.state.possibleItems),
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
 * Handle visibility change (pause/resume)
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('⏸️ App paused');
    } else {
        console.log('▶️ App resumed');
    }
});

/**
 * Handle window resize
 */
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        console.log('📐 Window resized:', {
            width: window.innerWidth,
            height: window.innerHeight
        });
    }, 250);
});

/**
 * Performance monitoring
 */
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('⚡ Performance:', {
                loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms',
                domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart) + 'ms'
            });
        }, 0);
    });
}

/**
 * Service Worker registration (optional - for PWA)
 */
if ('serviceWorker' in navigator) {
    // Uncomment to enable PWA features
    // window.addEventListener('load', () => {
    //     navigator.serviceWorker.register('/sw.js')
    //         .then(reg => console.log('✅ Service Worker registered'))
    //         .catch(err => console.log('❌ Service Worker registration failed'));
    // });
}

/**
 * Console welcome message
 */
console.log(`
%c🌍 GeoAI - Mind Reading Geography Game
%cVersion 2.0 | Built with Advanced AI Algorithm
%cCommands:
- toggleDebug() - Enable/disable debug mode
- exportGameData() - Export current game data
`,
'font-size: 20px; font-weight: bold; color: #3b82f6',
'font-size: 12px; color: #9ca3af',
'font-size: 11px; color: #6b7280'
);

// Expose game for debugging
window.game = game;
window.aiEngine = aiEngine;
window.animations = animations;