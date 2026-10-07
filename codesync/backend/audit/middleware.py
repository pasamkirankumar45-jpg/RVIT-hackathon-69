from .models import AuditLog

class AuditLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Log state-modifying requests
        if request.method in ['POST', 'PUT', 'DELETE', 'PATCH'] and request.path.startswith('/api/'):
            user = request.user if request.user.is_authenticated else None
            username = user.username if user else 'anonymous'
            action = f"{request.method} {request.path}"
            status = 'SUCCESS' if response.status_code < 400 else 'WARNING' if response.status_code < 500 else 'REJECTED'

            try:
                AuditLog.objects.create(
                    user=user,
                    username=username,
                    action=action,
                    details=f"Status code {response.status_code}",
                    ip_address=request.META.get('REMOTE_ADDR'),
                    status=status
                )
            except Exception:
                pass

        return response
