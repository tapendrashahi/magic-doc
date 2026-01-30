"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('api.urls')),
    path('api/compiler/', include('compiler.urls')),  # NEW: Compiler routes
    path('api-auth/', include('rest_framework.urls')),
]
