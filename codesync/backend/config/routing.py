from django.urls import re_path
from collaboration.consumers import CollaborationConsumer

websocket_urlpatterns = [
    re_path(
        r'^ws/projects/(?P<project_id>[^/]+)/files/(?P<file_id>[^/]+)/$',
        CollaborationConsumer.as_asgi(),
    ),
]
