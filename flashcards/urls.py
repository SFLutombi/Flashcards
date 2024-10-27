from django.urls  import path
from .views import dashboard, get_decks_api, get_flashcards_api, load_mode, delete_deck, delete_flashcard, edit_flashcard

urlpatterns = [
    path('', dashboard, name='dashboard'),
    path('api/decks/', get_decks_api, name='get_decks_api'),
    path('api/flashcards/<int:deck_id>/', get_flashcards_api, name='get_flashcards_api'),
    path('mode/<str:mode_name>/', load_mode, name='load_mode'),
    path('delete_deck/<int:deck_id>/', delete_deck, name='delete_deck'),
    path('delete-flashcard/<int:flashcard_id>/', delete_flashcard, name='delete_flashcard'),
    path('edit_flashcard/<int:flashcard_id>/', edit_flashcard, name='edit_flashcard'),
]