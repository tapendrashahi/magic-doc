from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Note, ConversionHistory
from .serializers import NoteSerializer, UserSerializer, ConversionHistorySerializer
from converter.converter import convert_latex_to_html, convert_mathpix_to_lms_html, convert_mathpix_to_lms_html_with_stats
import time
import logging

logger = logging.getLogger(__name__)


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
            "latex_content": "\\section*{Hello}\n$(a+b)^2$",
            "format": "katex" or "plain_html"  (optional, defaults to "katex")
        }
        Returns:
        {
            "html_content": "<h2>Hello</h2><p>...</p>",
            "conversion_time_ms": 12,
            "error": null (if any),
            "format": "katex" or "plain_html"
        }
        """
        latex_content = request.data.get('latex_content', '')
        format_type = request.data.get('format', 'katex')  # Default to katex for backward compatibility
        
        # Validate format
        if format_type not in ['katex', 'plain_html']:
            format_type = 'katex'
        
        if not latex_content or not latex_content.strip():
            return Response({
                'html_content': '',
                'conversion_time_ms': 0,
                'error': None,
                'format': format_type
            })
        
        try:
            start_time = time.time()
            html_content = convert_latex_to_html(latex_content, mode=format_type)
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
                'error': None,
                'format': format_type
            })
        except Exception as e:
            return Response({
                'html_content': '',
                'conversion_time_ms': 0,
                'error': str(e),
                'format': format_type
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


# ============================================================================
# PHASE 6: API INTEGRATION - New endpoint for Mathpix to LMS conversion
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def convert_mathpix(request):
    r"""
    Convert Mathpix LaTeX output to LMS-compatible HTML fragment.
    
    This endpoint integrates Phase 5 orchestrator into the API.
    
    POST /api/convert/
    
    Request Body:
    {
        "mathpix_text": "Raw Mathpix LaTeX text with equations and sections",
        "include_stats": false  (optional, defaults to false)
    }
    
    Response (Success):
    {
        "success": true,
        "html_fragment": "<div>...</div><span class=\"__se__katex\">...</span>...",
        "stats": {
            "original_text_length": 11782,
            "total_equations": 168,
            "display_equations": 32,
            "inline_equations": 136,
            "total_sections": 23,
            "html_fragment_length": 415084,
            "size_increase_percent": 3423.04,
            "has_katex_equations": true,
            "has_sections": true
        },
        "conversion_time_ms": 2500
    }
    
    Response (Error):
    {
        "success": false,
        "error": "Error message describing what went wrong",
        "html_fragment": "",
        "conversion_time_ms": 50
    }
    """
    logger.info("Received /api/convert/ request")
    
    # Get parameters
    mathpix_text = request.data.get('mathpix_text', '')
    include_stats = request.data.get('include_stats', False)
    
    # Validate input
    if not mathpix_text or not mathpix_text.strip():
        logger.warning("Empty mathpix_text in request")
        return Response({
            'success': False,
            'error': 'mathpix_text is required and cannot be empty',
            'html_fragment': '',
            'conversion_time_ms': 0
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        start_time = time.time()
        
        # Convert
        if include_stats:
            # Use the version that returns statistics
            result = convert_mathpix_to_lms_html_with_stats(mathpix_text)
            conversion_time = int((time.time() - start_time) * 1000)
            
            if result['success']:
                logger.info(f"Conversion successful: {result['stats']['total_equations']} equations, "
                           f"{result['stats']['total_sections']} sections, "
                           f"{conversion_time}ms")
                return Response({
                    'success': True,
                    'html_fragment': result['html_fragment'],
                    'stats': result['stats'],
                    'conversion_time_ms': conversion_time
                })
            else:
                logger.error(f"Conversion failed: {result.get('error')}")
                return Response({
                    'success': False,
                    'error': result.get('error', 'Conversion failed'),
                    'html_fragment': '',
                    'conversion_time_ms': conversion_time
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Use the simple version
            html_fragment = convert_mathpix_to_lms_html(mathpix_text)
            conversion_time = int((time.time() - start_time) * 1000)
            
            logger.info(f"Conversion successful: {len(html_fragment)} chars, {conversion_time}ms")
            return Response({
                'success': True,
                'html_fragment': html_fragment,
                'stats': None,
                'conversion_time_ms': conversion_time
            })
    
    except Exception as e:
        conversion_time = int((time.time() - start_time) * 1000)
        error_msg = str(e)
        logger.error(f"Conversion error: {error_msg}", exc_info=True)
        
        return Response({
            'success': False,
            'error': f'Conversion failed: {error_msg}',
            'html_fragment': '',
            'conversion_time_ms': conversion_time
        }, status=status.HTTP_400_BAD_REQUEST)
