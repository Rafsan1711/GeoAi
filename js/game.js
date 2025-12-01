// game_enhanced.js - Ultra Game Manager with Backend Integration

class Game {
    constructor() {
        this.state = {
            category: null,
            currentQuestion: null,
            questionNumber: 0,
            maxQuestions: CONFIG.GAME.MAX_QUESTIONS,
            askedQuestions: [],
            possibleItems: [], // Used for initial loading and UI display, backend handles logic
            answers: [],
            questions: null, // Full question bank for the category
            usingBackend: false,
            sessionId: null,
            maxConfidence: 0
        };
        
        this.dataLoaded = false;
        this.questionBank = {}; // Full question bank loaded from data files
        this.thinkingDuration = CONFIG.GAME.THINKING_DURATION;
    }

    async initialize() {
        try {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.remove('hidden');
            }

            const data = await apiHandler.loadAllData();
            this.questionBank = data.questions;
            
            this.dataLoaded = true;
            this.state.usingBackend = apiHandler.backendHealthy;
            
            if (!this.state.usingBackend) {
                 document.getElementById('backendStatus').textContent = "❌ Backend Offline. Ultra Mode Disabled.";
                 document.getElementById('backendStatus').style.color = CONFIG.COLORS.ERROR;
                 console.error("Backend API required for Ultra Mode is unavailable. Game will likely fail.");
            } else {
                 document.getElementById('backendStatus').textContent = "✅ Ultra Mode Ready (Backend Active)";
                 document.getElementById('backendStatus').style.color = CONFIG.COLORS.SUCCESS;
            }
            
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                }, 500);
            }

            console.log('✅ Game initialized - Ultra Accuracy Mode');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert(`GeoAI Ultra Mode requires a running backend. Error: ${error.message}. Switching to Welcome Screen.`);
            this.showWelcomeScreen();
        }
    }

    // --- UI Management ---
    showWelcomeScreen() {
        this.hideAllScreens();
        document.getElementById('welcomeScreen').classList.add('active');
    }

    showCategoryScreen() {
        this.hideAllScreens();
        document.getElementById('categoryScreen').classList.add('active');
        document.getElementById('categoryCountCountry').textContent = `${apiHandler.getData('country').length}+ Items`;
        document.getElementById('categoryCountCity').textContent = `${apiHandler.getData('city').length}+ Items`;
        document.getElementById('categoryCountPlace').textContent = `${apiHandler.getData('place').length}+ Items`;
    }

    showEngineScreen() {
        this.hideAllScreens();
        document.getElementById('engineScreen').classList.add('active');
    }

    closeEngineScreen() {
        this.showWelcomeScreen();
    }

    showThinkingScreen(category) {
        this.hideAllScreens();
        const categoryNames = {
            'country': 'country',
            'city': 'city',
            'place': 'historic place'
        };
        document.getElementById('thinkingCategory').textContent = categoryNames[category];
        document.getElementById('thinkingScreen').classList.add('active');
        
        const progressBarFill = document.querySelector('.thinking-progress-fill');
        if (progressBarFill) {
            progressBarFill.style.animation = 'none';
            progressBarFill.offsetHeight; 
            progressBarFill.style.animation = `thinkingProgress ${this.thinkingDuration}ms ease-in-out forwards`;
        }
    }

    showQuestionScreen() {
        this.hideAllScreens();
        document.getElementById('questionScreen').classList.add('active');
        document.getElementById('questionText').textContent = 'Thinking...';
    }
    
    showGuessScreen() {
        this.hideAllScreens();
        document.getElementById('guessScreen').classList.add('active');
    }

    showResultScreen() {
        this.hideAllScreens();
        document.getElementById('resultScreen').classList.add('active');
        if (CONFIG.UI.ENABLE_ANIMATIONS) {
            animationController.createConfetti();
        }
    }
    
    showFeedbackModal(guessName) {
        document.getElementById('guessResultName').textContent = guessName;
        document.getElementById('feedbackModal').classList.add('visible');
        this.loadActualAnswers(this.state.category);
    }
    
    closeFeedbackModal() {
        document.getElementById('feedbackModal').classList.remove('visible');
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

    // --- Game Flow ---
    
    async startGame(category) {
        if (!this.dataLoaded || !this.state.usingBackend) {
            alert('Backend not ready or data loading failed. Please check console.');
            return;
        }

        this.state.category = category;
        this.state.questionNumber = 0;
        this.state.maxConfidence = 0;
        this.state.questions = this.questionBank[category] || [];
        this.state.possibleItems = apiHandler.getData(category);

        if (this.state.questions.length === 0 || this.state.possibleItems.length === 0) {
             alert('No questions or data available for this category.');
             return;
        }
        
        this.showThinkingScreen(category);
        
        try {
            const startData = await apiHandler.startGame(category, this.state.questions);
            this.state.sessionId = startData.session_id;

            setTimeout(() => {
                this.showQuestionScreen();
                this.askNextQuestion();
            }, this.thinkingDuration);

        } catch(e) {
            console.error("Game start failed:", e);
            alert(`Failed to start game session: ${e.message}. Please check backend logs.`);
            this.showCategoryScreen();
        }
    }

    async askNextQuestion() {
        if (!this.state.sessionId) return;
        
        document.getElementById('questionText').style.opacity = '0.5';
        document.getElementById('typingIndicator').classList.add('active');
        
        try {
            const data = await apiHandler.getNextQuestion(this.state.sessionId);
            
            document.getElementById('typingIndicator').classList.remove('active');
            document.getElementById('questionText').style.opacity = '1';
            
            this.updateConfidenceUI(data.confidence, data.questions_asked);
            
            if (data.ready_to_guess) {
                this.showGuessScreen();
                this.makePrediction();
                return;
            }

            this.state.currentQuestion = data.question;
            this.state.questionNumber = data.questions_asked;

            this.updateQuestionUI(data.question);

        } catch(e) {
            console.error("Error fetching question:", e);
            document.getElementById('questionText').textContent = "An error occurred while fetching the next question.";
            this.updateConfidenceUI(0, this.state.questionNumber);
        }
    }

    async answerQuestion(answer) {
        if (!this.state.sessionId || !this.state.currentQuestion) return;

        this.state.answers.push({
            question: this.state.currentQuestion.question,
            answer: answer
        });
        
        document.getElementById('questionText').style.opacity = '0.5';
        
        try {
            const data = await apiHandler.processAnswer(this.state.sessionId, answer);

            document.getElementById('questionText').style.opacity = '1';
            
            this.updateConfidenceUI(data.confidence, this.state.questionNumber);
            
            if (data.should_stop) {
                this.showGuessScreen();
                setTimeout(() => this.makePrediction(), CONFIG.GAME.QUESTION_DELAY * 2);
                return;
            }

            setTimeout(() => {
                this.askNextQuestion();
            }, CONFIG.GAME.QUESTION_DELAY);

        } catch(e) {
            console.error("Error processing answer:", e);
            document.getElementById('questionText').textContent = "Error processing answer. Please try again.";
        }
    }

    // --- UI Update Logic ---
    updateQuestionUI(question) {
        const questionText = document.getElementById('questionText');
        questionText.style.opacity = '0';
        
        setTimeout(() => {
            questionText.textContent = question.question;
            questionText.style.opacity = '1';
        }, 150);
    }
    
    updateConfidenceUI(confidence, questionsAsked) {
        this.state.maxConfidence = Math.max(this.state.maxConfidence, confidence);
        
        const progress = Math.min((questionsAsked / this.state.maxQuestions) * 100, 100);
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = 
            `Question ${questionsAsked} / ${this.state.maxQuestions}`;

        document.getElementById('confidenceValue').textContent = `${confidence}%`;
        document.getElementById('confidenceBar').style.width = confidence + '%';
    }

    // --- Prediction & Feedback ---
    
    async makePrediction() {
        if (!this.state.sessionId) return;
        
        document.getElementById('guessStatus').textContent = "Thinking... Finalizing Prediction...";
        document.getElementById('guessSpinner').classList.remove('hidden');
        document.getElementById('guessButtons').classList.add('hidden');
        
        try {
            const result = await apiHandler.getPrediction(this.state.sessionId);
            
            document.getElementById('guessName').textContent = result.prediction.name;
            document.getElementById('guessConfidence').textContent = `${result.confidence}%`;
            document.getElementById('guessInfo').textContent = result.prediction.info;
            document.getElementById('questionsCount').textContent = result.questions_asked;
            
            this.hideAllScreens();
            document.getElementById('guessScreen').classList.add('active');
            
            document.getElementById('guessYesBtn').onclick = () => this.handleGuess(true, result);
            document.getElementById('guessNoBtn').onclick = () => this.handleGuess(false, result);
            
            document.getElementById('guessStatus').textContent = `Is it ${result.prediction.name}?`;
            document.getElementById('guessSpinner').classList.add('hidden');
            document.getElementById('guessButtons').classList.remove('hidden');
            
        } catch(e) {
            console.error("Prediction failed:", e);
            alert(`Failed to make final prediction: ${e.message}`);
            this.showCategoryScreen();
        }
    }
    
    async handleGuess(isCorrect, result) {
        const targetElement = document.getElementById('guessScreen');
        animationController.fadeOut(targetElement, 300);
        
        if (isCorrect) {
            this.showFinalResult(result);
        } else {
            this.showFeedbackModal(result.prediction.name);
        }
    }
    
    loadActualAnswers(category) {
        const items = apiHandler.getData(category);
        const listContainer = document.getElementById('actualAnswerList');
        listContainer.innerHTML = ''; 
        
        const names = items.map(i => i.name).sort(); 
        
        names.slice(0, 50).forEach(name => { 
            const button = document.createElement('button');
            button.className = 'btn btn-secondary btn-feedback-choice';
            button.textContent = name;
            button.onclick = () => this.submitCorrection(name);
            listContainer.appendChild(button);
        });
    }
    
    async submitCorrection(actualAnswerName) {
        this.closeFeedbackModal();
        this.showThinkingScreen(this.state.category);
        
        try {
            // FIX: Change submitCorrection to submitFeedback as defined in api_enhanced.js
            const data = await apiHandler.submitFeedback(this.state.sessionId, actualAnswerName); 
            
            this.state.questionNumber = data.questions_asked; 
            
            if (data.questions_asked >= this.state.maxQuestions) {
                alert("Max questions reached. Forcing a final guess after learning.");
                this.makePrediction();
            } else {
                this.thinkingDuration = 1000;
                setTimeout(() => {
                    this.showQuestionScreen();
                    this.askNextQuestion();
                }, 1000);
            }
        } catch (e) {
             console.error("Correction submission failed:", e);
             alert("Error processing correction. Please start a new game.");
             this.resetGame();
        }
    }
    
    // --- Final Display ---
    
    showFinalResult(result) {
        const prediction = result.prediction;
        const confidence = result.confidence;

        document.getElementById('resultEmoji').textContent = prediction.emoji || '🎯';
        document.getElementById('resultName').textContent = prediction.name;
        document.getElementById('resultInfo').innerHTML = `
            <div class="info-icon">ℹ️</div>
            <p class="info-text">${prediction.info || 'No additional information available.'}</p>
        `;
        document.getElementById('finalConfidence').textContent = confidence;
        document.getElementById('questionsAsked').textContent = result.questions_asked;
        document.getElementById('possibleMatches').textContent = result.remaining_items;
        document.getElementById('maxConfidenceReached').textContent = this.state.maxConfidence;


        this.animateConfidenceCircle(confidence);
        this.showResultScreen();
    }

    animateConfidenceCircle(confidence) {
        const circle = document.getElementById('confidenceCircle');
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (confidence / 100) * circumference;
        
        if (circle) {
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = circumference;
            
            setTimeout(() => {
                circle.style.strokeDashoffset = offset;
            }, 100);
        }
    }

    playAgain() {
        if (this.state.category) {
            this.startGame(this.state.category);
        } else {
            this.showCategoryScreen();
        }
    }

    resetGame() {
        if (this.state.sessionId) {
            // No cleanup needed, session is handled by prediction/expiration
        }
        this.state = {
            category: null, currentQuestion: null, questionNumber: 0, maxQuestions: CONFIG.GAME.MAX_QUESTIONS,
            askedQuestions: [], possibleItems: [], answers: [], questions: null, usingBackend: false, sessionId: null, maxConfidence: 0
        };
        this.showWelcomeScreen();
    }
}

const game = new Game();
