from django.urls import path
from .views import ExecuteCodeView

urlpatterns = [
    path('run/', ExecuteCodeView.as_view(), name='execute_code'),
]
