from django.urls  import path
from .views import dashboard, create_deck

urlpatterns = [
    path('', dashboard, name='dashboard'),
    path('create_deck/', create_deck, name='create_deck'),
]