// 1. Class definitions
class Flashcard {
    constructor(question, answer) {
        this.question = question;
        this.answer = answer;
    }
}

// 2. Global state variables
let flashcards = [];
let currentCardIndex = 0;
let showAnswer = false;
let currentMode = '';

// 3. Core data manipulation functions
function generateTrueFalseCards(originalFlashcards) {
    if (!Array.isArray(originalFlashcards) || originalFlashcards.length === 0) {
        console.error('Invalid flashcards array provided to generateTrueFalseCards');
        return [];
    }

    const trueFalseCards = [];

    originalFlashcards.forEach(card => {
        const questionObj = {
            question: card.question,
            answer: card.answer,
            correctAnswer: 'True',
            displayedAnswer: card.answer,
            Answer: 'True'
        };
 
        const wrongAnswers = originalFlashcards
            .filter(c => c.answer !== card.answer)
            .map(c => c.answer);

        if (wrongAnswers.length > 0) {
            const showCorrect = Math.random() < 0.5;
            
            if (!showCorrect) {
                const falseAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
                questionObj.displayedAnswer = falseAnswer;
                questionObj.correctAnswer = 'False';
            }
        }

        trueFalseCards.push(questionObj);
    });

    return trueFalseCards;
}

function checkAnswer(card, userAnswer) {
    if (!card || typeof card.correctAnswer === 'undefined') {
        console.error('Invalid card object:', card);
        return false;
    }
    console.log('this is the  user answer:', userAnswer);
    const isDisplayedCorrect = (card.Answer === card.correctAnswer);
    console.log('this is the correct answer:', card.correctAnswer);
    console.log('this is the displayed answer:', card.displayedAnswer);
    return (userAnswer === 'true' && isDisplayedCorrect) || 
           (userAnswer === 'false' && !isDisplayedCorrect);
}

function deleteFlashcard(event, formElement) {
    event.preventDefault();  // Prevent form submission

    const flashcardDiv = formElement.closest('.flashcard');  // Get the parent flashcard div
    const flashcardId = flashcardDiv.dataset.flashcardId;  // Extract flashcard ID from data attribute
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(`/delete-flashcard/${flashcardId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            flashcardDiv.remove();  // Remove the flashcard div from the DOM
        } else {
            alert('Error deleting flashcard');
        }
    })
    .catch(error => console.error('Error:', error));
}

function deleteDeck(event, buttonElement) {
    event.preventDefault();  // Prevent default form submission

    const deckDiv = buttonElement.closest('.deck-card');  // Get the deck div
    const deckId = deckDiv.dataset.deckId;  // Extract the deck ID
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(`/delete_deck/${deckId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Deck deleted successfully!');
            deckDiv.remove();  // Remove the deck div from the DOM

            // Remove the deck from the select dropdown
            const optionToRemove = document.querySelector(`#selected_deck option[value="${deckId}"]`);
            if (optionToRemove) {
                optionToRemove.remove();
            }

            // Clear the edit deck form and flashcards if the deleted deck was selected
            const selectedDeckInput = document.querySelector('input[name="selected_deck"]');
            if (selectedDeckInput && selectedDeckInput.value == deckId) {
                clearEditDeckForm();  // Call function to clear the form
                hideFlashcardSections();  // Call function to hide the flashcard sections
            }
        } else {
            alert('Error deleting deck');
        }
    })
    .catch(error => console.error('Error:', error));
}

function saveFlashcard(event, flashcardId) {
    event.preventDefault(); // Prevent form from submitting normally

    const form = document.getElementById(`edit-flashcard-form-${flashcardId}`);
    const formData = new FormData(form);

    fetch(`/edit_flashcard/${flashcardId}/`, {
        method: 'POST',
        body: formData,
        headers: {
            // Remove CSRF token header for testing
        },
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to save changes.');
        }
    })
    .then(data => {
        // Update the flashcard display with new values
        document.getElementById(`question_${flashcardId}`).value = data.question;
        document.getElementById(`answer_${flashcardId}`).value = data.answer;
        alert("Flashcard updated successfully!");
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Error saving flashcard.");
    });
}

// Function to clear the edit deck form
function clearEditDeckForm() {
    const deckNameInput = document.querySelector('input[name="edit_deck_name"]');
    const deckDescriptionTextarea = document.querySelector('textarea[name="edit_deck_description"]');
    const editDeckForm = document.getElementById('edit-deck-form');
    if (deckNameInput) deckNameInput.value = '';  // Clear the deck name input
    if (deckDescriptionTextarea) deckDescriptionTextarea.value = '';  // Clear the deck description textarea
    if (editDeckForm) editDeckForm.style.display = 'none';  // Clear the deck ID from the form data attribute
}

