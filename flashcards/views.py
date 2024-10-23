from django.shortcuts import render, redirect, get_object_or_404
from .models import Deck, Flashcard
import random


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