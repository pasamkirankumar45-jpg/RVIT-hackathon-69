import uuid
from django.db import models
from django.conf import settings

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_projects')
    e2e_encrypted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ProjectRole(models.TextChoices):
    OWNER = 'OWNER', 'Owner'
    ADMIN = 'ADMIN', 'Admin'
    EDITOR = 'EDITOR', 'Editor'
    VIEWER = 'VIEWER', 'Viewer'

class ProjectMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_memberships')
    role = models.CharField(max_length=16, choices=ProjectRole.choices, default=ProjectRole.EDITOR)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')

class ProjectFolder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='folders')
    name = models.CharField(max_length=255)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subfolders')
    created_at = models.DateTimeField(auto_now_add=True)

class ProjectFile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='files')
    folder = models.ForeignKey(ProjectFolder, on_delete=models.CASCADE, null=True, blank=True, related_name='files')
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=1024, default='/')
    content = models.TextField(blank=True, default='')
    version = models.PositiveIntegerField(default=1)
    language = models.CharField(max_length=64, default='python')
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

class DocumentVersion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(ProjectFile, on_delete=models.CASCADE, related_name='versions')
    version = models.PositiveIntegerField()
    content = models.TextField()
    author = models.CharField(max_length=128)
    comment = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
