from django.db import models
from django.contrib.auth.models import User

class Note(models.Model):
    """Store LaTeX notes and their HTML conversions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=200, default='Untitled')
    latex_content = models.TextField(blank=True)
    html_content = models.TextField(blank=True)
    mathpix_content = models.TextField(blank=True)
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
        ]

    def __str__(self):
        return self.title


class ConversionHistory(models.Model):
    """Track conversion history for analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    input_latex = models.TextField()
    output_html = models.TextField()
    conversion_time_ms = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
        ]

    def __str__(self):
        return f"Conversion by {self.user} at {self.timestamp}"
