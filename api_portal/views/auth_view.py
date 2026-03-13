from django import forms
from django.contrib.auth import authenticate, get_user_model, login
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import FormView

User = get_user_model()


class LoginForm(forms.Form):
    """Login form for API Portal"""

    username = forms.CharField(
        max_length=150,
        label=User.USERNAME_FIELD.replace("_", " ").title(),
        widget=forms.TextInput(
            attrs={
                "placeholder": User.USERNAME_FIELD.replace("_", " ").title(),
                "class": "dark-input w-full px-4 py-2 border rounded-lg transition-colors duration-200",
            }
        ),
    )
    password = forms.CharField(
        widget=forms.PasswordInput(
            attrs={
                "placeholder": "Password",
                "class": "dark-input w-full px-4 py-2 border rounded-lg transition-colors duration-200",
            }
        )
    )
    api_token = forms.CharField(
        required=False,
        widget=forms.TextInput(
            attrs={
                "placeholder": "API Token (optional)",
                "class": "dark-input w-full px-4 py-2 border rounded-lg transition-colors duration-200",
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

        # Authenticate user - Django's authenticate handles custom USERNAME_FIELD automatically
        # The 'username' kwarg name is just a convention; Django maps it to the actual USERNAME_FIELD
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
            username_label = User.USERNAME_FIELD.replace("_", " ")
            form.add_error(None, f"Invalid {username_label} or password")
            return self.form_invalid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        from django.conf import settings

        portal_settings = getattr(settings, "API_PORTAL", {})
        portal_name = portal_settings.get("TITLE", "API Portal")
        context["title"] = f"Login - {portal_name}"
        context["portal_name"] = portal_name
        return context
