// game.js - Game State Management & UI Controller

class Game {
    constructor() {
        this.state = {
            category: null,
            currentQuestion: null,
            questionNumber: 0,
            maxQuestions: 20, // Increased to 20 for better accuracy
            askedQuestions: [],
            possibleItems: [],
            answers: [],
            questions: null,
            usingBackend: false, // Set to false to force local algorithm
            sessionId: null
        };
        
        this.dataLoaded = false;
        this.questionBank = {};
    }

    /**
     * Initialize Game and Load Data
     */
    async initialize() {
        try {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) loadingScreen.classList.remove('hidden');

            // Load data from api.js (which loads your countries.json)
            await apiHandler.loadAllData();
            
            // Build the Question Bank
            this.loadQuestionBanks();
            
            this.dataLoaded = true;
            console.log('✅ Game initialized with Rich Data');
            
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                }, 500);
            }
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('Error loading game data. Please refresh.');
        }
    }

    /**
     * LOAD QUESTION BANKS - Mapped to new JSON Structure
     */
    loadQuestionBanks() {
        this.questionBank = {
            country: [
                // --- CONTINENT (Base Split) ---
                { question: "Is it located in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it located in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it located in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
                { question: "Is it located in North America?", attribute: "continent", value: "northamerica", weight: 1.0 },
                { question: "Is it located in South America?", attribute: "continent", value: "southamerica", weight: 1.0 },
                { question: "Is it located in Oceania?", attribute: "continent", value: "oceania", weight: 1.0 },

                // --- REGIONS (Detail Split) ---
                { question: "Is it in the Middle East?", attribute: "region", value: "middle", weight: 0.9 },
                { question: "Is it in Southeast Asia?", attribute: "region", value: "southeast", weight: 0.9 },
                { question: "Is it in Scandinavia?", attribute: "subRegion", value: "scandinavia", weight: 0.9 },
                { question: "Is it in the Balkans?", attribute: "subRegion", value: "balkans", weight: 0.9 },
                { question: "Is it in the Caribbean?", attribute: "subRegion", value: "caribbean", weight: 0.9 },
                
                // --- NEIGHBORS (Array Check) ---
                { question: "Does it share a border with India?", attribute: "neighbors", value: "india", weight: 0.95 },
                { question: "Does it share a border with China?", attribute: "neighbors", value: "china", weight: 0.95 },
                { question: "Does it neighbor Brazil?", attribute: "neighbors", value: "brazil", weight: 0.95 },
                { question: "Does it neighbor Russia?", attribute: "neighbors", value: "russia", weight: 0.95 },
                { question: "Does it neighbor the USA?", attribute: "neighbors", value: "usa", weight: 0.95 },
                { question: "Does it neighbor France?", attribute: "neighbors", value: "france", weight: 0.90 },
                { question: "Does it neighbor Germany?", attribute: "neighbors", value: "germany", weight: 0.90 },
                { question: "Does it neighbor South Africa?", attribute: "neighbors", value: "south africa", weight: 0.90 },

                // --- GEOGRAPHY & CLIMATE ---
                { question: "Is it an island nation?", attribute: "isIsland", value: true, weight: 0.85 },
                { question: "Is it a landlocked country?", attribute: "landlocked", value: true, weight: 0.85 },
                { question: "Does it have a desert climate?", attribute: "climate", value: "desert", weight: 0.8 },
                { question: "Is the average temperature very hot?", attribute: "avgTemperature", value: "very hot", weight: 0.7 },
                { question: "Is it generally cold or freezing?", attribute: "avgTemperature", value: "freezing", weight: 0.8 },
                
                // --- GOVERNMENT & RELIGION ---
                { question: "Is the country a Monarchy (has a King/Queen/Emperor)?", attribute: "government", value: "monarchy", weight: 0.85 },
                { question: "Is Islam the main religion?", attribute: "mainReligion", value: "islam", weight: 0.8 },
                { question: "Is Christianity the main religion?", attribute: "mainReligion", value: "christianity", weight: 0.7 },
                { question: "Is Buddhism the main religion?", attribute: "mainReligion", value: "buddhism", weight: 0.9 },

                // --- FAMOUS FOR (Array Check) ---
                { question: "Is it famous for Cricket?", attribute: "famousFor", value: "cricket", weight: 0.9 },
                { question: "Is it famous for Football (Soccer)?", attribute: "famousFor", value: "football", weight: 0.8 },
                { question: "Is it famous for Oil production?", attribute: "famousFor", value: "oil", weight: 0.8 },
                { question: "Is it famous for its Coffee?", attribute: "famousFor", value: "coffee", weight: 0.8 },
                { question: "Is it famous for Pyramids?", attribute: "famousFor", value: "pyramids", weight: 0.99 },
                { question: "Is it known for the Amazon Rainforest?", attribute: "famousFor", value: "amazon rainforest", weight: 0.95 },
                { question: "Is it famous for Anime or Technology?", attribute: "famousFor", value: "anime", weight: 0.95 },
                { question: "Is it famous for Safaris?", attribute: "famousFor", value: "safari", weight: 0.9 },
                { question: "Is it famous for ancient ruins?", attribute: "famousFor", value: "ruins", weight: 0.8 },

                // --- EXPORTS (Array Check) ---
                { question: "Is it a major exporter of Gold?", attribute: "exports", value: "gold", weight: 0.7 },
                { question: "Does it export Electronics?", attribute: "exports", value: "electronics", weight: 0.8 },
                { question: "Is it a major exporter of Oil/Gas?", attribute: "exports", value: "oil", weight: 0.85 },
                { question: "Does it export Textiles/Garments?", attribute: "exports", value: "textiles", weight: 0.75 },

                // --- MISC ---
                { question: "Do people drive on the left side of the road?", attribute: "driveSide", value: "left", weight: 0.7 },
                { question: "Does it have a very large population?", attribute: "population", value: "verylarge", weight: 0.8 }
            ],
            
            // Keep City and Place simple for now, or expand similarly
            city: [
                { question: "Is it a capital city?", attribute: "isCapital", value: true, weight: 0.9 },
                { question: "Is it in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it famous for the Eiffel Tower?", attribute: "famousFor", value: "eiffeltower", weight: 0.99 },
                { question: "Does it have a very large population?", attribute: "size", value: "verylarge", weight: 0.7 }
            ],
            place: [
                { question: "Is it in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it a natural formation?", attribute: "isNatural", value: true, weight: 0.8 },
                { question: "Is it a monument?", attribute: "type", value: "monument", weight: 0.8 },
                { question: "Is it famous for love?", attribute: "famousFor", value: "love", weight: 0.95 }
            ]
        };
    }

    /**
     * UI Helper: Hide all screens
     */
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
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
        document.getElementById('thinkingCategory').textContent = category;
        document.getElementById('thinkingScreen').classList.add('active');
    }

    showQuestionScreen() {
        this.hideAllScreens();
        document.getElementById('questionScreen').classList.add('active');
    }

    showResultScreen() {
        this.hideAllScreens();
        document.getElementById('resultScreen').classList.add('active');
        if (CONFIG.UI.ENABLE_ANIMATIONS && animationController) {
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

    /**
     * Start the Game
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
        
        // Load items from API Handler (Data is already loaded in initialize)
        const items = apiHandler.getData(category);
        
        if (!items || items.length === 0) {
            alert('No data found for this category.');
            return;
        }

        // Initialize items with 100% probability normalized
        this.state.possibleItems = items.map(item => ({
            ...item,
            probability: 1.0 / items.length
        }));
        
        // Show thinking then start
        this.showThinkingScreen(category);
        
        setTimeout(() => {
            this.showQuestionScreen();
            this.askNextQuestion();
        }, CONFIG.GAME.THINKING_DURATION);
    }

    /**
     * Ask Next Question Loop
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

        // Select best question using Information Gain
        const question = localAlgorithm.selectBestQuestion(
            this.state.category,
            this.state.askedQuestions,
            this.state.possibleItems
        );

        // If no more useful questions
        if (!question) {
            this.showResult();
            return;
        }

        this.state.currentQuestion = question;
        this.state.questionNumber++;
        this.state.askedQuestions.push(question.question);

        this.updateQuestionUI(question);
    }

    /**
     * Update UI elements
     */
    updateQuestionUI(question) {
        const questionText = document.getElementById('questionText');
        questionText.style.opacity = '0';
        
        setTimeout(() => {
            questionText.textContent = question.question;
            questionText.style.opacity = '1';
        }, 150);

        // Update Progress Bar
        const progress = (this.state.questionNumber / this.state.maxQuestions) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = 
            `Question ${this.state.questionNumber} / ${this.state.maxQuestions}`;

        // Update Confidence Meter
        const confidence = localAlgorithm.calculateConfidence(this.state.possibleItems);
        document.getElementById('confidenceValue').textContent = confidence + '%';
        const confidenceBar = document.getElementById('confidenceBar');
        if (confidenceBar) confidenceBar.style.width = confidence + '%';
    }

    /**
     * Handle User Answer
     */
    async answerQuestion(answer) {
        // 1. Filter items using the Algorithm
        this.state.possibleItems = localAlgorithm.filterItems(
            this.state.possibleItems,
            this.state.currentQuestion,
            answer
        );

        // 2. Store Answer
        this.state.answers.push({
            question: this.state.currentQuestion.question,
            answer: answer
        });

        // 3. Debugging (Optional)
        if (CONFIG.DEBUG.ENABLED) {
            console.log(`Answer: ${answer}`);
            console.log(`Remaining: ${this.state.possibleItems.length}`);
            if(this.state.possibleItems.length > 0) {
                console.log(`Top Guess: ${this.state.possibleItems[0].name} (${this.state.possibleItems[0].probability.toFixed(4)})`);
            }
        }

        // 4. Delay and ask next
        setTimeout(() => {
            this.askNextQuestion();
        }, CONFIG.GAME.QUESTION_DELAY || 400);
    }

    /**
     * Show Final Result with Rich Data
     */
    showResult() {
        const prediction = localAlgorithm.getBestGuess(this.state.possibleItems);
        const confidence = localAlgorithm.calculateConfidence(this.state.possibleItems);

        if (prediction) {
            // Update UI with Rich Data
            document.getElementById('resultEmoji').textContent = prediction.emoji || '🌍';
            document.getElementById('resultName').textContent = prediction.name;
            
            // Rich Info HTML construction
            let infoHtml = `<p class="info-text">${prediction.info || 'No info available.'}</p>`;
            
            // Add extra details if available
            infoHtml += `<div class="rich-info-grid" style="margin-top:15px; display:grid; grid-template-columns:1fr 1fr; gap:10px; text-align:left; font-size:0.9rem; color:var(--text-secondary);">`;
            
            if (prediction.capital) infoHtml += `<div>🏛️ <b>Capital:</b> ${prediction.capital}</div>`;
            if (prediction.currency) infoHtml += `<div>💰 <b>Currency:</b> ${prediction.currency}</div>`;
            if (prediction.nationalDish) infoHtml += `<div>🍲 <b>Dish:</b> ${prediction.nationalDish}</div>`;
            if (prediction.famousPeople && prediction.famousPeople.length > 0) {
                infoHtml += `<div>🌟 <b>Star:</b> ${prediction.famousPeople[0]}</div>`;
            }
            infoHtml += `</div>`;

            // Add Tags for Famous For
            if (prediction.famousFor && Array.isArray(prediction.famousFor)) {
                infoHtml += `<div style="margin-top:15px; display:flex; flex-wrap:wrap; gap:5px; justify-content:center;">`;
                prediction.famousFor.slice(0, 4).forEach(tag => {
                    infoHtml += `<span class="badge">${tag}</span>`;
                });
                infoHtml += `</div>`;
            }

            document.getElementById('resultInfo').innerHTML = infoHtml;
            document.getElementById('finalConfidence').textContent = confidence;
            document.getElementById('questionsAsked').textContent = this.state.questionNumber;
            document.getElementById('possibleMatches').textContent = this.state.possibleItems.length;

            // Animate Circle
            const circle = document.getElementById('confidenceCircle');
            if (circle) {
                const circumference = 2 * Math.PI * 54;
                const offset = circumference - (confidence / 100) * circumference;
                circle.style.strokeDasharray = circumference;
                circle.style.strokeDashoffset = circumference;
                setTimeout(() => circle.style.strokeDashoffset = offset, 100);
            }

            this.showResultScreen();
        } else {
            alert("I couldn't guess it! Please try again.");
            this.showCategoryScreen();
        }
    }

    playAgain() {
        if (this.state.category) {
            this.startGame(this.state.category);
        } else {
            this.showCategoryScreen();
        }
    }
}

// Create global game instance
const game = new Game();
