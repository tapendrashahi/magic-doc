"""
Django admin configuration for compiler app
"""
from django.contrib import admin
from .models import ConversionHistory, ExportedFile


@admin.register(ConversionHistory)
class ConversionHistoryAdmin(admin.ModelAdmin):
    list_display = ('filename', 'status', 'conversion_time', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('filename',)
    readonly_fields = ('created_at',)


@admin.register(ExportedFile)
class ExportedFileAdmin(admin.ModelAdmin):
    list_display = ('filename', 'file_format', 'file_size', 'created_at')
    list_filter = ('file_format', 'created_at')
    search_fields = ('filename',)
    readonly_fields = ('created_at',)
