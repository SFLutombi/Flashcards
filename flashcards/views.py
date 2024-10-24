from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.utils import timezone


from .models import Deck, Flashcard

import random, json


def dashboard(request):
    decks = Deck.objects.all()
    selected_deck = None
    flashcards = []

    if request.method == 'POST':
        if 'selected_deck' in request.POST:
            selected_deck_id = request.POST.get('selected_deck')
            selected_deck = Deck.objects.get(id=selected_deck_id)
            flashcards = Flashcard.objects.filter(deck=selected_deck)

        if 'deck_name' in request.POST and 'deck_description' in request.POST:
            selected_deck_id = request.POST.get('selected_deck')
            selected_deck = Deck.objects.get(id=selected_deck_id)
            selected_deck.name = request.POST.get('deck_name')
            selected_deck.description = request.POST.get('deck_description')
            selected_deck.save()

            for flashcard in flashcards:
                flashcard.question = request.POST.get(f'question_{flashcard.id}')
                flashcard.answer = request.POST.get(f'answer_{flashcard.id}')
                flashcard.save()

            flashcards = Flashcard.objects.filter(deck=selected_deck)  # Refresh flashcards list

        if 'question' in request.POST and 'answer' in request.POST:
            question = request.POST.get('question')
            answer = request.POST.get('answer')
            if selected_deck:
                Flashcard.objects.create(deck=selected_deck, question=question, answer=answer)
                flashcards = Flashcard.objects.filter(deck=selected_deck)  # Refresh flashcards list

    return render(request, 'flashcards/dashboard.html', {
        'decks': decks,
        'selected_deck': selected_deck,
        'flashcards': flashcards
    })

def create_deck(request):
    if request.method == 'POST':
        deck_name = request.POST.get('deck_name')
        description = request.POST.get('deck_description')
        Deck.objects.create(name=deck_name, description=description)
        return redirect('dashboard')

    return render(request, 'flashcards/create_deck.html')

#Apis
def get_flashcards_api(request, deck_id):
    # Query the flashcards for the selected deck
    flashcards = list(Flashcard.objects.filter(deck_id=deck_id).values('id', 'question', 'answer'))

    # Check if the 'shuffle' query parameter is set to true
    if request.GET.get('shuffle') == 'true':
        random.shuffle(flashcards)

    return JsonResponse(flashcards, safe=False)

def get_decks_api(request):
    # Query all decks
    decks = Deck.objects.all().values('id', 'name', 'description')
    return JsonResponse(list(decks), safe=False)

def load_mode(request, mode_name):
    template_name = f"flashcards/{mode_name}.html"  # Ensure correct template path
    return render(request, template_name)

#Handle Submissions
@csrf_exempt
def flashcard_response(request, flashcard_id):
    flashcard = get_object_or_404(Flashcard, id=flashcard_id)

    if request.method == "POST":
        try:
            # Get the user's answer from the request body
            data = json.loads(request.body)
            user_answer = data.get('user_answer', '').strip().lower()  # Clean the input

            # Compare the user answer with the correct answer
            correct_answer = flashcard.answer.strip().lower()
            is_correct = (user_answer == correct_answer)

            if is_correct:
                # Update the flashcard for correct answers
                flashcard.quality_score += 1
                flashcard.streak += 1
                flashcard.review_required = False  # No review needed
                flashcard.save()
                return JsonResponse({'review_required': False}, status=200)

            else:
                # Update for incorrect answers
                flashcard.quality_score = 0  # Reset score
                flashcard.streak = 0  # Reset streak
                flashcard.review_required = True  # Mark for review
                flashcard.save()

                # Only send review prompt if the answer is incorrect
                return JsonResponse({'review_required': True}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

#Review Flashcard
@csrf_exempt
def review_flashcard(request, flashcard_id):
    flashcard = get_object_or_404(Flashcard, id=flashcard_id)

    if request.method == "POST":
        data = json.loads(request.body)
        user_answer = data.get('user_answer', '').strip().lower()
        difficulty = int(data.get('difficulty', 3))  # Default to 3 if not provided

        # Update quality score based on correctness and difficulty
        if user_answer:
            flashcard.quality_score += (5 - difficulty)  # Higher difficulty = smaller increase
            flashcard.review_required = False  # No more review needed
        else:
            flashcard.quality_score -= difficulty  # Decrease quality for incorrect answers

        flashcard.difficulty_rating = difficulty  # Store difficulty for analytics
        flashcard.save()

        # Send a JSON response back to the front-end
        return JsonResponse({'review_complete': True, 'is_correct': user_answer})

    return JsonResponse({'error': 'Invalid request method'}, status=405)
