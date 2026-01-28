from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoteViewSet, UserViewSet, ConversionHistoryViewSet, convert_mathpix

router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'users', UserViewSet, basename='user')
router.register(r'history', ConversionHistoryViewSet, basename='history')

urlpatterns = [
    path('', include(router.urls)),
    # Phase 6: New Mathpix to LMS conversion endpoint
    path('convert/', convert_mathpix, name='convert_mathpix'),
]
