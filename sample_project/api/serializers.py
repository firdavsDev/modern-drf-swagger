from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Task

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User serializer for testing API Portal"""

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "date_joined"]
        read_only_fields = ["id", "date_joined"]


class TaskSerializer(serializers.ModelSerializer):
    """Task serializer for testing API Portal"""

    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "status",
            "created_by",
            "created_at",
            "updated_at",
            "due_date",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]

    def create(self, validated_data):
        # Automatically set created_by from request user
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Ensure created_by doesn't get overwritten
        validated_data.pop("created_by", None)
        return super().update(instance, validated_data)
