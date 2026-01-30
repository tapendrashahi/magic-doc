"""
Serializers for compiler API endpoints
"""
from rest_framework import serializers
from .models import ConversionHistory, ExportedFile


class ConversionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversionHistory
        fields = [
            'id', 'filename', 'input_size', 'output_size',
            'conversion_time', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ExportedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportedFile
        fields = [
            'id', 'filename', 'file_format', 'file_size', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ConvertTexRequestSerializer(serializers.Serializer):
    """Serializer for convert-tex endpoint"""
    filename = serializers.CharField(max_length=255)
    content = serializers.CharField()
    
    def validate_filename(self, value):
        if not value.endswith('.tex'):
            raise serializers.ValidationError("File must have .tex extension")
        return value


class ExportRequestSerializer(serializers.Serializer):
    """Serializer for export endpoint"""
    html_content = serializers.CharField()
    export_format = serializers.ChoiceField(
        choices=['pdf', 'md', 'json', 'csv', 'docx']
    )
    filename = serializers.CharField(max_length=255, required=False)
