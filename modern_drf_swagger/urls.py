from django.contrib.auth.views import LogoutView
from django.urls import path

from .views.analytics_view import AnalyticsView, HistoryView
from .views.api_proxy_view import APIProxyView
from .views.auth_view import PortalLoginView
from .views.docs_view import DocsView, SchemaView

app_name = "modern_drf_swagger"

urlpatterns = [
    path("", DocsView.as_view(), name="docs"),
    path("schema/", SchemaView.as_view(), name="schema"),
    path("api-proxy/", APIProxyView.as_view(), name="api_proxy"),
    path("analytics/", AnalyticsView.as_view(), name="analytics"),
    path("history/", HistoryView.as_view(), name="history"),
    path("login/", PortalLoginView.as_view(), name="login"),
    path(
        "logout/",
        LogoutView.as_view(next_page="modern_drf_swagger:login"),
        name="logout",
    ),
]
