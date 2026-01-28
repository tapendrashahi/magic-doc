from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Note, ConversionHistory
from .serializers import NoteSerializer, UserSerializer, ConversionHistorySerializer
from converter.converter import convert_latex_to_html
import time


class NotePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing notes
    - List, create, update, delete notes
    - Convert LaTeX to HTML
    - Favorite/unfavorite notes
    - Search notes
    """
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotePagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'latex_content']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-updated_at']

    def get_queryset(self):
        """Return notes for the current user only"""
        queryset = Note.objects.filter(user=self.request.user)
        
        # Filter by favorite if requested
        is_favorite = self.request.query_params.get('is_favorite')
        if is_favorite is not None:
            queryset = queryset.filter(is_favorite=is_favorite.lower() == 'true')
        
        return queryset

    def perform_create(self, serializer):
        """Save note with current user"""
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Update note and maintain user"""
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def convert(self, request):
        """
        Convert LaTeX to HTML (Real-time conversion)
        POST /api/notes/convert/
        {
            "latex_content": "\\section*{Hello}\n$(a+b)^2$"
        }
        Returns:
        {
            "html_content": "<h2>Hello</h2><p>\\((a+b)^2\\)</p>",
            "conversion_time_ms": 12,
            "error": null (if any)
        }
        """
        latex_content = request.data.get('latex_content', '')
        
        if not latex_content or not latex_content.strip():
            return Response({
                'html_content': '',
                'conversion_time_ms': 0,
                'error': None
            })
        
        try:
            start_time = time.time()
            html_content = convert_latex_to_html(latex_content)
            conversion_time = int((time.time() - start_time) * 1000)
            
            # Save to history (async in production with Celery)
            try:
                ConversionHistory.objects.create(
                    user=request.user,
                    input_latex=latex_content[:1000],  # Limit stored length
                    output_html=html_content[:2000],
                    conversion_time_ms=conversion_time
                )
            except Exception as history_error:
                # Don't fail the conversion if history save fails
                print(f"Failed to save conversion history: {history_error}")
            
            return Response({
                'html_content': html_content,
                'conversion_time_ms': conversion_time,
                'error': None
            })
        except Exception as e:
            return Response({
                'html_content': '',
                'conversion_time_ms': 0,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def toggle_favorite(self, request, pk=None):
        """
        Toggle note favorite status
        POST /api/notes/{id}/toggle_favorite/
        """
        try:
            note = self.get_object()
            note.is_favorite = not note.is_favorite
            note.save()
            serializer = self.get_serializer(note)
            return Response(serializer.data)
        except Note.DoesNotExist:
            return Response(
                {'error': 'Note not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """
        Get favorite notes
        GET /api/notes/favorites/
        """
        favorites = self.get_queryset().filter(is_favorite=True)
        page = self.paginate_queryset(favorites)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(favorites, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent notes
        GET /api/notes/recent/?limit=10
        """
        limit = int(request.query_params.get('limit', 10))
        recent_notes = self.get_queryset()[:limit]
        serializer = self.get_serializer(recent_notes, many=True)
        return Response(serializer.data)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for user information
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user information"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class ConversionHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for conversion history
    """
    serializer_class = ConversionHistorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotePagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

    def get_queryset(self):
        """Return conversion history for current user"""
        return ConversionHistory.objects.filter(user=self.request.user)
