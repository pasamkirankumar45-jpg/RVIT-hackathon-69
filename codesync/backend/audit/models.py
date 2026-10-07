import uuid
from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    username = models.CharField(max_length=150, default='anonymous')
    action = models.CharField(max_length=64)
    details = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    status = models.CharField(max_length=16, default='SUCCESS')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.action} by {self.username}"
