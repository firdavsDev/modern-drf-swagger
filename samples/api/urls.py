from django.urls import include, path

from api.views import TaskEnvelopeAPIView, TaskViewSet, UserViewSet
from rest_framework import routers

# API Router
router = routers.DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
    path("task-envelope/", TaskEnvelopeAPIView.as_view(), name="task-envelope"),
]
