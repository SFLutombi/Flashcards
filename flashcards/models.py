from django.db import models
from django.utils import timezone
import math
import random

class Deck(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Flashcard(models.Model):
    question = models.TextField()
    answer = models.TextField()
    deck = models.ForeignKey('Deck', on_delete=models.CASCADE)
    
    # Spaced repetition fields
    ease_factor = models.FloatField(default=2.5)
    interval = models.IntegerField(default=0)
    due_date = models.DateTimeField(default=timezone.now)
    repetitions = models.IntegerField(default=0)
    last_review = models.DateTimeField(null=True, blank=True)



