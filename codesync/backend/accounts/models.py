import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    avatar_color = models.CharField(max_length=16, default='#10b981')
    public_key = models.TextField(blank=True, null=True, help_text="User's public key for E2EE key exchange")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    preferred_theme = models.CharField(max_length=32, default='vs-dark')
    key_fingerprint = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"
