from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    DDPTokenObtainPairView,
    LogoutView,
    MeView,
    ChangePasswordView,
    UserListCreateView,
    UserDetailView,
    ModulesListView,
    AssignerRoleView,
)

urlpatterns = [
    path("login/", DDPTokenObtainPairView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),

    # Gestion du personnel
    path("users/", UserListCreateView.as_view(), name="user-list-create"),
    path("users/<uuid:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("users/<uuid:pk>/assigner-role/", AssignerRoleView.as_view(), name="user-assigner-role"),
    path("modules/", ModulesListView.as_view(), name="modules-list"),
]
