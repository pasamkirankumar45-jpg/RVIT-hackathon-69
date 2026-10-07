import uuid
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .sandbox import run_sandboxed_code

class ExecuteCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code', '')
        timeout = int(request.data.get('timeout', 5))

        if not code:
            return Response({'error': 'Code field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Run via isolated sandbox
        result = run_sandboxed_code(code, timeout_sec=timeout)
        result['id'] = str(uuid.uuid4())
        return Response(result)
