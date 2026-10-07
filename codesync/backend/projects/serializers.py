from rest_framework import serializers
from .models import Project, ProjectMember, ProjectFolder, ProjectFile, DocumentVersion
from accounts.serializers import UserSerializer

class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ProjectMember
        fields = ('id', 'project', 'user', 'user_id', 'role', 'joined_at')
        read_only_fields = ('id', 'joined_at')

class ProjectFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFile
        fields = ('id', 'project', 'folder', 'name', 'path', 'content', 'version', 'language', 'updated_at', 'created_at')
        read_only_fields = ('id', 'updated_at', 'created_at')

class ProjectFolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectFolder
        fields = ('id', 'project', 'name', 'parent', 'created_at')

class DocumentVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentVersion
        fields = ('id', 'file', 'version', 'content', 'author', 'comment', 'created_at')

class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'owner', 'e2e_encrypted', 'members_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')
