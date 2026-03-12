from django import forms
from django.contrib.auth import authenticate, login
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import FormView


class LoginForm(forms.Form):
    """Login form for API Portal"""

    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(
            attrs={
                "placeholder": "Username",
                "class": "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            }
        ),
    )
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "placeholder": "Password",
                "class": "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            }
        )
    )
    api_token = forms.CharField(
        required=False,
        widget=forms.TextInput(
            attrs={
                "placeholder": "API Token (optional)",
                "class": "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            }
        ),
        help_text="Optional: Enter your API token/key for authenticated API requests",
    )


class PortalLoginView(FormView):
    """
    Login view for API Portal.

    Authenticates users and stores API token in session for proxy requests.
    """

    template_name = "api_portal/login.html"
    form_class = LoginForm
    success_url = reverse_lazy("api_portal:docs")

    def dispatch(self, request, *args, **kwargs):
        # Redirect if already logged in
        if request.user.is_authenticated:
            return redirect(self.success_url)
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        username = form.cleaned_data["username"]
        password = form.cleaned_data["password"]
        api_token = form.cleaned_data.get("api_token", "")

        # Authenticate user
        user = authenticate(self.request, username=username, password=password)

        if user is not None:
            # Log the user in
            login(self.request, user)

            # Store API token in session if provided
            if api_token:
                self.request.session["api_token"] = api_token

            return super().form_valid(form)
        else:
            # Authentication failed
            form.add_error(None, "Invalid username or password")
            return self.form_invalid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        from django.conf import settings

        portal_settings = getattr(settings, "API_PORTAL", {})
        portal_name = portal_settings.get("TITLE", "API Portal")
        context["title"] = f"Login - {portal_name}"
        context["portal_name"] = portal_name
        return context
