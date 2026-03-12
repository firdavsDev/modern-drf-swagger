from django.contrib import admin

# Register your models here.
from .models import Task


class TaskAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "status", "created_by", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("title", "description", "created_by__username")


admin.site.register(Task, TaskAdmin)
