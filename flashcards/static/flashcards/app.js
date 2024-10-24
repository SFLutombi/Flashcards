class Flashcard {
    constructor(question, answer) {
        this.question = question;
        this.answer = answer;
    }
}

let flashcards = [];
let currentCardIndex = 0;
let showAnswer = false;
let currentMode = ''; // Store the current mode

function displayCard() {
    // Construct the ID based on the mode
    const flashcardContentId = `${currentMode}-flashcard-content`; // e.g., "learn-flashcard-content"
    const flashcardAnswerId = `${currentMode}-flashcard-answer`; // e.g., "learn-flashcard-answer"
    const flashcardContent = document.getElementById(flashcardContentId); // Select by ID
    const flashcardAnswer = document.getElementById(flashcardAnswerId); // Select by ID

    // Check if the flashcardContent element is found
    if (!flashcardContent) {
        console.error(`No element found for mode: ${currentMode}`); // Error handling for debugging
        return;
    }

    if (flashcards.length === 0) {
        flashcardContent.innerText = 'No flashcards available.';
        return;
    }

    const currentCard = flashcards[currentCardIndex];
    flashcardContent.innerText = currentCard.question; // Display the current question

    if (currentMode === 'learn' || currentMode === 'truefalse') {
        flashcardAnswer.innerText = currentCard.answer; // Display the answer
    }
}

function generateTrueFalseCards(deck, flashcards) {
    // Create a new array to hold the true/false cards
    const trueFalseCards = [];

    // Loop through each flashcard in the deck
    flashcards.forEach(card => {
        // Create a question object
        const questionObj = {
            question: card.question,
            answer: card.answer // Store the correct answer initially
        };

        // Get all answers excluding the current card's answer to ensure it's not the same
        const wrongAnswers = flashcards
            .filter(c => c.answer !== card.answer) // Filter out the correct answer
            .map(c => c.answer); // Get answers from other cards

        // Randomly select a false answer from the available options
        const falseAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];

        // Randomly choose between the correct answer and the false answer
        questionObj.answer = Math.random() < 0.5 ? questionObj.answer : falseAnswer;

        // Add the question object to the trueFalseCards array
        trueFalseCards.push(questionObj);
    });

    return trueFalseCards;
}

function fetchFlashcards(deckId, shuffle = false) {
    const url = `/api/flashcards/${deckId}${shuffle ? '?shuffle=true' : ''}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Create flashcards from the fetched data
            flashcards = data.map(item => new Flashcard(item.question, item.answer));

            // If the current mode is true/false, generate true/false cards
            if (currentMode === 'truefalse') {
                flashcards = generateTrueFalseCards(deckId, flashcards);
            }

            currentCardIndex = 0;
            displayCard(currentMode); // Call displayCard with the current mode
        })
        .catch(error => {
            console.error('Error fetching flashcards:', error);
            alert('Failed to load flashcards. Please try again.');
        });
}

// Event delegation handler for the entire mode-container
function setupModeEventListeners() {
    const modeContainer = document.getElementById('mode-container');
    
    if (!modeContainer) return;

    modeContainer.addEventListener('click', (event) => {
        const target = event.target;

        // Handle button clicks using data attributes
        if (target.matches('[data-action]')) {
            const action = target.dataset.action;
            
            switch (action) {
                case 'toggle-answer-learn':
                    toggleAnswer('learn');;
                    break;
                case 'toggle-answer-test':
                    toggleAnswer('test');
                    break;
                case 'next-card':
                    currentCardIndex = (currentCardIndex + 1) % flashcards.length;
                    displayCard();
                    break;
                case 'prev-card':
                    currentCardIndex = (currentCardIndex - 1 + flashcards.length) % flashcards.length;
                    displayCard();
                    break;
                case 'true':
                    // Handle true button click
                    break;
                case 'false':
                    // Handle false button click
                    break;
                
                // Add more actions as needed
            }
        }
    });

    // Handle select changes using event delegation
    modeContainer.addEventListener('change', (event) => {
        const target = event.target;

        if (target.matches('[data-deck-select]')) {
            const mode = target.dataset.deckSelect;
            const deckId = target.value;

            if (!deckId) {
                alert('Please select a valid deck.');
                return;
            }

            // Shuffle cards only in test mode
            fetchFlashcards(deckId, mode === 'truefalse' || mode === 'matching');
        }
    });
}

// Load mode content and initialize components
function loadMode(mode) {
    currentMode = mode; // Store the current mode

    fetch(`/mode/${mode}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${mode} mode`);
            }
            return response.text();
        })
        .then(html => {
            const modeContainer = document.getElementById('mode-container');
            modeContainer.innerHTML = html;
            
            // Load decks if the mode has deck selects
            if (modeContainer.querySelector('[data-deck-select]')) {
                loadDecks();
            }
        })
        .catch(error => {
            console.error('Error loading the mode:', error);
        });
}

// Modified loadDecks function to use data attributes
function loadDecks() {
    fetch('/api/decks/')
        .then(response => response.json())
        .then(decks => {
            // Find all deck select elements using data attribute
            const deckSelects = document.querySelectorAll('[data-deck-select]');
            
            deckSelects.forEach(select => {
                // Clear existing options except the default
                while (select.options.length > 1) {
                    select.remove(1);
                }
                
                // Add deck options
                decks.forEach(deck => {
                    const option = document.createElement('option');
                    option.value = deck.id;
                    option.textContent = deck.name;
                    select.appendChild(option);
                });
            });
        })
        .catch(error => console.error('Error loading decks:', error));
}

// Dynamic toggle function for answers
function toggleAnswer(mode) {
    // Construct the IDs for question and answer based on the mode
    const questionId = '${mode}-flashcard-content'; // e.g., "learn-flashcard-content"
    const answerId = '${mode}-flashcard-answer'; // e.g., "learn-flashcard-answer"

    const questionElement = document.getElementById(questionId);
    const answerElement = document.getElementById(answerId);

    // Check if both elements are found
    if (!questionElement || !answerElement) {
        console.error('Elements not found for mode: ${mode}');
        return;
    }

    // Toggle visibility
    if (answerElement.style.display === 'none' || answerElement.style.display === '') {
        answerElement.style.display = 'block'; // Show answer
        questionElement.style.display = 'none'; // Hide question
    } else {
        answerElement.style.display = 'none'; // Hide answer
        questionElement.style.display = 'block'; // Show question
    }
}


// Initialize event delegation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setupModeEventListeners();
});

function showTestground() {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('testground-view').classList.remove('hidden');
}

function showDashboard() {
    document.getElementById('testground-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
}

function showLearn() {
    document.getElementById('learn-view').classList.remove('hidden');
    document.getElementById('review-view').classList.add('hidden');
    document.getElementById('truefalse-view').classList.add('hidden');
    document.getElementById('matching-view').classList.add('hidden');
}

function showReview() {
    document.getElementById('learn-view').classList.add('hidden');
    document.getElementById('review-view').classList.remove('hidden');
    document.getElementById('truefalse-view').classList.add('hidden');
    document.getElementById('matching-view').classList.add('hidden');
}

function showTrueFalse() {
    document.getElementById('learn-view').classList.add('hidden');
    document.getElementById('review-view').classList.add('hidden');
    document.getElementById('truefalse-view').classList.remove('hidden');
    document.getElementById('matching-view').classList.add('hidden');
}

function showMatching() {
    document.getElementById('learn-view').classList.add('hidden');
    document.getElementById('review-view').classList.add('hidden');
    document.getElementById('truefalse-view').classList.add('hidden');
    document.getElementById('matching-view').classList.remove('hidden');
}





  