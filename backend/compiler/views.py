"""
API Views for compiler functionality
Main endpoints for LaTeX conversion to TipTap HTML format
"""
import time
import logging
import os
import uuid
import tempfile
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.files.storage import default_storage
from django.utils import timezone
from django.http import FileResponse

from converter.converter import convert_mathpix_to_lms_html, convert_mathpix_to_lms_html_with_stats
from .serializers import (
    ConvertTexRequestSerializer,
    ExportRequestSerializer,
    ConversionHistorySerializer
)
from .models import ConversionHistory, ExportedFile
from .export_handler import export_html, EXPORT_HANDLERS

logger = logging.getLogger(__name__)

# Configure temporary directory for exports
EXPORT_TEMP_DIR = tempfile.gettempdir()


@api_view(['POST'])
@permission_classes([AllowAny])  # Change to IsAuthenticated in production
def convert_tex_view(request):
    """
    Convert single .tex file to TipTap-compatible HTML
    
    Request:
        POST /api/compiler/convert-tex/
        {
            "filename": "test.tex",
            "content": "\\section{Hello}\\n$E=mc^2$"
        }
    
    Response:
        {
            "success": true,
            "html": "<h2>Hello</h2><p><span class=\"tiptap-katex\" data-latex=\"E%3Dmc%5E2\">...</span></p>",
            "stats": {
                "input_chars": 42,
                "output_chars": 156,
                "conversion_time_ms": 45,
                "math_equations": 1
            },
            "conversion_id": "conv_12345"
        }
    """
    serializer = ConvertTexRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        start_time = time.time()
        filename = serializer.validated_data['filename']
        content = serializer.validated_data['content']
        
        # Use existing converter with stats
        result = convert_mathpix_to_lms_html_with_stats(content)
        html_output = result.get('html_fragment', '')
        stats = result.get('stats', {})
        conversion_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Save to history (optional)
        conversion = None
        try:
            conversion = ConversionHistory.objects.create(
                filename=filename,
                input_size=len(content),
                output_size=len(html_output),
                conversion_time=conversion_time / 1000,  # Convert to seconds
                status='success'
            )
        except Exception as e:
            logger.warning(f"Failed to save conversion history: {e}")
        
        return Response({
            "success": True,
            "html": html_output,
            "stats": {
                "input_chars": len(content),
                "output_chars": len(html_output),
                "conversion_time_ms": round(conversion_time, 2),
                **stats
            },
            "conversion_id": conversion.id if conversion else None
        })
        
    except Exception as e:
        logger.error(f"Conversion error: {e}", exc_info=True)
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def convert_batch_view(request):
    """
    Convert multiple .tex files to TipTap HTML
    
    Request:
        POST /api/compiler/convert-batch/
        {
            "files": [
                {"filename": "test1.tex", "content": "..."},
                {"filename": "test2.tex", "content": "..."}
            ]
        }
    
    Response:
        {
            "success": true,
            "results": [
                {"filename": "test1.tex", "html": "...", "status": "success"},
                {"filename": "test2.tex", "html": "...", "status": "success"}
            ],
            "total_files": 2,
            "successful": 2,
            "failed": 0
        }
    """
    try:
        files = request.data.get('files', [])
        
        if not isinstance(files, list) or len(files) == 0:
            return Response(
                {"success": False, "error": "files must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        results = []
        successful = 0
        failed = 0
        
        for file_data in files:
            try:
                filename = file_data.get('filename', 'unknown.tex')
                content = file_data.get('content', '')
                
                if not filename.endswith('.tex'):
                    results.append({
                        "filename": filename,
                        "status": "error",
                        "error": "File must have .tex extension"
                    })
                    failed += 1
                    continue
                
                result = convert_mathpix_to_lms_html_with_stats(content)
                html_output = result.get('html_fragment', '')
                stats = result.get('stats', {})
                
                results.append({
                    "filename": filename,
                    "html": html_output,
                    "status": "success",
                    "stats": stats
                })
                successful += 1
                
            except Exception as e:
                logger.warning(f"Batch conversion error for {filename}: {e}")
                results.append({
                    "filename": file_data.get('filename', 'unknown'),
                    "status": "error",
                    "error": str(e)
                })
                failed += 1
        
        return Response({
            "success": True,
            "results": results,
            "total_files": len(files),
            "successful": successful,
            "failed": failed
        })
        
    except Exception as e:
        logger.error(f"Batch conversion error: {e}", exc_info=True)
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def export_view(request):
    """
    Export compiled HTML to various formats (PDF, Markdown, JSON, CSV, DOCX)
    
    Request:
        POST /api/compiler/export/
        {
            "html_content": "<h2>Hello</h2>...",
            "export_format": "pdf",
            "filename": "output"
        }
    
    Response (Success):
        {
            "success": true,
            "file_id": "exp_550e8400e29b41d4a716446655440000",
            "download_url": "/api/compiler/download/exp_550e8400e29b41d4a716446655440000/",
            "file_size": 15234,
            "format": "pdf"
        }
    
    Response (Error):
        {
            "success": false,
            "error": "Unsupported export format: xyz. Supported: pdf, md, json, csv, docx"
        }
    """
    serializer = ExportRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        html_content = serializer.validated_data['html_content']
        export_format = serializer.validated_data['export_format'].lower()
        filename = serializer.validated_data.get('filename', 'output')
        
        # Validate format
        if export_format not in EXPORT_HANDLERS:
            return Response({
                "success": False,
                "error": f"Unsupported export format: {export_format}. Supported: {', '.join(EXPORT_HANDLERS.keys())}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate HTML content
        if not html_content or len(html_content) == 0:
            return Response({
                "success": False,
                "error": "HTML content is empty"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Starting export: format={export_format}, filename={filename}, size={len(html_content)}")
        
        # Export to desired format
        try:
            content, content_type, file_ext = export_html(html_content, export_format, filename)
        except ImportError as e:
            logger.error(f"Missing dependency for {export_format}: {e}")
            return Response({
                "success": False,
                "error": f"Export format '{export_format}' requires additional dependencies: {str(e)}"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError as e:
            logger.error(f"Invalid export format: {e}")
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate unique file ID
        file_id = f"exp_{uuid.uuid4().hex}"
        output_filename = f"{filename}.{file_ext}"
        
        # Determine file size
        if isinstance(content, bytes):
            file_size = len(content)
            file_path = os.path.join(EXPORT_TEMP_DIR, f"{file_id}.{file_ext}")
            with open(file_path, 'wb') as f:
                f.write(content)
        else:
            file_size = len(content.encode('utf-8'))
            file_path = os.path.join(EXPORT_TEMP_DIR, f"{file_id}.{file_ext}")
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
        
        # Save export record (optional)
        try:
            expires_at = timezone.now() + timedelta(hours=24)
            export_record = ExportedFile.objects.create(
                filename=output_filename,
                file_format=file_ext,
                file_path=file_path,
                file_size=file_size,
                expires_at=expires_at
            )
            logger.info(f"Export saved: id={export_record.id}, size={file_size} bytes")
        except Exception as e:
            logger.warning(f"Failed to save export record: {e}")
        
        return Response({
            "success": True,
            "file_id": file_id,
            "filename": output_filename,
            "download_url": f"/api/compiler/download/{file_id}/",
            "file_size": file_size,
            "format": file_ext,
            "content_type": content_type
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Export error: {e}", exc_info=True)
        return Response(
            {"success": False, "error": f"Export failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def download_view(request, file_id):
    """
    Download exported file
    
    Request:
        GET /api/compiler/download/<file_id>/
        
    Example:
        GET /api/compiler/download/exp_550e8400e29b41d4a716446655440000/
    
    Response:
        File bytes with appropriate content-type and attachment headers
    """
    try:
        # Find file in temporary directory
        temp_dir = EXPORT_TEMP_DIR
        
        # Search for file with given ID
        matching_files = []
        for filename in os.listdir(temp_dir):
            if filename.startswith(file_id):
                matching_files.append(filename)
        
        if not matching_files:
            logger.warning(f"Downloaded file not found: {file_id}")
            return Response(
                {"success": False, "error": "File not found or has expired"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Use first matching file
        filename = matching_files[0]
        file_path = os.path.join(temp_dir, filename)
        
        if not os.path.exists(file_path):
            logger.warning(f"File path does not exist: {file_path}")
            return Response(
                {"success": False, "error": "File not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get file extension for content type
        ext = os.path.splitext(filename)[1].lower().lstrip('.')
        
        # Map extension to content type
        content_types = {
            'pdf': 'application/pdf',
            'md': 'text/markdown',
            'json': 'application/json',
            'csv': 'text/csv',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'txt': 'text/plain'
        }
        
        content_type = content_types.get(ext, 'application/octet-stream')
        
        # Determine original filename from database or file ID
        original_filename = f"export_{uuid.uuid4().hex[:8]}.{ext}"
        try:
            export_record = ExportedFile.objects.filter(file_path=file_path).first()
            if export_record:
                original_filename = export_record.filename
        except Exception as e:
            logger.warning(f"Could not retrieve export record: {e}")
        
        logger.info(f"Downloading file: {file_path} ({content_type})")
        
        # Stream file
        response = FileResponse(
            open(file_path, 'rb'),
            content_type=content_type,
            status=status.HTTP_200_OK
        )
        response['Content-Disposition'] = f'attachment; filename="{original_filename}"'
        response['Content-Length'] = os.path.getsize(file_path)
        
        return response
        
    except Exception as e:
        logger.error(f"Download error: {e}", exc_info=True)
        return Response(
            {"success": False, "error": f"Download failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def stats_view(request, conversion_id):
    """
    Get conversion statistics
    
    Request:
        GET /api/compiler/stats/<conversion_id>/
    
    Response:
        {
            "conversion_id": "conv_12345",
            "filename": "test.tex",
            "status": "success",
            "conversion_time": 0.045,
            "input_size": 156,
            "output_size": 542,
            "created_at": "2026-01-30T10:30:45Z"
        }
    """
    try:
        conversion = ConversionHistory.objects.get(id=conversion_id)
        serializer = ConversionHistorySerializer(conversion)
        return Response({"success": True, "data": serializer.data})
    except ConversionHistory.DoesNotExist:
        return Response(
            {"success": False, "error": "Conversion not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Stats error: {e}", exc_info=True)
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
