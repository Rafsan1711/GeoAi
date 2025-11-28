// game.js - Ultra Game Manager with Adaptive Stopping

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

            console.log('✅ Game initialized - Ultra Accuracy Mode');
            console.log('📊 Question Limit:', CONFIG.GAME.MAX_QUESTIONS);
            console.log('🎯 Min Confidence:', CONFIG.GAME.MIN_CONFIDENCE_TO_GUESS + '%');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('Failed to load game data. Please refresh the page.');
        }
    }

    async loadQuestionBanks() {
        this.questionBank = {
            country: [
                // CONTINENT (Stage 0) - MUST ASK FIRST
                { question: "Is it in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
                { question: "Is it in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
                { question: "Is it in North America?", attribute: "continent", value: "northamerica", weight: 1.0 },
                { question: "Is it in South America?", attribute: "continent", value: "southamerica", weight: 1.0 },
                { question: "Is it in Oceania?", attribute: "continent", value: "oceania", weight: 1.0 },
                
                // REGION (Stage 1) - HIGH PRIORITY
                { question: "Is it in South Asia?", attribute: "region", value: "south", weight: 0.95 },
                { question: "Is it in East Asia?", attribute: "region", value: "east", weight: 0.95 },
                { question: "Is it in Western Europe?", attribute: "region", value: "west", weight: 0.95 },
                { question: "Is it in Eastern Europe?", attribute: "region", value: "east", weight: 0.95 },
                { question: "Is it in the Middle East?", attribute: "region", value: "middle", weight: 0.95 },
                { question: "Is it in Central region?", attribute: "region", value: "central", weight: 0.9 },
                { question: "Is it in Northern region?", attribute: "region", value: "north", weight: 0.9 },
                { question: "Is it in Southern region?", attribute: "region", value: "south", weight: 0.9 },
                { question: "Is it in the Caribbean?", attribute: "region", value: "caribbean", weight: 0.95 },
                { question: "Is it in the Pacific?", attribute: "region", value: "pacific", weight: 0.95 },
                
                // SUB-REGION (Stage 1) - MORE SPECIFIC
                { question: "Is it in Bengal region?", attribute: "subRegion", value: "bengal", weight: 0.95 },
                { question: "Is it in the Indian subcontinent?", attribute: "subRegion", value: "indian subcontinent", weight: 0.9 },
                { question: "Is it in Southeast Asia?", attribute: "subRegion", value: "southeast asia", weight: 0.9 },
                { question: "Is it in the Balkans?", attribute: "subRegion", value: "balkans", weight: 0.9 },
                { question: "Is it in Scandinavia?", attribute: "subRegion", value: "scandinavia", weight: 0.9 },
                { question: "Is it in the British Isles?", attribute: "subRegion", value: "british isles", weight: 0.95 },
                { question: "Is it in the Iberian Peninsula?", attribute: "subRegion", value: "iberian peninsula", weight: 0.95 },
                { question: "Is it in Latin America?", attribute: "subRegion", value: "latin america", weight: 0.85 },
                { question: "Is it in Central America?", attribute: "subRegion", value: "central america", weight: 0.9 },
                { question: "Is it in the Caucasus?", attribute: "subRegion", value: "caucasus", weight: 0.95 },
                { question: "Is it in the Horn of Africa?", attribute: "subRegion", value: "horn of africa", weight: 0.95 },
                { question: "Is it in North Africa?", attribute: "subRegion", value: "north africa", weight: 0.9 },
                { question: "Is it in West Africa?", attribute: "subRegion", value: "west africa", weight: 0.9 },
                { question: "Is it in East Africa?", attribute: "subRegion", value: "east africa", weight: 0.9 },
                { question: "Is it in Southern Africa?", attribute: "subRegion", value: "southern africa", weight: 0.9 },
                { question: "Is it in Central Asia?", attribute: "subRegion", value: "central asia", weight: 0.9 },
                
                // GEOGRAPHIC FEATURES (Stage 2)
                { question: "Does it have a coastline?", attribute: "hasCoast", value: true, weight: 0.75 },
                { question: "Is it landlocked (no coast)?", attribute: "landlocked", value: true, weight: 0.85 },
                { question: "Is it an island nation?", attribute: "isIsland", value: true, weight: 0.9 },
                { question: "Does it have major mountains?", attribute: "hasMountains", value: true, weight: 0.7 },
                
                // POPULATION (Stage 3)
                { question: "Does it have a very large population (over 200M)?", attribute: "population", value: "verylarge", weight: 0.9 },
                { question: "Does it have a large population (50-200M)?", attribute: "population", value: "large", weight: 0.8 },
                { question: "Does it have a medium population (10-50M)?", attribute: "population", value: "medium", weight: 0.7 },
                { question: "Does it have a small population (under 10M)?", attribute: "population", value: "small", weight: 0.75 },
                
                // CLIMATE (Stage 2)
                { question: "Does it have a tropical climate?", attribute: "climate", value: "tropical", weight: 0.75 },
                { question: "Does it have a desert climate?", attribute: "climate", value: "desert", weight: 0.85 },
                { question: "Does it have a temperate climate?", attribute: "climate", value: "temperate", weight: 0.7 },
                { question: "Does it have a cold/freezing climate?", attribute: "climate", value: "cold", weight: 0.8 },
                { question: "Does it have a very cold climate?", attribute: "climate", value: "freezing", weight: 0.85 },
                { question: "Does it have a Mediterranean climate?", attribute: "climate", value: "mediterranean", weight: 0.8 },
                { question: "Does it have a varied/diverse climate?", attribute: "climate", value: "varied", weight: 0.6 },
                
                // GOVERNMENT (Stage 4)
                { question: "Is it a republic?", attribute: "government", value: "republic", weight: 0.7 },
                { question: "Is it a monarchy?", attribute: "government", value: "monarchy", weight: 0.85 },
                { question: "Is it a dictatorship?", attribute: "government", value: "dictatorship", weight: 0.9 },
                { question: "Is it a theocracy?", attribute: "government", value: "theocracy", weight: 0.95 },
                
                // RELIGION (Stage 4)
                { question: "Is Islam the main religion?", attribute: "mainReligion", value: "islam", weight: 0.8 },
                { question: "Is Christianity the main religion?", attribute: "mainReligion", value: "christianity", weight: 0.75 },
                { question: "Is Hinduism the main religion?", attribute: "mainReligion", value: "hinduism", weight: 0.9 },
                { question: "Is Buddhism the main religion?", attribute: "mainReligion", value: "buddhism", weight: 0.85 },
                { question: "Is Judaism the main religion?", attribute: "mainReligion", value: "jewish", weight: 0.95 },
                { question: "Is it a secular country?", attribute: "mainReligion", value: "secular", weight: 0.8 },
                { question: "Is it mixed/diverse religions?", attribute: "mainReligion", value: "mixed", weight: 0.75 },
                { question: "Is Shinto the main religion?", attribute: "mainReligion", value: "shinto", weight: 0.98 },
                
                // LANGUAGE (Stage 5) - VERY SPECIFIC
                { question: "Is Bengali the primary language?", attribute: "language", value: "bengali", weight: 0.98 },
                { question: "Is English the primary language?", attribute: "language", value: "english", weight: 0.75 },
                { question: "Is Arabic the primary language?", attribute: "language", value: "arabic", weight: 0.8 },
                { question: "Is Chinese/Mandarin the primary language?", attribute: "language", value: "chinese", weight: 0.9 },
                { question: "Is Spanish the primary language?", attribute: "language", value: "spanish", weight: 0.8 },
                { question: "Is French the primary language?", attribute: "language", value: "french", weight: 0.85 },
                { question: "Is Portuguese the primary language?", attribute: "language", value: "portuguese", weight: 0.9 },
                { question: "Is Russian the primary language?", attribute: "language", value: "russian", weight: 0.9 },
                { question: "Is Japanese the primary language?", attribute: "language", value: "japanese", weight: 0.98 },
                { question: "Is Hindi the primary language?", attribute: "language", value: "hindi", weight: 0.95 },
                { question: "Is German the primary language?", attribute: "language", value: "german", weight: 0.9 },
                { question: "Is Italian the primary language?", attribute: "language", value: "italian", weight: 0.95 },
                { question: "Is Dutch the primary language?", attribute: "language", value: "dutch", weight: 0.95 },
                { question: "Is Turkish the primary language?", attribute: "language", value: "turkish", weight: 0.95 },
                { question: "Is Korean the primary language?", attribute: "language", value: "korean", weight: 0.98 },
                { question: "Is Persian the primary language?", attribute: "language", value: "persian", weight: 0.95 },
                { question: "Is Greek the primary language?", attribute: "language", value: "greek", weight: 0.95 },
                { question: "Is Hebrew the primary language?", attribute: "language", value: "hebrew", weight: 0.98 },
                { question: "Is Urdu the primary language?", attribute: "language", value: "urdu", weight: 0.95 },
                { question: "Is Vietnamese the primary language?", attribute: "language", value: "vietnamese", weight: 0.98 },
                { question: "Is Thai the primary language?", attribute: "language", value: "thai", weight: 0.98 },
                { question: "Is Malay the primary language?", attribute: "language", value: "malay", weight: 0.95 },
                { question: "Is Indonesian the primary language?", attribute: "language", value: "indonesian", weight: 0.98 },
                { question: "Is Polish the primary language?", attribute: "language", value: "polish", weight: 0.95 },
                { question: "Is Romanian the primary language?", attribute: "language", value: "romanian", weight: 0.95 },
                { question: "Is Ukrainian the primary language?", attribute: "language", value: "ukrainian", weight: 0.95 },
                { question: "Is Swedish the primary language?", attribute: "language", value: "swedish", weight: 0.95 },
                { question: "Is Norwegian the primary language?", attribute: "language", value: "norwegian", weight: 0.95 },
                { question: "Is Danish the primary language?", attribute: "language", value: "danish", weight: 0.95 },
                { question: "Is Finnish the primary language?", attribute: "language", value: "finnish", weight: 0.98 },
                { question: "Is Czech the primary language?", attribute: "language", value: "czech", weight: 0.95 },
                { question: "Is Hungarian the primary language?", attribute: "language", value: "hungarian", weight: 0.95 },
                { question: "Is Swahili the primary language?", attribute: "language", value: "swahili", weight: 0.9 },
                
                // FAMOUS FOR (Stage 5) - ARRAY MATCHING
                { question: "Is it famous for cricket?", attribute: "famousFor", value: "cricket", weight: 0.95 },
                { question: "Is it famous for football/soccer?", attribute: "famousFor", value: "football", weight: 0.85 },
                { question: "Is it famous for technology?", attribute: "famousFor", value: "technology", weight: 0.85 },
                { question: "Is it famous for Bollywood?", attribute: "famousFor", value: "bollywood", weight: 0.98 },
                { question: "Is it famous for anime?", attribute: "famousFor", value: "anime", weight: 0.98 },
                { question: "Is it famous for K-pop/Korean pop culture?", attribute: "famousFor", value: "kpop", weight: 0.98 },
                { question: "Is it famous for oil/petroleum?", attribute: "famousFor", value: "oil", weight: 0.9 },
                { question: "Is it famous for wine?", attribute: "famousFor", value: "wine", weight: 0.9 },
                { question: "Is it famous for coffee?", attribute: "famousFor", value: "coffee", weight: 0.9 },
                { question: "Is it famous for pyramids?", attribute: "famousFor", value: "pyramids", weight: 0.98 },
                { question: "Is it famous for the Great Wall?", attribute: "famousFor", value: "great wall", weight: 0.98 },
                { question: "Is it famous for the Eiffel Tower?", attribute: "famousFor", value: "eiffel tower", weight: 0.98 },
                { question: "Is it famous for kangaroos/unique wildlife?", attribute: "famousFor", value: "kangaroos", weight: 0.98 },
                { question: "Is it famous for safari?", attribute: "famousFor", value: "safari", weight: 0.9 },
                { question: "Is it famous for sushi?", attribute: "famousFor", value: "sushi", weight: 0.98 },
                { question: "Is it famous for pasta/pizza?", attribute: "famousFor", value: "pasta", weight: 0.95 },
                { question: "Is it famous for tacos/Mexican food?", attribute: "famousFor", value: "tacos", weight: 0.98 },
                { question: "Is it famous for Amazon rainforest?", attribute: "famousFor", value: "amazon", weight: 0.98 },
                { question: "Is it famous for Machu Picchu?", attribute: "famousFor", value: "machu picchu", weight: 0.98 },
                { question: "Is it famous for chocolate?", attribute: "famousFor", value: "chocolate", weight: 0.9 },
                { question: "Is it famous for beer?", attribute: "famousFor", value: "beer", weight: 0.85 },
                { question: "Is it famous for vodka?", attribute: "famousFor", value: "vodka", weight: 0.95 },
                { question: "Is it famous for maple syrup?", attribute: "famousFor", value: "maple syrup", weight: 0.98 },
                { question: "Is it famous for fjords?", attribute: "famousFor", value: "fjords", weight: 0.95 },
                { question: "Is it famous for Vikings?", attribute: "famousFor", value: "vikings", weight: 0.9 },
                { question: "Is it famous for tango?", attribute: "famousFor", value: "tango", weight: 0.98 },
                { question: "Is it famous for cigars?", attribute: "famousFor", value: "cigars", weight: 0.95 },
                { question: "Is it famous for diamonds?", attribute: "famousFor", value: "diamonds", weight: 0.9 },
                { question: "Is it famous for gold?", attribute: "famousFor", value: "gold", weight: 0.85 },
                { question: "Is it famous for tea?", attribute: "famousFor", value: "tea", weight: 0.9 },
                { question: "Is it famous for spices?", attribute: "famousFor", value: "spices", weight: 0.9 },
                { question: "Is it famous for tulips?", attribute: "famousFor", value: "tulips", weight: 0.98 },
                { question: "Is it famous for watches?", attribute: "famousFor", value: "watches", weight: 0.98 },
                { question: "Is it famous for LEGO?", attribute: "famousFor", value: "lego", weight: 0.98 },
                { question: "Is it famous for IKEA?", attribute: "famousFor", value: "ikea", weight: 0.98 },
                { question: "Is it famous for reggae music?", attribute: "famousFor", value: "reggae", weight: 0.98 },
                { question: "Is it famous for Hollywood?", attribute: "famousFor", value: "hollywood", weight: 0.98 },
                { question: "Is it famous for fashion?", attribute: "famousFor", value: "fashion", weight: 0.9 },
                { question: "Is it famous for tequila?", attribute: "famousFor", value: "tequila", weight: 0.98 },
                { question: "Is it famous for rugby?", attribute: "famousFor", value: "rugby", weight: 0.9 },
                { question: "Is it famous for opera?", attribute: "famousFor", value: "opera", weight: 0.9 },
                { question: "Is it famous for ballet?", attribute: "famousFor", value: "ballet", weight: 0.95 },
                { question: "Is it famous for carnival?", attribute: "famousFor", value: "carnival", weight: 0.98 },
                { question: "Is it famous for curry?", attribute: "famousFor", value: "curry", weight: 0.95 },
                { question: "Is it famous for rice?", attribute: "famousFor", value: "rice", weight: 0.8 },
                { question: "Is it famous for Nelson Mandela?", attribute: "famousFor", value: "nelson mandela", weight: 0.98 },
                { question: "Is it famous for pandas?", attribute: "famousFor", value: "pandas", weight: 0.98 },
                { question: "Is it famous for the Taj Mahal?", attribute: "famousFor", value: "taj mahal", weight: 0.98 },
                { question: "Is it famous for samurai?", attribute: "famousFor", value: "samurai", weight: 0.98 },
                { question: "Is it famous for pharaohs?", attribute: "famousFor", value: "pharaohs", weight: 0.98 },
                { question: "Is it famous for the Colosseum?", attribute: "famousFor", value: "colosseum", weight: 0.98 },
                
                // DRIVE SIDE (Stage 4)
                { question: "Do they drive on the left side of the road?", attribute: "driveSide", value: "left", weight: 0.75 },
                
                // FLAG COLORS (Stage 4) - Less reliable but useful
                { question: "Does the flag have red color?", attribute: "flagColors", value: "red", weight: 0.6 },
                { question: "Does the flag have green color?", attribute: "flagColors", value: "green", weight: 0.65 },
                { question: "Does the flag have blue color?", attribute: "flagColors", value: "blue", weight: 0.6 },
                { question: "Does the flag have white color?", attribute: "flagColors", value: "white", weight: 0.55 },
                { question: "Does the flag have yellow/gold color?", attribute: "flagColors", value: "yellow", weight: 0.65 },
                { question: "Does the flag have black color?", attribute: "flagColors", value: "black", weight: 0.7 },
                { question: "Does the flag have orange color?", attribute: "flagColors", value: "orange", weight: 0.75 },
                { question: "Does the flag have saffron color?", attribute: "flagColors", value: "saffron", weight: 0.8 },
                
                // NEIGHBORS (Stage 5) - VERY SPECIFIC
                { question: "Does it border India?", attribute: "neighbors", value: "india", weight: 0.9 },
                { question: "Does it border China?", attribute: "neighbors", value: "china", weight: 0.85 },
                { question: "Does it border Russia?", attribute: "neighbors", value: "russia", weight: 0.85 },
                { question: "Does it border Germany?", attribute: "neighbors", value: "germany", weight: 0.85 },
                { question: "Does it border France?", attribute: "neighbors", value: "france", weight: 0.85 },
                { question: "Does it border Brazil?", attribute: "neighbors", value: "brazil", weight: 0.85 },
                { question: "Does it border the USA?", attribute: "neighbors", value: "usa", weight: 0.9 },
                { question: "Does it border Pakistan?", attribute: "neighbors", value: "pakistan", weight: 0.9 },
                { question: "Does it border Myanmar?", attribute: "neighbors", value: "myanmar", weight: 0.9 },
                { question: "Does it border Afghanistan?", attribute: "neighbors", value: "afghanistan", weight: 0.9 },
                { question: "Does it border Iran?", attribute: "neighbors", value: "iran", weight: 0.85 },
                { question: "Does it border Turkey?", attribute: "neighbors", value: "turkey", weight: 0.85 },
                { question: "Does it border Poland?", attribute: "neighbors", value: "poland", weight: 0.85 },
                { question: "Does it border Ukraine?", attribute: "neighbors", value: "ukraine", weight: 0.85 },
                { question: "Does it border Spain?", attribute: "neighbors", value: "spain", weight: 0.9 },
                { question: "Does it border Italy?", attribute: "neighbors", value: "italy", weight: 0.85 },
                { question: "Does it border Mexico?", attribute: "neighbors", value: "mexico", weight: 0.9 },
                { question: "Does it border Canada?", attribute: "neighbors", value: "canada", weight: 0.95 },
                { question: "Does it border Saudi Arabia?", attribute: "neighbors", value: "saudi arabia", weight: 0.85 },
                { question: "Does it border Egypt?", attribute: "neighbors", value: "egypt", weight: 0.85 },
                { question: "Does it border South Africa?", attribute: "neighbors", value: "south africa", weight: 0.85 },
                { question: "Does it border Argentina?", attribute: "neighbors", value: "argentina", weight: 0.85 },
                { question: "Does it border Australia? (Note: most don't)", attribute: "neighbors", value: "australia", weight: 0.95 },
                
                // EXPORTS (Stage 4)
                { question: "Does it export oil/petroleum?", attribute: "exports", value: "oil", weight: 0.85 },
                { question: "Does it export electronics?", attribute: "exports", value: "electronics", weight: 0.8 },
                { question: "Does it export cars/vehicles?", attribute: "exports", value: "cars", weight: 0.85 },
                { question: "Does it export textiles/clothing?", attribute: "exports", value: "textiles", weight: 0.75 },
                { question: "Does it export coffee?", attribute: "exports", value: "coffee", weight: 0.9 },
                { question: "Does it export gold?", attribute: "exports", value: "gold", weight: 0.85 },
                { question: "Does it export diamonds?", attribute: "exports", value: "diamonds", weight: 0.9 },
                { question: "Does it export natural gas?", attribute: "exports", value: "gas", weight: 0.85 },
                { question: "Does it export machinery?", attribute: "exports", value: "machinery", weight: 0.75 },
                { question: "Does it export aircraft?", attribute: "exports", value: "aircraft", weight: 0.9 },
                { question: "Does it export pharmaceuticals/medicine?", attribute: "exports", value: "pharmaceuticals", weight: 0.85 },
                { question: "Does it export wine?", attribute: "exports", value: "wine", weight: 0.9 },
                { question: "Does it export fish/seafood?", attribute: "exports", value: "fish", weight: 0.8 },
                { question: "Does it export coal?", attribute: "exports", value: "coal", weight: 0.85 },
                { question: "Does it export copper?", attribute: "exports", value: "copper", weight: 0.85 },
                { question: "Does it export software/IT services?", attribute: "exports", value: "software", weight: 0.9 },
                { question: "Does it export agricultural products?", attribute: "exports", value: "agriculture", weight: 0.7 },
                { question: "Does it export bananas?", attribute: "exports", value: "bananas", weight: 0.9 },
                { question: "Does it export soybeans?", attribute: "exports", value: "soybeans", weight: 0.85 },
                { question: "Does it export iron ore?", attribute: "exports", value: "iron ore", weight: 0.85 }
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
                { question: "Is it a very large city (10M+)?", attribute: "size", value: "verylarge", weight: 0.85 }
            ],
            
            place: [
                { question: "Is it a monument?", attribute: "type", value: "monument", weight: 0.8 },
                { question: "Is it a temple?", attribute: "type", value: "temple", weight: 0.85 },
                { question: "Is it ancient ruins?", attribute: "type", value: "ruins", weight: 0.85 },
                { question: "Is it in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
                { question: "Is it in Europe?", attribute: "continent", value: "europe", weight: 1.0 }
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

        // Reset algorithm
        localAlgorithm.reset();

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
        
        console.log(`🎮 Starting new game: ${category}`);
        console.log(`📊 Total items: ${this.state.possibleItems.length}`);
        console.log(`❓ Total questions available: ${this.state.questions.length}`);
        
        this.showThinkingScreen(category);
        
        setTimeout(() => {
            this.showQuestionScreen();
            this.askNextQuestion();
        }, CONFIG.GAME.THINKING_DURATION);
    }

    async askNextQuestion() {
        // Check stopping condition
        if (localAlgorithm.shouldStopAsking(
            this.state.possibleItems,
            this.state.questionNumber,
            this.state.maxQuestions
        )) {
            this.showResult();
            return;
        }

        // Get next question using advanced algorithm
        const question = localAlgorithm.selectBestQuestion(
            this.state.category,
            this.state.askedQuestions,
            this.state.possibleItems
        );

        if (!question) {
            console.log('No more questions available, showing result');
            this.showResult();
            return;
        }

        this.state.currentQuestion = question;
        this.state.questionNumber++;
        this.state.askedQuestions.push(question.question);

        this.updateQuestionUI(question);
    }

    updateQuestionUI(question) {
        const questionText = document.getElementById('questionText');
        questionText.style.opacity = '0';
        
        setTimeout(() => {
            questionText.textContent = question.question;
            questionText.style.opacity = '1';
        }, 150);

        const progress = Math.min((this.state.questionNumber / this.state.maxQuestions) * 100, 100);
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

        // Filter items using advanced algorithm
        this.state.possibleItems = localAlgorithm.filterItems(
            this.state.possibleItems,
            this.state.currentQuestion,
            answer
        );

        if (questionText) {
            questionText.style.opacity = '1';
        }

        if (CONFIG.DEBUG.ENABLED) {
            console.log('📊 Items remaining:', this.state.possibleItems.length);
            if (this.state.possibleItems.length <= 10) {
                console.log('Top items:', this.state.possibleItems.map(i => i.name));
            }
        }

        setTimeout(() => {
            this.askNextQuestion();
        }, CONFIG.GAME.QUESTION_DELAY);
    }

    async showResult() {
        let prediction = localAlgorithm.getBestGuess(this.state.possibleItems);
        let confidence = localAlgorithm.calculateConfidence(this.state.possibleItems);
        
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

        console.log(`🎯 Final prediction: ${prediction.name}`);
        console.log(`📊 Confidence: ${confidence}%`);
        console.log(`❓ Questions asked: ${this.state.questionNumber}`);

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
        localAlgorithm.reset();
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
        this.showWelcomeScreen();
    }
}

const game = new Game();
