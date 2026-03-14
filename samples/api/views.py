from django.contrib.auth import get_user_model

from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema, inline_serializer
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.serializers import CharField, ChoiceField, DateTimeField, IntegerField
from rest_framework.views import APIView

from .models import Task
from .serializers import TaskSerializer, UserSerializer

User = get_user_model()


class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing tasks.

    Supports CRUD operations and custom actions for testing API Portal.
    """

    # parser_classes = [JSONParser]
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "due_date", "status"]

    def get_queryset(self):
        """Filter tasks by current user if authenticated, otherwise return all"""
        queryset = Task.objects.select_related("created_by").all()

        if self.request.user and self.request.user.is_authenticated:
            return queryset.filter(created_by=self.request.user)
        # For anonymous users, return all tasks (read-only due to permission class)
        return queryset

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


class TaskEnvelopeAPIView(APIView):
    """
    Example endpoint that documents request and response bodies without serializer_class.
    """

    permission_classes = [IsAuthenticatedOrReadOnly]

    @extend_schema(
        tags=["Schema examples"],
        request=inline_serializer(
            name="TaskEnvelopeRequest",
            fields={
                "status": ChoiceField(
                    choices=["todo", "in_progress", "done"],
                    required=False,
                ),
            },
        ),
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name="TaskEnvelopeSuccessResponse",
                    fields={
                        "status_code": IntegerField(),
                        "status": CharField(),
                        "message": CharField(),
                        "data": inline_serializer(
                            name="TaskEnvelopeItem",
                            many=True,
                            fields={
                                "id": IntegerField(),
                                "title": CharField(),
                                "status": CharField(),
                                "user": inline_serializer(
                                    name="TaskEnvelopeUser",
                                    fields={
                                        "id": IntegerField(),
                                        "first_name": CharField(allow_blank=True),
                                        "last_name": CharField(allow_blank=True),
                                        "created_at": DateTimeField(),
                                    },
                                ),
                            },
                        ),
                    },
                ),
                description="Success",
                examples=[
                    OpenApiExample(
                        "Success",
                        value={
                            "status_code": 200,
                            "status": "success",
                            "message": "Malumotlar fetch qilindi",
                            "data": [
                                {
                                    "id": 1,
                                    "title": "Write docs",
                                    "status": "todo",
                                    "user": {
                                        "id": 7,
                                        "first_name": "Ali",
                                        "last_name": "Valiyev",
                                        "created_at": "2026-03-14T10:30:00Z",
                                    },
                                }
                            ],
                        },
                        response_only=True,
                    )
                ],
            ),
            500: OpenApiResponse(
                response=inline_serializer(
                    name="TaskEnvelopeErrorResponse",
                    fields={
                        "status_code": IntegerField(),
                        "status": CharField(),
                        "message": CharField(),
                        "data": CharField(),
                    },
                ),
                description="Server Error",
                examples=[
                    OpenApiExample(
                        "ServerError",
                        value={
                            "status_code": 500,
                            "status": "error",
                            "message": "Xatolik yuz berdi",
                            "data": "Internal server error",
                        },
                        response_only=True,
                    )
                ],
            ),
        },
    )
    def post(self, request):
        status_filter = request.data.get("status")

        tasks = Task.objects.select_related("created_by").all()
        if status_filter:
            tasks = tasks.filter(status=status_filter)

        payload = [
            {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "user": {
                    "id": task.created_by_id,
                    "first_name": task.created_by.first_name,
                    "last_name": task.created_by.last_name,
                    "created_at": task.created_by.date_joined,
                },
            }
            for task in tasks
        ]

        return Response(
            {
                "status_code": 200,
                "status": "success",
                "message": "Malumotlar fetch qilindi",
                "data": payload,
            }
        )
