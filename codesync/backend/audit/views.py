from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .models import AuditLog

class AuditLogListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        logs = AuditLog.objects.all()[:100]
        data = [
            {
                'id': str(log.id),
                'timestamp': log.timestamp.isoformat(),
                'username': log.username,
                'action': log.action,
                'details': log.details,
                'ipAddress': log.ip_address,
                'status': log.status,
            }
            for log in logs
        ]
        return Response(data)