// Function to hide the flashcard sections
function hideFlashcardSections() {
    const flashcardsContainer = document.getElementById('flashcards-container');
    const addFlashcardForm = document.getElementById('add-flashcard-form');
    
    if (flashcardsContainer) flashcardsContainer.style.display = 'none';  // Hide flashcards
    if (addFlashcardForm) addFlashcardForm.style.display = 'none';  // Hide add flashcard form
}

// 4. API interaction functions
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
            const originalFlashcards = data.map(item => new Flashcard(item.question, item.answer));

            if (currentMode === 'truefalse') {
                flashcards = generateTrueFalseCards(originalFlashcards);
            } else {
                flashcards = originalFlashcards;
            }

            currentCardIndex = 0;
            displayCard();
        })
        .catch(error => {
            console.error('Error fetching flashcards:', error);
            alert('Failed to load flashcards. Please try again.');
        });
}

function loadDecks() {
    fetch('/api/decks/')
        .then(response => response.json())
        .then(decks => {
            const deckSelects = document.querySelectorAll('[data-deck-select]');
            
            deckSelects.forEach(select => {
                while (select.options.length > 1) {
                    select.remove(1);
                }
                
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

// 5. UI Display functions
function displayCard() {
    const flashcardContentId = `${currentMode}-flashcard-content`; 
    const flashcardAnswerId = `${currentMode}-flashcard-answer`; 
    const flashcardContent = document.getElementById(flashcardContentId);
    const flashcardAnswer = document.getElementById(flashcardAnswerId);

    if (!flashcardContent) {
        console.error(`No element found for mode: ${currentMode}`);
        return;
    }

    if (flashcards.length === 0) {
        flashcardContent.innerText = 'No flashcards available.';
        return;
    }

    const currentCard = flashcards[currentCardIndex];
    flashcardContent.innerText = currentCard.question;

    if (flashcardAnswer) {
        if (currentMode === 'truefalse') {
            const displayedAnswer = currentCard.displayedAnswer || 'True/False';
            flashcardAnswer.innerText = displayedAnswer;
        } else if (currentMode === 'learn') {
            flashcardAnswer.innerText = currentCard.answer;       
        }
    }
}

function toggleAnswer(mode) {
    const questionId = `${mode}-flashcard-content`;
    const answerId = `${mode}-flashcard-answer`;

    const questionElement = document.getElementById(questionId);
    const answerElement = document.getElementById(answerId);

    if (!questionElement || !answerElement) {
        console.error(`Elements not found for mode: ${mode}`);
        return;
    }

    if (answerElement.style.display === 'none' || answerElement.style.display === '') {
        answerElement.style.display = 'block';
        questionElement.style.display = 'none';
    } else {
        answerElement.style.display = 'none';
        questionElement.style.display = 'block';
    }
}

// 6. View management functions
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

// 7. Mode and content loading functions
function loadMode(mode) {
    currentMode = mode;

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
            
            if (modeContainer.querySelector('[data-deck-select]')) {
                loadDecks();
            }
        })
        .catch(error => {
            console.error('Error loading the mode:', error);
        });
}

// 8. Event listeners and initialization
function setupModeEventListeners() {
    const modeContainer = document.getElementById('mode-container');
    
    if (!modeContainer) return;

    modeContainer.addEventListener('click', (event) => {
        const target = event.target;

        if (target.matches('[data-action]')) {
            const action = target.dataset.action;

            switch (action) {
                case 'toggle-answer-learn':
                    toggleAnswer('learn');
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
                    const trueCard = flashcards[currentCardIndex];
                    if (checkAnswer(trueCard, 'true')) {
                        alert('Correct!');
                        currentCardIndex = (currentCardIndex + 1) % flashcards.length;
                    } else {
                        alert(`Incorrect! The correct answer was: ${trueCard.correctAnswer}.`);
                    }
                    displayCard();
                    break;
                
                case 'false':
                    const falseCard = flashcards[currentCardIndex];
                    if (checkAnswer(falseCard, 'false')) {
                        alert('Correct!');
                        currentCardIndex = (currentCardIndex + 1) % flashcards.length;
                    } else {
                        alert(`Incorrect! The correct answer was: ${falseCard.correctAnswer}.`);
                    }
                    displayCard();
                    break;
            }
        }
    });

    modeContainer.addEventListener('change', (event) => {
        const target = event.target;

        if (target.matches('[data-deck-select]')) {
            const mode = target.dataset.deckSelect;
            const deckId = target.value;

            if (!deckId) {
                alert('Please select a valid deck.');
                return;
            }

            fetchFlashcards(deckId, mode === 'truefalse' || mode === 'matching');
        }  
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupModeEventListeners();
});