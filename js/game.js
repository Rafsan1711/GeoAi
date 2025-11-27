// game.js - Game State Management with Enhanced Question Bank

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

    async loadQuestionBanks() {
        this.questionBank = {
            country: [
                // CONTINENT - Highest Priority
                { question: "Is it in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
                { question: "Is it in North America?", attribute: "continent", value: "northamerica", weight: 1.0 },
                { question: "Is it in South America?", attribute: "continent", value: "southamerica", weight: 1.0 },
                { question: "Is it in Oceania?", attribute: "continent", value: "oceania", weight: 1.0 },
                
                // REGION - Very Important
                { question: "Is it in South Asia?", attribute: "region", value: "south", weight: 0.95 },
                { question: "Is it in East Asia?", attribute: "region", value: "east", weight: 0.95 },
                { question: "Is it in Western Europe?", attribute: "region", value: "west", weight: 0.95 },
                { question: "Is it in the Middle East?", attribute: "region", value: "middle", weight: 0.95 },
                { question: "Is it in Central region?", attribute: "region", value: "central", weight: 0.9 },
                { question: "Is it in Northern region?", attribute: "region", value: "north", weight: 0.9 },
                { question: "Is it in the Caribbean?", attribute: "region", value: "caribbean", weight: 0.95 },
                
                // GEOGRAPHIC FEATURES
                { question: "Does it have a coastline?", attribute: "hasCoast", value: true, weight: 0.75 },
                { question: "Is it landlocked?", attribute: "landlocked", value: true, weight: 0.85 },
                { question: "Is it an island nation?", attribute: "isIsland", value: true, weight: 0.9 },
                { question: "Does it have major mountains?", attribute: "hasMountains", value: true, weight: 0.7 },
                
                // POPULATION SIZE
                { question: "Does it have a very large population (over 200M)?", attribute: "population", value: "verylarge", weight: 0.9 },
                { question: "Does it have a large population (50-200M)?", attribute: "population", value: "large", weight: 0.8 },
                { question: "Does it have a medium population (10-50M)?", attribute: "population", value: "medium", weight: 0.7 },
                { question: "Does it have a small population (under 10M)?", attribute: "population", value: "small", weight: 0.75 },
                
                // CLIMATE
                { question: "Does it have a tropical climate?", attribute: "climate", value: "tropical", weight: 0.75 },
                { question: "Does it have a desert climate?", attribute: "climate", value: "desert", weight: 0.85 },
                { question: "Does it have a temperate climate?", attribute: "climate", value: "temperate", weight: 0.7 },
                { question: "Does it have a cold/freezing climate?", attribute: "climate", value: "cold", weight: 0.8 },
                { question: "Does it have a cold/freezing climate?", attribute: "climate", value: "freezing", weight: 0.85 },
                { question: "Does it have a Mediterranean climate?", attribute: "climate", value: "mediterranean", weight: 0.8 },
                { question: "Does it have a varied climate?", attribute: "climate", value: "varied", weight: 0.6 },
                
                // GOVERNMENT TYPE
                { question: "Is it a republic?", attribute: "government", value: "republic", weight: 0.7 },
                { question: "Is it a monarchy?", attribute: "government", value: "monarchy", weight: 0.85 },
                { question: "Is it a dictatorship?", attribute: "government", value: "dictatorship", weight: 0.9 },
                
                // RELIGION
                { question: "Is Islam the main religion?", attribute: "mainReligion", value: "islam", weight: 0.8 },
                { question: "Is Christianity the main religion?", attribute: "mainReligion", value: "christianity", weight: 0.75 },
                { question: "Is Hinduism the main religion?", attribute: "mainReligion", value: "hinduism", weight: 0.9 },
                { question: "Is Buddhism the main religion?", attribute: "mainReligion", value: "buddhism", weight: 0.85 },
                { question: "Is it a secular country?", attribute: "mainReligion", value: "secular", weight: 0.8 },
                
                // LANGUAGE - Super Specific
                { question: "Is Bengali the primary language?", attribute: "language", value: "bengali", weight: 0.98 },
                { question: "Is English the primary language?", attribute: "language", value: "english", weight: 0.75 },
                { question: "Is Arabic the primary language?", attribute: "language", value: "arabic", weight: 0.8 },
                { question: "Is Chinese the primary language?", attribute: "language", value: "chinese", weight: 0.9 },
                { question: "Is Spanish the primary language?", attribute: "language", value: "spanish", weight: 0.8 },
                { question: "Is French the primary language?", attribute: "language", value: "french", weight: 0.85 },
                { question: "Is Portuguese the primary language?", attribute: "language", value: "portuguese", weight: 0.9 },
                { question: "Is Russian the primary language?", attribute: "language", value: "russian", weight: 0.9 },
                { question: "Is Japanese the primary language?", attribute: "language", value: "japanese", weight: 0.98 },
                { question: "Is Hindi the primary language?", attribute: "language", value: "hindi", weight: 0.95 },
                { question: "Is German the primary language?", attribute: "language", value: "german", weight: 0.9 },
                { question: "Is Italian the primary language?", attribute: "language", value: "italian", weight: 0.95 },
                
                // FAMOUS FOR - Array Questions
                { question: "Is it famous for cricket?", attribute: "famousFor", value: "cricket", weight: 0.95 },
                { question: "Is it famous for football/soccer?", attribute: "famousFor", value: "football", weight: 0.85 },
                { question: "Is it famous for technology/innovation?", attribute: "famousFor", value: "technology", weight: 0.85 },
                { question: "Is it famous for Bollywood?", attribute: "famousFor", value: "bollywood", weight: 0.98 },
                { question: "Is it famous for anime?", attribute: "famousFor", value: "anime", weight: 0.98 },
                { question: "Is it famous for K-pop?", attribute: "famousFor", value: "kpop", weight: 0.98 },
                { question: "Is it famous for oil/petroleum?", attribute: "famousFor", value: "oil", weight: 0.9 },
                { question: "Is it famous for wine?", attribute: "famousFor", value: "wine", weight: 0.9 },
                { question: "Is it famous for coffee?", attribute: "famousFor", value: "coffee", weight: 0.9 },
                { question: "Is it famous for pyramids?", attribute: "famousFor", value: "pyramids", weight: 0.98 },
                { question: "Is it famous for the Great Wall?", attribute: "famousFor", value: "great wall", weight: 0.98 },
                { question: "Is it famous for the Eiffel Tower?", attribute: "famousFor", value: "eiffel tower", weight: 0.98 },
                { question: "Is it famous for kangaroos?", attribute: "famousFor", value: "wildlife", weight: 0.95 },
                { question: "Is it famous for safari?", attribute: "famousFor", value: "safari", weight: 0.9 },
                { question: "Is it famous for sushi?", attribute: "famousFor", value: "sushi", weight: 0.95 },
                { question: "Is it famous for pasta/pizza?", attribute: "famousFor", value: "pasta", weight: 0.95 },
                { question: "Is it famous for tacos?", attribute: "famousFor", value: "tacos", weight: 0.95 },
                { question: "Is it famous for the Amazon rainforest?", attribute: "famousFor", value: "amazon rainforest", weight: 0.98 },
                { question: "Is it famous for Machu Picchu?", attribute: "famousFor", value: "machu picchu", weight: 0.98 },
                { question: "Is it famous for chocolate?", attribute: "famousFor", value: "chocolate", weight: 0.9 },
                { question: "Is it famous for beer?", attribute: "famousFor", value: "beer", weight: 0.85 },
                { question: "Is it famous for vodka?", attribute: "famousFor", value: "vodka", weight: 0.95 },
                { question: "Is it famous for maple syrup?", attribute: "famousFor", value: "maple syrup", weight: 0.98 },
                { question: "Is it famous for fjords?", attribute: "famousFor", value: "fjords", weight: 0.95 },
                { question: "Is it famous for Vikings?", attribute: "famousFor", value: "vikings", weight: 0.9 },
                { question: "Is it famous for tango?", attribute: "famousFor", value: "tango", weight: 0.95 },
                { question: "Is it famous for cannabis/marijuana?", attribute: "famousFor", value: "cannabis", weight: 0.9 },
                { question: "Is it famous for cigars?", attribute: "famousFor", value: "cigars", weight: 0.95 },
                { question: "Is it famous for diamonds?", attribute: "famousFor", value: "diamonds", weight: 0.9 },
                { question: "Is it famous for gold?", attribute: "famousFor", value: "gold", weight: 0.85 },
                { question: "Is it famous for tea?", attribute: "famousFor", value: "tea", weight: 0.9 },
                { question: "Is it famous for spices?", attribute: "famousFor", value: "spices", weight: 0.9 },
                { question: "Is it famous for tulips?", attribute: "famousFor", value: "tulips", weight: 0.98 },
                { question: "Is it famous for watches?", attribute: "famousFor", value: "watches", weight: 0.95 },
                { question: "Is it famous for LEGO?", attribute: "famousFor", value: "lego", weight: 0.98 },
                { question: "Is it famous for IKEA?", attribute: "famousFor", value: "ikea", weight: 0.98 },
                { question: "Is it famous for reggae music?", attribute: "famousFor", value: "reggae", weight: 0.98 },
                { question: "Is it famous for Hollywood?", attribute: "famousFor", value: "hollywood", weight: 0.98 },
                
                // DRIVE SIDE
                { question: "Do they drive on the left side?", attribute: "driveSide", value: "left", weight: 0.7 },
                
                // FLAG COLORS - Array
                { question: "Does the flag have red color?", attribute: "flagColors", value: "red", weight: 0.6 },
                { question: "Does the flag have green color?", attribute: "flagColors", value: "green", weight: 0.65 },
                { question: "Does the flag have blue color?", attribute: "flagColors", value: "blue", weight: 0.6 },
                { question: "Does the flag have white color?", attribute: "flagColors", value: "white", weight: 0.55 },
                { question: "Does the flag have yellow/gold color?", attribute: "flagColors", value: "yellow", weight: 0.65 },
                { question: "Does the flag have black color?", attribute: "flagColors", value: "black", weight: 0.7 },
                
                // NEIGHBORS - Very Specific
                { question: "Does it border India?", attribute: "neighbors", value: "india", weight: 0.9 },
                { question: "Does it border China?", attribute: "neighbors", value: "china", weight: 0.85 },
                { question: "Does it border Russia?", attribute: "neighbors", value: "russia", weight: 0.85 },
                { question: "Does it border Germany?", attribute: "neighbors", value: "germany", weight: 0.85 },
                { question: "Does it border France?", attribute: "neighbors", value: "france", weight: 0.85 },
                { question: "Does it border Brazil?", attribute: "neighbors", value: "brazil", weight: 0.85 },
                { question: "Does it border the USA?", attribute: "neighbors", value: "usa", weight: 0.9 },
                
                // EXPORTS - Economic Questions
                { question: "Does it export oil/petroleum?", attribute: "exports", value: "oil", weight: 0.85 },
                { question: "Does it export electronics?", attribute: "exports", value: "electronics", weight: 0.8 },
                { question: "Does it export cars?", attribute: "exports", value: "cars", weight: 0.85 },
                { question: "Does it export textiles/clothing?", attribute: "exports", value: "textiles", weight: 0.75 },
                { question: "Does it export coffee?", attribute: "exports", value: "coffee", weight: 0.9 },
                { question: "Does it export gold?", attribute: "exports", value: "gold", weight: 0.85 },
                { question: "Does it export diamonds?", attribute: "exports", value: "diamonds", weight: 0.9 }
            ],
            
            city: [
                { question: "Is it a capital city?", attribute: "isCapital", value: true, weight: 0.85 },
                { question: "Is it in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
                { question: "Is it in North America?", attribute: "continent", value: "northamerica", weight: 1.0 },
                { question: "Is it in Oceania?", attribute: "continent", value: "oceania", weight: 1.0 },
                { question: "Does a major river run through it?", attribute: "hasRiver", value: true, weight: 0.7 },
                { question: "Does it have a metro/subway?", attribute: "hasMetro", value: true, weight: 0.65 },
                { question: "Is it a very large city (10M+)?", attribute: "size", value: "verylarge", weight: 0.85 },
                { question: "Is it a large city (3-10M)?", attribute: "size", value: "large", weight: 0.7 },
                { question: "Does it have tropical climate?", attribute: "climate", value: "tropical", weight: 0.75 },
                { question: "Does it have desert climate?", attribute: "climate", value: "desert", weight: 0.85 },
                { question: "Is it famous for the Eiffel Tower?", attribute: "famousFor", value: "eiffeltower", weight: 0.98 },
                { question: "Is it famous for technology?", attribute: "famousFor", value: "technology", weight: 0.85 },
                { question: "Is it famous for rickshaws?", attribute: "famousFor", value: "rickshaw", weight: 0.95 },
                { question: "Is it famous for Burj Khalifa?", attribute: "famousFor", value: "burjkhalifa", weight: 0.98 },
                { question: "Is it in Bangladesh?", attribute: "country", value: "bangladesh", weight: 0.95 },
                { question: "Is it in France?", attribute: "country", value: "france", weight: 0.9 },
                { question: "Is it in Japan?", attribute: "country", value: "japan", weight: 0.9 },
                { question: "Is it in the USA?", attribute: "country", value: "usa", weight: 0.85 }
            ],
            
            place: [
                { question: "Is it a monument?", attribute: "type", value: "monument", weight: 0.8 },
                { question: "Is it a temple?", attribute: "type", value: "temple", weight: 0.85 },
                { question: "Is it ancient ruins?", attribute: "type", value: "ruins", weight: 0.85 },
                { question: "Is it a natural forest?", attribute: "type", value: "forest", weight: 0.85 },
                { question: "Is it in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it ancient (2000+ years)?", attribute: "age", value: "ancient", weight: 0.85 },
                { question: "Is it natural?", attribute: "isNatural", value: true, weight: 0.85 },
                { question: "Is it famous for love?", attribute: "famousFor", value: "love", weight: 0.98 },
                { question: "Is it in India?", attribute: "country", value: "india", weight: 0.9 }
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

        const progress = (this.state.questionNumber / this.state.maxQuestions) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = 
            `Question ${this.state.questionNumber} / ${this.state.maxQuestions}`;

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
