from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoteViewSet, UserViewSet, ConversionHistoryViewSet

router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'users', UserViewSet, basename='user')
router.register(r'history', ConversionHistoryViewSet, basename='history')

urlpatterns = [
    path('', include(router.urls)),
]
