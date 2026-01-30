"""
URL routing for compiler API
"""
from django.urls import path
from . import views

app_name = 'compiler'

urlpatterns = [
    # Convert endpoints
    path('convert-tex/', views.convert_tex_view, name='convert-tex'),
    path('convert-batch/', views.convert_batch_view, name='convert-batch'),
    
    # Export endpoints
    path('export/', views.export_view, name='export'),
    path('download/<str:file_id>/', views.download_view, name='download'),
    
    # Stats endpoint
    path('stats/<int:conversion_id>/', views.stats_view, name='stats'),
]
