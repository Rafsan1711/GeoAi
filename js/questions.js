// questions.js - Question bank for the game

const questionBank = {
    country: [
        // Continent questions (highest weight)
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
        { question: "Does it have a temperate climate?", attribute: "climate", value: "temperate", weight: 0.6 },
        
        // Famous attributes
        { question: "Is it famous for cricket?", attribute: "famousFor", value: "cricket", weight: 0.9 },
        { question: "Is it famous for technology and innovation?", attribute: "famousFor", value: "technology", weight: 0.8 },
        { question: "Is it famous for the pyramids?", attribute: "famousFor", value: "pyramids", weight: 0.95 },
        { question: "Is it famous for football/soccer?", attribute: "famousFor", value: "football", weight: 0.85 },
        { question: "Is it famous for Bollywood?", attribute: "famousFor", value: "bollywood", weight: 0.95 },
        { question: "Is it famous for the Eiffel Tower?", attribute: "famousFor", value: "eiffeltower", weight: 0.95 },
        { question: "Is it famous for the Great Wall?", attribute: "famousFor", value: "greatwall", weight: 0.95 },
        { question: "Is it famous for unique wildlife like kangaroos?", attribute: "famousFor", value: "wildlife", weight: 0.9 },
        
        // Language
        { question: "Is Bengali the primary language?", attribute: "language", value: "bengali", weight: 0.95 },
        { question: "Is English the primary language?", attribute: "language", value: "english", weight: 0.7 },
        { question: "Is French the primary language?", attribute: "language", value: "french", weight: 0.9 },
        { question: "Is Arabic the primary language?", attribute: "language", value: "arabic", weight: 0.8 },
        { question: "Is Chinese the primary language?", attribute: "language", value: "chinese", weight: 0.9 },
        
        // Economy
        { question: "Is it considered a developed country?", attribute: "gdp", value: "developed", weight: 0.7 },
        { question: "Is it a developing country?", attribute: "gdp", value: "developing", weight: 0.6 },
        
        // Regional
        { question: "Is it in South Asia?", attribute: "region", value: "south", weight: 0.75 },
        { question: "Is it in East Asia?", attribute: "region", value: "east", weight: 0.75 },
        { question: "Is it in Western Europe?", attribute: "region", value: "west", weight: 0.75 }
    ],

    city: [
        // Capital status
        { question: "Is it a capital city?", attribute: "isCapital", value: true, weight: 0.85 },
        
        // Continent
        { question: "Is it located in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
        { question: "Is it located in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
        { question: "Is it located in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
        { question: "Is it located in North America?", attribute: "continent", value: "northamerica", weight: 1.0 },
        { question: "Is it located in Oceania?", attribute: "continent", value: "oceania", weight: 1.0 },
        
        // Geographic features
        { question: "Does a major river run through it?", attribute: "hasRiver", value: true, weight: 0.7 },
        { question: "Does it have a metro/subway system?", attribute: "hasMetro", value: true, weight: 0.6 },
        
        // Size
        { question: "Is it a very large city (over 10 million people)?", attribute: "size", value: "verylarge", weight: 0.8 },
        { question: "Is it a large city (3-10 million people)?", attribute: "size", value: "large", weight: 0.65 },
        
        // Climate
        { question: "Does it have a tropical climate?", attribute: "climate", value: "tropical", weight: 0.7 },
        { question: "Does it have a desert climate?", attribute: "climate", value: "desert", weight: 0.85 },
        { question: "Does it have a temperate climate?", attribute: "climate", value: "temperate", weight: 0.6 },
        
        // Famous landmarks
        { question: "Is it famous for the Eiffel Tower?", attribute: "famousFor", value: "eiffeltower", weight: 0.98 },
        { question: "Is it famous for cutting-edge technology?", attribute: "famousFor", value: "technology", weight: 0.85 },
        { question: "Is it famous for colorful rickshaws?", attribute: "famousFor", value: "rickshaw", weight: 0.95 },
        { question: "Is it famous for the Burj Khalifa?", attribute: "famousFor", value: "burjkhalifa", weight: 0.98 },
        { question: "Is it famous for the Statue of Liberty?", attribute: "famousFor", value: "statueofliberty", weight: 0.98 },
        { question: "Is it famous for Big Ben?", attribute: "famousFor", value: "bigben", weight: 0.95 },
        { question: "Is it famous for the Opera House?", attribute: "famousFor", value: "operahouse", weight: 0.98 },
        { question: "Is it near the pyramids?", attribute: "famousFor", value: "pyramids", weight: 0.95 },
        
        // Country
        { question: "Is it located in Bangladesh?", attribute: "country", value: "bangladesh", weight: 0.95 },
        { question: "Is it located in France?", attribute: "country", value: "france", weight: 0.9 },
        { question: "Is it located in Japan?", attribute: "country", value: "japan", weight: 0.9 },
        { question: "Is it located in the United States?", attribute: "country", value: "usa", weight: 0.85 },
        { question: "Is it located in the United Arab Emirates?", attribute: "country", value: "uae", weight: 0.95 },
        { question: "Is it located in the United Kingdom?", attribute: "country", value: "uk", weight: 0.9 },
        { question: "Is it located in Australia?", attribute: "country", value: "australia", weight: 0.95 },
        { question: "Is it located in Egypt?", attribute: "country", value: "egypt", weight: 0.95 }
    ],

    place: [
        // Type
        { question: "Is it a monument or memorial?", attribute: "type", value: "monument", weight: 0.8 },
        { question: "Is it a temple or religious structure?", attribute: "type", value: "temple", weight: 0.85 },
        { question: "Is it an amphitheater or arena?", attribute: "type", value: "amphitheater", weight: 0.9 },
        { question: "Is it ancient ruins?", attribute: "type", value: "ruins", weight: 0.85 },
        { question: "Is it a natural forest or wilderness?", attribute: "type", value: "forest", weight: 0.85 },
        { question: "Is it a canyon or gorge?", attribute: "type", value: "canyon", weight: 0.9 },
        { question: "Is it a tower?", attribute: "type", value: "tower", weight: 0.85 },
        { question: "Is it a defensive wall?", attribute: "type", value: "wall", weight: 0.9 },
        { question: "Is it a statue?", attribute: "type", value: "statue", weight: 0.85 },
        
        // Continent
        { question: "Is it located in Asia?", attribute: "continent", value: "asia", weight: 1.0 },
        { question: "Is it located in Europe?", attribute: "continent", value: "europe", weight: 1.0 },
        { question: "Is it located in Africa?", attribute: "continent", value: "africa", weight: 1.0 },
        { question: "Is it located in North America?", attribute: "continent", value: "northamerica", weight: 1.0 },
        { question: "Is it located in South America?", attribute: "continent", value: "southamerica", weight: 1.0 },
        
        // Age
        { question: "Is it from ancient times (over 2000 years old)?", attribute: "age", value: "ancient", weight: 0.85 },
        { question: "Is it relatively old (500-2000 years)?", attribute: "age", value: "old", weight: 0.7 },
        { question: "Is it modern (less than 200 years old)?", attribute: "age", value: "modern", weight: 0.75 },
        { question: "Is it a natural formation?", attribute: "age", value: "natural", weight: 0.9 },
        
        // Famous for
        { question: "Is it famous as a symbol of love?", attribute: "famousFor", value: "love", weight: 0.98 },
        { question: "Is it associated with pharaohs and ancient Egypt?", attribute: "famousFor", value: "pharaohs", weight: 0.95 },
        { question: "Is it famous for gladiator battles?", attribute: "famousFor", value: "gladiators", weight: 0.98 },
        { question: "Is it associated with the Inca civilization?", attribute: "famousFor", value: "incas", weight: 0.98 },
        { question: "Is it famous for Bengal tigers?", attribute: "famousFor", value: "tigers", weight: 0.95 },
        { question: "Is it famous for its natural beauty and geology?", attribute: "famousFor", value: "nature", weight: 0.75 },
        { question: "Is it an iconic symbol of Paris?", attribute: "famousFor", value: "paris", weight: 0.98 },
        { question: "Was it built for defense purposes?", attribute: "famousFor", value: "defense", weight: 0.9 },
        { question: "Is it a symbol of freedom?", attribute: "famousFor", value: "freedom", weight: 0.98 },
        { question: "Is it a religious site?", attribute: "famousFor", value: "religion", weight: 0.85 },
        
        // Nature
        { question: "Is it a completely natural place (not man-made)?", attribute: "isNatural", value: true, weight: 0.85 },
        { question: "Is it a man-made structure?", attribute: "isNatural", value: false, weight: 0.7 },
        
        // Religious
        { question: "Is it a religious or spiritual site?", attribute: "isReligious", value: true, weight: 0.8 },
        
        // Access
        { question: "Can tourists visit it?", attribute: "visitorsAllowed", value: true, weight: 0.5 },
        
        // Country
        { question: "Is it located in India?", attribute: "country", value: "india", weight: 0.9 },
        { question: "Is it located in Egypt?", attribute: "country", value: "egypt", weight: 0.95 },
        { question: "Is it located in Italy?", attribute: "country", value: "italy", weight: 0.9 },
        { question: "Is it located in Peru?", attribute: "country", value: "peru", weight: 0.98 },
        { question: "Is it located in Bangladesh?", attribute: "country", value: "bangladesh", weight: 0.95 },
        { question: "Is it located in the United States?", attribute: "country", value: "usa", weight: 0.85 },
        { question: "Is it located in France?", attribute: "country", value: "france", weight: 0.95 },
        { question: "Is it located in China?", attribute: "country", value: "china", weight: 0.95 },
        { question: "Is it located in Cambodia?", attribute: "country", value: "cambodia", weight: 0.98 }
    ]
};