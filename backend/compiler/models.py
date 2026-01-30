"""
Models for compiler app - Optional database models for conversion history and exports
"""
from django.db import models
from django.contrib.auth.models import User


class ConversionHistory(models.Model):
    """Store conversion history for audit trail and analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='compiler_conversions')
    filename = models.CharField(max_length=255)
    input_size = models.IntegerField()  # bytes
    output_size = models.IntegerField()  # bytes
    conversion_time = models.FloatField()  # seconds
    export_format = models.CharField(max_length=10, default='html')
    status = models.CharField(
        max_length=20,
        choices=[('success', 'Success'), ('error', 'Error'), ('partial', 'Partial')],
        default='success'
    )
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Conversion Histories"
    
    def __str__(self):
        return f"{self.filename} ({self.status}) - {self.created_at}"


class ExportedFile(models.Model):
    """Store exported files for download"""
    conversion = models.ForeignKey(ConversionHistory, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='compiler_exports')
    filename = models.CharField(max_length=255)
    file_format = models.CharField(max_length=10)  # pdf, md, json, csv, docx
    file_path = models.CharField(max_length=500)  # Path to stored file
    file_size = models.IntegerField()  # bytes
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # Auto-cleanup after expiry
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.filename} ({self.file_format})"
