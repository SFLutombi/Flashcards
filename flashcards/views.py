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
        form_type = request.POST.get('form_type')

        # Handle deck creation
        if form_type == 'create_deck':
            deck_name = request.POST.get('deck_name')
            description = request.POST.get('deck_description')
            new_deck = Deck.objects.create(name=deck_name, description=description)
            # Redirect or refresh the page to see the new deck
            return redirect('dashboard')

        # Handle deck selection
        elif form_type == 'select_deck':
            selected_deck_id = request.POST.get('selected_deck')
            selected_deck = Deck.objects.get(id=selected_deck_id)
            flashcards = Flashcard.objects.filter(deck=selected_deck)

        # Handle deck editing
        elif form_type == 'edit_deck':
            selected_deck_id = request.POST.get('selected_deck')
            selected_deck = Deck.objects.get(id=selected_deck_id)
            selected_deck.name = request.POST.get('deck_name')
            selected_deck.description = request.POST.get('deck_description')
            selected_deck.save()

            # Update flashcards
            for flashcard in Flashcard.objects.filter(deck=selected_deck):
                flashcard.question = request.POST.get(f'question_{flashcard.id}')
                flashcard.answer = request.POST.get(f'answer_{flashcard.id}')
                flashcard.save()

            flashcards = Flashcard.objects.filter(deck=selected_deck)  # Refresh list

        # Handle adding new flashcards
        elif form_type == 'add_flashcard':
            selected_deck_id = request.POST.get('selected_deck')
            selected_deck = Deck.objects.get(id=selected_deck_id)
            question = request.POST.get('question')
            answer = request.POST.get('answer')

            # Create new flashcard
            Flashcard.objects.create(deck=selected_deck, question=question, answer=answer)
            flashcards = Flashcard.objects.filter(deck=selected_deck)  # Refresh list

    return render(request, 'flashcards/dashboard.html', {
        'decks': decks,
        'selected_deck': selected_deck,
        'flashcards': flashcards,
    })


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

@csrf_exempt
def delete_flashcard(request, flashcard_id):
    if request.method == 'POST':
        try:
            flashcard = Flashcard.objects.get(id=flashcard_id)
            flashcard.delete()
            return JsonResponse({'success': True})
        except Flashcard.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Flashcard not found'})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@csrf_exempt
def delete_deck(request, deck_id):
    if request.method == "POST":
        deck = get_object_or_404(Deck, id=deck_id)
        deck.delete()
        return JsonResponse({'success': True})  # Return JSON response
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)

@csrf_exempt  # Exempt from CSRF verification for testing
def edit_flashcard(request, flashcard_id):
    try:
        flashcard = Flashcard.objects.get(id=flashcard_id)
        flashcard.question = request.POST.get(f'question_{flashcard_id}')
        flashcard.answer = request.POST.get(f'answer_{flashcard_id}')
        flashcard.save()

        return JsonResponse({
            'status': 'success',
            'question': flashcard.question,
            'answer': flashcard.answer
        })
    except Flashcard.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Flashcard not found'}, status=404)