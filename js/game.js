// game.js - Updated for Flexible Question Limits

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
            questions: null,
            usingBackend: false,
            sessionId: null
        };
        
        this.dataLoaded = false;
        this.questionBank = {};
    }

    /**
     * Initialize game data
     */
    async initialize() {
        try {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.remove('hidden');
            }

            await apiHandler.loadAllData();
            await this.loadQuestionBanks();
            
            this.dataLoaded = true;
            
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                }, 500);
            }

            console.log('✅ Game initialized successfully');
            console.log(`🎯 Max questions: ${CONFIG.GAME.MAX_QUESTIONS}, Min confidence: ${CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS}%`);
            
            if (CONFIG.FEATURES.USE_PYTHON_API) {
                if (apiHandler.backendHealthy) {
                    console.log('🤖 Backend AI: ACTIVE');
                } else {
                    console.log('💻 Local Algorithm: ACTIVE (Backend unavailable)');
                }
            }
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('Failed to load game data. Please refresh the page.');
        }
    }

    /**
     * Load question banks for all categories
     */
    async loadQuestionBanks() {
        this.questionBank = {
            country: [
                { question: "Is it located in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it located in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it located in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
                { question: "Is it located in North America?", attribute: "continent", value: "northamerica", weight: 1.0 },
                { question: "Is it located in South America?", attribute: "continent", value: "southamerica", weight: 1.0 },
                { question: "Is it located in Oceania?", attribute: "continent", value: "oceania", weight: 1.0 },
                
                { question: "Does this country have a coastline?", attribute: "hasCoast", value: true, weight: 0.7 },
                { question: "Does it have major mountain ranges?", attribute: "hasMountains", value: true, weight: 0.6 },
                { question: "Is it an island nation?", attribute: "isIsland", value: true, weight: 0.8 },
                { question: "Is it a landlocked country?", attribute: "landlocked", value: true, weight: 0.8 },
                
                { question: "Does it have a very large population (over 200 million)?", attribute: "population", value: "verylarge", weight: 0.85 },
                { question: "Does it have a large population (50-200 million)?", attribute: "population", value: "large", weight: 0.7 },
                
                { question: "Does it have a tropical climate?", attribute: "climate", value: "tropical", weight: 0.65 },
                { question: "Does it have a desert climate?", attribute: "climate", value: "desert", weight: 0.75 },
                { question: "Does it have a temperate climate?", attribute: "climate", value: "temperate", weight: 0.6 },
                { question: "Does it have a cold climate?", attribute: "climate", value: "cold", weight: 0.7 },
                
                { question: "Is it famous for cricket?", attribute: "famousFor", value: "cricket", weight: 0.9 },
                { question: "Is it famous for technology and innovation?", attribute: "famousFor", value: "technology", weight: 0.8 },
                { question: "Is it famous for the pyramids?", attribute: "famousFor", value: "pyramids", weight: 0.95 },
                { question: "Is it famous for football/soccer?", attribute: "famousFor", value: "football", weight: 0.85 },
                { question: "Is it famous for Bollywood?", attribute: "famousFor", value: "bollywood", weight: 0.95 },
                { question: "Is it famous for the Eiffel Tower?", attribute: "famousFor", value: "eiffeltower", weight: 0.95 },
                { question: "Is it famous for the Great Wall?", attribute: "famousFor", value: "greatwall", weight: 0.95 },
                { question: "Is it famous for unique wildlife like kangaroos?", attribute: "famousFor", value: "wildlife", weight: 0.9 },
                
                { question: "Is Bengali the primary language?", attribute: "language", value: "bengali", weight: 0.95 },
                { question: "Is English the primary language?", attribute: "language", value: "english", weight: 0.7 },
                { question: "Is French the primary language?", attribute: "language", value: "french", weight: 0.9 },
                { question: "Is Arabic the primary language?", attribute: "language", value: "arabic", weight: 0.8 },
                { question: "Is Chinese the primary language?", attribute: "language", value: "chinese", weight: 0.9 },
                { question: "Is Spanish the primary language?", attribute: "language", value: "spanish", weight: 0.85 },
                
                { question: "Is it in South Asia?", attribute: "region", value: "south", weight: 0.75 },
                { question: "Is it in East Asia?", attribute: "region", value: "east", weight: 0.75 },
                { question: "Is it in Western Europe?", attribute: "region", value: "west", weight: 0.75 },
                { question: "Is it in the Middle East?", attribute: "region", value: "middle", weight: 0.8 }
            ],
            
            city: [
                { question: "Is it a capital city?", attribute: "isCapital", value: true, weight: 0.85 },
                { question: "Is it located in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it located in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it located in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
                { question: "Is it located in North America?", attribute: "continent", value: "northamerica", weight: 1.0 },
                { question: "Is it located in Oceania?", attribute: "continent", value: "oceania", weight: 1.0 },
                { question: "Does a major river run through it?", attribute: "hasRiver", value: true, weight: 0.7 },
                { question: "Does it have a metro/subway system?", attribute: "hasMetro", value: true, weight: 0.6 },
                { question: "Is it a coastal city?", attribute: "isCoastal", value: true, weight: 0.65 },
                { question: "Is it a very large city (over 10 million people)?", attribute: "size", value: "verylarge", weight: 0.8 },
                { question: "Is it a large city (3-10 million people)?", attribute: "size", value: "large", weight: 0.65 },
                { question: "Does it have a tropical climate?", attribute: "climate", value: "tropical", weight: 0.7 },
                { question: "Does it have a desert climate?", attribute: "climate", value: "desert", weight: 0.85 },
                { question: "Does it have a temperate climate?", attribute: "climate", value: "temperate", weight: 0.6 },
                { question: "Is it famous for the Eiffel Tower?", attribute: "famousFor", value: "eiffeltower", weight: 0.98 },
                { question: "Is it famous for cutting-edge technology?", attribute: "famousFor", value: "technology", weight: 0.85 },
                { question: "Is it famous for the Burj Khalifa?", attribute: "famousFor", value: "burjkhalifa", weight: 0.98 },
                { question: "Is it famous for the Statue of Liberty?", attribute: "famousFor", value: "statueofliberty", weight: 0.98 },
                { question: "Is it famous for Big Ben?", attribute: "famousFor", value: "bigben", weight: 0.95 },
                { question: "Is it famous for the Opera House?", attribute: "famousFor", value: "operahouse", weight: 0.98 },
                { question: "Is it near the pyramids?", attribute: "famousFor", value: "pyramids", weight: 0.95 },
                { question: "Is it located in France?", attribute: "country", value: "france", weight: 0.9 },
                { question: "Is it located in Japan?", attribute: "country", value: "japan", weight: 0.9 },
                { question: "Is it located in the United States?", attribute: "country", value: "usa", weight: 0.85 },
                { question: "Is it located in the United Kingdom?", attribute: "country", value: "uk", weight: 0.9 }
            ],
            
            place: [
                { question: "Is it a monument or memorial?", attribute: "type", value: "monument", weight: 0.8 },
                { question: "Is it a temple or religious structure?", attribute: "type", value: "temple", weight: 0.85 },
                { question: "Is it an amphitheater or arena?", attribute: "type", value: "amphitheater", weight: 0.9 },
                { question: "Is it ancient ruins?", attribute: "type", value: "ruins", weight: 0.85 },
                { question: "Is it a tower?", attribute: "type", value: "tower", weight: 0.85 },
                { question: "Is it a statue?", attribute: "type", value: "statue", weight: 0.85 },
                { question: "Is it located in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it located in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it located in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
                { question: "Is it located in North America?", attribute: "continent", value: "northamerica", weight: 1.0 },
                { question: "Is it located in South America?", attribute: "continent", value: "southamerica", weight: 1.0 },
                { question: "Is it from ancient times (over 2000 years old)?", attribute: "age", value: "ancient", weight: 0.85 },
                { question: "Is it relatively old (500-2000 years)?", attribute: "age", value: "old", weight: 0.7 },
                { question: "Is it modern (less than 200 years old)?", attribute: "age", value: "modern", weight: 0.75 },
                { question: "Is it a natural formation?", attribute: "age", value: "natural", weight: 0.9 },
                { question: "Is it famous as a symbol of love?", attribute: "famousFor", value: "love", weight: 0.98 },
                { question: "Is it associated with pharaohs and ancient Egypt?", attribute: "famousFor", value: "pharaohs", weight: 0.95 },
                { question: "Is it famous for gladiator battles?", attribute: "famousFor", value: "gladiators", weight: 0.98 },
                { question: "Is it associated with the Inca civilization?", attribute: "famousFor", value: "incas", weight: 0.98 },
                { question: "Is it an iconic symbol of Paris?", attribute: "famousFor", value: "paris", weight: 0.98 },
                { question: "Is it a symbol of freedom?", attribute: "famousFor", value: "freedom", weight: 0.98 },
                { question: "Is it a completely natural place (not man-made)?", attribute: "isNatural", value: true, weight: 0.85 },
                { question: "Is it a man-made structure?", attribute: "isNatural", value: false, weight: 0.7 },
                { question: "Is it located in India?", attribute: "country", value: "india", weight: 0.9 },
                { question: "Is it located in Egypt?", attribute: "country", value: "egypt", weight: 0.95 },
                { question: "Is it located in Italy?", attribute: "country", value: "italy", weight: 0.9 },
                { question: "Is it located in Peru?", attribute: "country", value: "peru", weight: 0.98 },
                { question: "Is it located in the United States?", attribute: "country", value: "usa", weight: 0.85 },
                { question: "Is it located in France?", attribute: "country", value: "france", weight: 0.95 },
                { question: "Is it located in China?", attribute: "country", value: "china", weight: 0.95 }
            ]
        };
    }

    showWelcomeScreen() {
        this.hideAllScreens();
        document.getElementById('welcomeScreen').classList.add('active');
    }

    showCategoryScreen() {
        this.hideAllScreens();
        document.getElementById('categoryScreen').classList.add('active');
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
    }

    showQuestionScreen() {
        this.hideAllScreens();
        document.getElementById('questionScreen').classList.add('active');
    }

    showResultScreen() {
        this.hideAllScreens();
        document.getElementById('resultScreen').classList.add('active');
        
        if (CONFIG.UI.ENABLE_ANIMATIONS) {
            animationController.createConfetti();
        }
    }

    showEngineScreen() {
        this.hideAllScreens();
        document.getElementById('engineScreen').classList.add('active');
    }

    closeEngineScreen() {
        this.showWelcomeScreen();
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }

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
        this.state.usingBackend = false;
        this.state.sessionId = null;
        
        const items = apiHandler.getData(category);
        if (items.length === 0) {
            alert('No data available for this category.');
            return;
        }

        this.state.possibleItems = items.map(item => ({
            ...item,
            probability: 1.0
        }));
        
        if (CONFIG.FEATURES.USE_SESSION_API && apiHandler.backendHealthy) {
            try {
                const sessionResponse = await apiHandler.startGameSession(
                    category,
                    this.state.possibleItems,
                    this.state.questions
                );
                
                if (sessionResponse && sessionResponse.session_id) {
                    this.state.usingBackend = true;
                    this.state.sessionId = sessionResponse.session_id;
                    console.log('✅ Using backend AI session:', this.state.sessionId);
                } else {
                    console.log('💻 Using local algorithm');
                }
            } catch (error) {
                console.warn('Failed to start backend session, using local');
            }
        }
        
        this.showThinkingScreen(category);
        
        setTimeout(() => {
            this.showQuestionScreen();
            this.askNextQuestion();
        }, CONFIG.GAME.THINKING_DURATION);
    }

    async askNextQuestion() {
        if (this.state.usingBackend && apiHandler.sessionId) {
            const question = await apiHandler.getNextQuestion(
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

            this.updateQuestionUI(question);
        } else {
            if (localAlgorithm.shouldStopAsking(
                this.state.possibleItems,
                this.state.questionNumber,
                this.state.maxQuestions
            )) {
                this.showResult();
                return;
            }

            const question = await apiHandler.getNextQuestion(
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

            this.updateQuestionUI(question);
        }
    }

    updateQuestionUI(question) {
        const questionText = document.getElementById('questionText');
        questionText.style.opacity = '0';
        
        setTimeout(() => {
            questionText.textContent = question.question;
            questionText.style.opacity = '1';
        }, 150);

        // Update progress - show actual number, not percentage if over max
        const progress = Math.min(100, (this.state.questionNumber / this.state.maxQuestions) * 100);
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = 
            `Question ${this.state.questionNumber}${this.state.questionNumber >= this.state.maxQuestions ? '+' : ` / ${this.state.maxQuestions}`}`;

        const confidence = localAlgorithm.calculateConfidence(this.state.possibleItems);
        document.getElementById('confidenceValue').textContent = confidence + '%';
        
        const confidenceBar = document.getElementById('confidenceBar');
        if (confidenceBar) {
            confidenceBar.style.width = confidence + '%';
        }
    }

    async answerQuestion(answer) {
        this.state.answers.push({
            question: this.state.currentQuestion.question,
            answer: answer
        });

        const questionText = document.getElementById('questionText');
        if (questionText) {
            questionText.style.opacity = '0.5';
        }

        if (this.state.usingBackend && apiHandler.sessionId) {
            try {
                const response = await apiHandler.processAnswer(answer);
                
                if (response) {
                    console.log('🤖 Backend processed answer');
                }
            } catch (error) {
                console.warn('Backend answer processing failed');
                this.state.usingBackend = false;
            }
        }

        if (!this.state.usingBackend) {
            this.state.possibleItems = await apiHandler.filterItems(
                this.state.possibleItems,
                this.state.currentQuestion,
                answer
            );
        }

        if (questionText) {
            questionText.style.opacity = '1';
        }

        if (CONFIG.DEBUG.ENABLED) {
            console.log('Remaining items:', this.state.possibleItems.length);
            console.log('Top 3:', this.state.possibleItems.slice(0, 3).map(i => i.name));
        }

        setTimeout(() => {
            this.askNextQuestion();
        }, CONFIG.GAME.QUESTION_DELAY);
    }

    async showResult() {
        let prediction = null;
        let confidence = 0;

        if (this.state.usingBackend && apiHandler.sessionId) {
            try {
                const response = await apiHandler.getPrediction(
                    this.state.possibleItems,
                    this.state.questionNumber
                );
                
                if (response && response.prediction) {
                    prediction = response.prediction;
                    confidence = response.confidence;
                    console.log('🤖 Using backend prediction');
                }
            } catch (error) {
                console.warn('Backend prediction failed');
            }
        }

        if (!prediction) {
            prediction = localAlgorithm.getBestGuess(this.state.possibleItems);
            confidence = localAlgorithm.calculateConfidence(this.state.possibleItems);
            console.log('💻 Using local prediction');
        }
        
        if (!prediction) {
            const items = apiHandler.getData(this.state.category);
            if (items.length > 0) {
                prediction = items[0];
                confidence = 50;
            } else {
                alert('Unable to make a guess. Please try again.');
                this.showCategoryScreen();
                return;
            }
        }

        document.getElementById('resultEmoji').textContent = prediction.emoji || '🎯';
        document.getElementById('resultName').textContent = prediction.name;
        document.getElementById('resultInfo').innerHTML = `
            <div class="info-icon">ℹ️</div>
            <p class="info-text">${prediction.info || 'No additional information available.'}</p>
        `;
        document.getElementById('finalConfidence').textContent = confidence;
        document.getElementById('questionsAsked').textContent = this.state.questionNumber;
        document.getElementById('possibleMatches').textContent = this.state.possibleItems.length;

        this.animateConfidenceCircle(confidence);

        apiHandler.endSession();

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
        this.state = {
            category: null,
            currentQuestion: null,
            questionNumber: 0,
            maxQuestions: CONFIG.GAME.MAX_QUESTIONS,
            askedQuestions: [],
            possibleItems: [],
            answers: [],
            questions: null,
            usingBackend: false,
            sessionId: null
        };
        apiHandler.endSession();
        this.showWelcomeScreen();
    }
}

const game = new Game();
