from django.urls  import path
from .views import dashboard, create_deck, get_decks_api, get_flashcards_api, flashcard_response, review_flashcard, load_mode

urlpatterns = [
    path('', dashboard, name='dashboard'),
    path('create_deck/', create_deck, name='create_deck'),
    path('api/decks/', get_decks_api, name='get_decks_api'),
    path('api/flashcards/<int:deck_id>/', get_flashcards_api, name='get_flashcards_api'),
    path('flashcard/<int:flashcard_id>/response/', flashcard_response, name='flashcard_response'),
    path('flashcard/<int:flashcard_id>/review/', review_flashcard, name='review_flashcard'),
    path('mode/<str:mode_name>/', load_mode, name='load_mode'),
]