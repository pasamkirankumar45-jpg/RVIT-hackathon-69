from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, FileViewSet

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')
router.register(r'files', FileViewSet, basename='file')

urlpatterns = [
    path('', include(router.urls)),
]
