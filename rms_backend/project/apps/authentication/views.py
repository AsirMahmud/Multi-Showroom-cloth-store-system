from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import RegisterSerializer
from django.contrib.auth import get_user_model
from apps.branches.permissions import is_admin

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Admin-only endpoint to register new staff/manager accounts."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response(
                {'error': 'Only an administrator can create new accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)


class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'message': f'Hello, {request.user.username}! This is protected.'})
