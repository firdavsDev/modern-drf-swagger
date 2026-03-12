from django.contrib.auth import get_user_model
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer, UserSerializer

User = get_user_model()


class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing tasks.

    Supports CRUD operations and custom actions for testing API Portal.
    """

    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "due_date", "status"]

    def get_queryset(self):
        """Filter tasks by current user if authenticated, otherwise return all"""
        if self.request.user and self.request.user.is_authenticated:
            return Task.objects.filter(created_by=self.request.user)
        # For anonymous users, return all tasks (read-only due to permission class)
        return Task.objects.all()

    @action(detail=False, methods=["get"])
    def my_tasks(self, request):
        """Get all tasks for the current user"""
        tasks = self.get_queryset()
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def todo(self, request):
        """Get all TODO tasks"""
        tasks = self.get_queryset().filter(status="todo")
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Mark a task as complete"""
        task = self.get_object()
        task.status = "done"
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing users (read-only).

    For testing API Portal with read-only endpoints.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "email", "first_name", "last_name"]

    @action(detail=False, methods=["get"])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
