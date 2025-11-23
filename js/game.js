// game.js - Game state management and flow control

class Game {
    constructor() {
        this.state = {
            category: null,
            currentQuestion: null,
            questionNumber: 0,
            maxQuestions: 15,
            askedQuestions: [],
            possibleItems: [],
            answers: []
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
            'place': 'landmark'
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
    }

    /**
     * Show engine info screen
     */
    showEngineScreen() {
        this.hideAllScreens();
        document.getElementById('engineScreen').classList.add('active');
    }

    /**
     * Close engine screen and return to welcome
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
    startGame(category) {
        this.state.category = category;
        this.state.questionNumber = 0;
        this.state.askedQuestions = [];
        this.state.answers = [];
        
        // Initialize items with probabilities
        this.state.possibleItems = aiEngine.initializeItems([...dataset[category]]);
        
        // Show thinking animation
        this.showThinkingScreen(category);
        
        // Wait for thinking animation then start asking
        setTimeout(() => {
            this.showQuestionScreen();
            this.askNextQuestion();
        }, 3000);
    }

    /**
     * Ask the next question
     */
    askNextQuestion() {
        // Check if we should stop
        if (aiEngine.shouldStopAsking(
            this.state.possibleItems,
            this.state.questionNumber,
            this.state.maxQuestions
        )) {
            this.showResult();
            return;
        }

        // Select best question using AI
        const question = aiEngine.selectBestQuestion(
            this.state.category,
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
        // Update question text
        document.getElementById('questionText').textContent = question.question;

        // Update progress
        const progress = (this.state.questionNumber / this.state.maxQuestions) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = 
            `Question ${this.state.questionNumber} / ${this.state.maxQuestions}`;

        // Update confidence
        const confidence = aiEngine.calculateConfidence(this.state.possibleItems);
        document.getElementById('confidenceValue').textContent = confidence + '%';
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

        // Update possible items using AI
        this.state.possibleItems = aiEngine.filterItems(
            this.state.possibleItems,
            this.state.currentQuestion,
            answer
        );

        // Ask next question after a brief delay for animation
        setTimeout(() => {
            this.askNextQuestion();
        }, 300);
    }

    /**
     * Show final result
     */
    showResult() {
        const bestGuess = aiEngine.getBestGuess(this.state.possibleItems);
        
        if (!bestGuess) {
            // Fallback if no guess available
            this.state.possibleItems = [dataset[this.state.category][0]];
            this.showResult();
            return;
        }

        const confidence = aiEngine.calculateConfidence(this.state.possibleItems);

        // Update result UI
        document.getElementById('resultEmoji').textContent = bestGuess.emoji || '🎯';
        document.getElementById('resultName').textContent = bestGuess.name;
        document.getElementById('resultInfo').innerHTML = `<p>${bestGuess.info}</p>`;
        document.getElementById('finalConfidence').textContent = confidence + '%';
        document.getElementById('questionsAsked').textContent = this.state.questionNumber;
        document.getElementById('possibleMatches').textContent = this.state.possibleItems.length;

        // Animate confidence circle
        this.animateConfidenceCircle(confidence);

        // Show result screen
        this.showResultScreen();
    }

    /**
     * Animate the confidence circle
     */
    animateConfidenceCircle(confidence) {
        const circle = document.getElementById('confidenceCircle');
        const circumference = 2 * Math.PI * 45; // radius is 45
        const offset = circumference - (confidence / 100) * circumference;
        
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference;
        
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 100);
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
            maxQuestions: 15,
            askedQuestions: [],
            possibleItems: [],
            answers: []
        };
        this.showWelcomeScreen();
    }
}

// Create global game instance
const game = new Game();