from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project, ProjectMember, ProjectFile, ProjectFolder, DocumentVersion
from .serializers import (
    ProjectSerializer,
    ProjectMemberSerializer,
    ProjectFileSerializer,
    ProjectFolderSerializer,
    DocumentVersionSerializer,
)

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(members__user=user).distinct()

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        # Add owner as member with OWNER role
        ProjectMember.objects.create(project=project, user=self.request.user, role='OWNER')
        # Create starter main.py
        ProjectFile.objects.create(
            project=project,
            name='main.py',
            path='/main.py',
            content='# Welcome to CodeSync\nprint("Hello World!")\n',
            version=1,
            language='python'
        )

    @action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, pk=None):
        project = self.get_object()
        if request.method == 'GET':
            members = project.members.all()
            return Response(ProjectMemberSerializer(members, many=True).data)
        elif request.method == 'POST':
            serializer = ProjectMemberSerializer(data={**request.data, 'project': project.id})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], url_path='files')
    def files(self, request, pk=None):
        project = self.get_object()
        if request.method == 'GET':
            files = project.files.all()
            return Response(ProjectFileSerializer(files, many=True).data)
        elif request.method == 'POST':
            serializer = ProjectFileSerializer(data={**request.data, 'project': project.id})
            serializer.is_valid(raise_exception=True)
            file_obj = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class FileViewSet(viewsets.ModelViewSet):
    queryset = ProjectFile.objects.all()
    serializer_class = ProjectFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        file_obj = self.get_object()
        versions = file_obj.versions.all().order_by('-created_at')
        return Response(DocumentVersionSerializer(versions, many=True).data)

    @action(detail=True, methods=['post'], url_path='history/restore')
    def restore(self, request, pk=None):
        file_obj = self.get_object()
        version_id = request.data.get('version_id')
        version_obj = file_obj.versions.filter(id=version_id).first()
        if not version_obj:
            return Response({'error': 'Version not found'}, status=status.HTTP_404_NOT_FOUND)
        
        file_obj.content = version_obj.content
        file_obj.version += 1
        file_obj.save()
        return Response(ProjectFileSerializer(file_obj).data)
