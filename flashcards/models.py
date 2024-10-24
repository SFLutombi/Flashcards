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
    
    # Quality
    quality_score = models.FloatField(default=0)
    response_time = models.FloatField(default=0)
    streak = models.IntegerField(default=0)
    review_required = models.BooleanField(default=False)
    difficulty_rating = models.IntegerField(default=0)  # Will store 1-5 rating
    



