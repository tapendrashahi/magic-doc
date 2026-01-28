from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Note, ConversionHistory


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class NoteSerializer(serializers.ModelSerializer):
    """Serializer for Note model"""
    class Meta:
        model = Note
        fields = ['id', 'title', 'latex_content', 'html_content', 'mathpix_content', 'is_favorite', 'created_at', 'updated_at']


class ConversionHistorySerializer(serializers.ModelSerializer):
    """Serializer for ConversionHistory model"""
    class Meta:
        model = ConversionHistory
        fields = ['id', 'input_latex', 'output_html', 'conversion_time_ms', 'timestamp']
