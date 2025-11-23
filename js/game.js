// game.js - Game State Management and Flow Control

class Game {
    constructor() {
        this.state = {
            category: null,
            currentQuestion: null,
            questionNumber: 0,
            maxQuestions: CONFIG.GAME.MAX_QUESTIONS,
            askedQuestions: [],
            possibleItems: [],
            answers: [],
            questions: null
        };
        
        this.dataLoaded = false;
        this.questionBank = {};
    }

    /**
     * Initialize game data
     */
    async initialize() {
        try {
            // Show loading screen
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.remove('hidden');
            }

            // Load all data
            await apiHandler.loadAllData();
            
            // Load question banks
            await this.loadQuestionBanks();
            
            this.dataLoaded = true;
            
            // Hide loading screen
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                }, 500);
            }

            console.log('✅ Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('Failed to load game data. Please refresh the page.');
        }
    }

    /**
     * Load question banks for all categories
     */
    async loadQuestionBanks() {
        // For now, we'll define questions inline
        // In production, these could come from JSON files
        this.questionBank = {
            country: [
                // Continent questions
                { question: "Is it located in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it located in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it located in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
                { question: "Is it located in North America?", attribute: "continent", value: "northamerica", weight: 1.0 },
                { question: "Is it located in South America?", attribute: "continent", value: "southamerica", weight: 1.0 },
                { question: "Is it located in Oceania?", attribute: "continent", value: "oceania", weight: 1.0 },
                
                // Geographic features
                { question: "Does this country have a coastline?", attribute: "hasCoast", value: true, weight: 0.7 },
                { question: "Does it have major mountain ranges?", attribute: "hasMountains", value: true, weight: 0.6 },
                { question: "Is it an island nation?", attribute: "isIsland", value: true, weight: 0.8 },
                
                // Population
                { question: "Does it have a very large population (over 200 million)?", attribute: "population", value: "verylarge", weight: 0.85 },
                { question: "Does it have a large population (50-200 million)?", attribute: "population", value: "large", weight: 0.7 },
                
                // Climate
                { question: "Does it have a tropical climate?", attribute: "climate", value: "tropical", weight: 0.65 },
                { question: "Does it have a desert climate?", attribute: "climate", value: "desert", weight: 0.75 },
                { question: "Does it have a temperate climate?", attribute: "climate", value: "temperate", weight: 0.6 }
            ],
            
            city: [
                { question: "Is it a capital city?", attribute: "isCapital", value: true, weight: 0.85 },
                { question: "Is it located in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it located in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it located in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
                { question: "Does a major river run through it?", attribute: "hasRiver", value: true, weight: 0.7 },
                { question: "Does it have a metro/subway system?", attribute: "hasMetro", value: true, weight: 0.6 },
                { question: "Is it a very large city (over 10 million people)?", attribute: "size", value: "verylarge", weight: 0.8 }
            ],
            
            place: [
                { question: "Is it located in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it located in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it located in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
                { question: "Is it a monument or memorial?", attribute: "type", value: "monument", weight: 0.8 },
                { question: "Is it from ancient times (over 2000 years old)?", attribute: "age", value: "ancient", weight: 0.85 },
                { question: "Is it a completely natural place (not man-made)?", attribute: "isNatural", value: true, weight: 0.85 },
                { question: "Is it a religious or spiritual site?", attribute: "isReligious", value: true, weight: 0.8 },
                { question: "Can tourists visit it?", attribute: "visitorsAllowed", value: true, weight: 0.5 }
            ]
        };
    }

    /**
     * Show welcome screen
     */
    showWelcomeScreen() {
        this.hideAllScreens();
        document.getElementById('welcomeScreen').classList.add('active');
    }

    /**
     * Show category selection screen
     */
    showCategoryScreen() {
        this.hideAllScreens();
        document.getElementById('categoryScreen').classList.add('active');
    }

    /**
     * Show thinking screen
     */
    showThinkingScreen(category) {
        this.hideAllScreens();
        
        const categoryNames = {
            'country': 'country',
            'city': 'city',
            'place': 'historic place'
        };
        
        document.getElementById('thinkingCategory').textContent = categoryNames[category];
        document.getElementById('thinkingScreen').classList.add('active');
    }

    /**
     * Show question screen
     */
    showQuestionScreen() {
        this.hideAllScreens();
        document.getElementById('questionScreen').classList.add('active');
    }

    /**
     * Show result screen
     */
    showResultScreen() {
        this.hideAllScreens();
        document.getElementById('resultScreen').classList.add('active');
        
        // Trigger confetti animation
        if (CONFIG.UI.ENABLE_ANIMATIONS) {
            animationController.createConfetti();
        }
    }

    /**
     * Show engine info screen
     */
    showEngineScreen() {
        this.hideAllScreens();
        document.getElementById('engineScreen').classList.add('active');
    }

    /**
     * Close engine screen
     */
    closeEngineScreen() {
        this.showWelcomeScreen();
    }

    /**
     * Hide all screens
     */
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    /**
     * Start a new game
     */
    async startGame(category) {
        if (!this.dataLoaded) {
            alert('Game data is still loading. Please wait...');
            return;
        }

        this.state.category = category;
        this.state.questionNumber = 0;
        this.state.askedQuestions = [];
        this.state.answers = [];
        this.state.questions = this.questionBank[category] || [];
        
        // Get items for category
        const items = apiHandler.getData(category);
        if (items.length === 0) {
            alert('No data available for this category.');
            return;
        }

        // Initialize items with probabilities
        this.state.possibleItems = items.map(item => ({
            ...item,
            probability: 1.0
        }));
        
        // Show thinking animation
        this.showThinkingScreen(category);
        
        // Wait for thinking animation then start asking
        setTimeout(() => {
            this.showQuestionScreen();
            this.askNextQuestion();
        }, CONFIG.GAME.THINKING_DURATION);
    }

    /**
     * Ask the next question
     */
    async askNextQuestion() {
        // Check if we should stop
        if (localAlgorithm.shouldStopAsking(
            this.state.possibleItems,
            this.state.questionNumber,
            this.state.maxQuestions
        )) {
            this.showResult();
            return;
        }

        // Select best question
        const question = localAlgorithm.selectBestQuestion(
            this.state.questions,
            this.state.askedQuestions,
            this.state.possibleItems
        );

        if (!question) {
            this.showResult();
            return;
        }

        this.state.currentQuestion = question;
        this.state.questionNumber++;
        this.state.askedQuestions.push(question.question);

        // Update UI
        this.updateQuestionUI(question);
    }

    /**
     * Update question UI
     */
    updateQuestionUI(question) {
        // Update question text with animation
        const questionText = document.getElementById('questionText');
        questionText.style.opacity = '0';
        
        setTimeout(() => {
            questionText.textContent = question.question;
            questionText.style.opacity = '1';
        }, 150);

        // Update progress
        const progress = (this.state.questionNumber / this.state.maxQuestions) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = 
            `Question ${this.state.questionNumber} / ${this.state.maxQuestions}`;

        // Update confidence
        const confidence = localAlgorithm.calculateConfidence(this.state.possibleItems);
        document.getElementById('confidenceValue').textContent = confidence + '%';
        
        const confidenceBar = document.getElementById('confidenceBar');
        if (confidenceBar) {
            confidenceBar.style.width = confidence + '%';
        }

        // Update AI reaction emoji based on confidence and progress
        this.updateReactionEmoji(confidence, this.state.questionNumber);
    }

    /**
     * Update AI reaction emoji based on game state
     */
    updateReactionEmoji(confidence, questionNumber) {
        const reactionEmoji = document.getElementById('reactionEmoji');
        const reactionText = document.getElementById('reactionText');
        
        if (!reactionEmoji || !reactionText) return;

        let emoji = '🤔';
        let text = 'Thinking...';

        if (confidence < 20) {
            emoji = '😕';
            text = 'Confused...';
        } else if (confidence >= 20 && confidence < 40) {
            emoji = '🤔';
            text = 'Thinking...';
        } else if (confidence >= 40 && confidence < 60) {
            emoji = '🧐';
            text = 'Analyzing...';
        } else if (confidence >= 60 && confidence < 80) {
            emoji = '😊';
            text = 'Getting closer!';
        } else if (confidence >= 80) {
            emoji = '😃';
            text = 'Almost there!';
        }

        // Add animation
        reactionEmoji.style.animation = 'none';
        setTimeout(() => {
            reactionEmoji.textContent = emoji;
            reactionEmoji.style.animation = 'reactionPulse 1.5s ease-in-out infinite';
        }, 10);
        
        reactionText.textContent = text;
    }

    /**
     * Handle user answer
     */
    answerQuestion(answer) {
        // Store answer
        this.state.answers.push({
            question: this.state.currentQuestion.question,
            answer: answer
        });

        // Update possible items
        this.state.possibleItems = localAlgorithm.filterItems(
            this.state.possibleItems,
            this.state.currentQuestion,
            answer
        );

        // Ask next question after delay
        setTimeout(() => {
            this.askNextQuestion();
        }, CONFIG.GAME.QUESTION_DELAY);
    }

    /**
     * Show final result
     */
    showResult() {
        const bestGuess = localAlgorithm.getBestGuess(this.state.possibleItems);
        
        if (!bestGuess) {
            // Fallback
            const items = apiHandler.getData(this.state.category);
            if (items.length > 0) {
                this.state.possibleItems = [items[0]];
                this.showResult();
            }
            return;
        }

        const confidence = localAlgorithm.calculateConfidence(this.state.possibleItems);

        // Update result UI
        document.getElementById('resultEmoji').textContent = bestGuess.emoji || '🎯';
        document.getElementById('resultName').textContent = bestGuess.name;
        document.getElementById('resultInfo').innerHTML = `<p class="info-text">${bestGuess.info || 'No additional information available.'}</p>`;
        document.getElementById('finalConfidence').textContent = confidence;
        document.getElementById('questionsAsked').textContent = this.state.questionNumber;
        document.getElementById('possibleMatches').textContent = this.state.possibleItems.length;

        // Animate confidence circle
        this.animateConfidenceCircle(confidence);

        // Show result screen
        this.showResultScreen();
    }

    /**
     * Animate confidence circle
     */
    animateConfidenceCircle(confidence) {
        const circle = document.getElementById('confidenceCircle');
        const circumference = 2 * Math.PI * 54; // radius is 54
        const offset = circumference - (confidence / 100) * circumference;
        
        if (circle) {
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = circumference;
            
            setTimeout(() => {
                circle.style.strokeDashoffset = offset;
            }, 100);
        }
    }

    /**
     * Play again with same category
     */
    playAgain() {
        if (this.state.category) {
            this.startGame(this.state.category);
        } else {
            this.showCategoryScreen();
        }
    }

    /**
     * Reset game completely
     */
    resetGame() {
        this.state = {
            category: null,
            currentQuestion: null,
            questionNumber: 0,
            maxQuestions: CONFIG.GAME.MAX_QUESTIONS,
            askedQuestions: [],
            possibleItems: [],
            answers: [],
            questions: null
        };
        this.showWelcomeScreen();
    }
}

// Create global game instance
const game = new Game();
