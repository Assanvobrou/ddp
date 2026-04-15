import logging
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Module, PermissionGranulaire, AuditLog
from .serializers import (
    DDPTokenObtainPairSerializer,
    UserMeSerializer,
    ChangePasswordSerializer,
    UserCreateSerializer,
    UserListSerializer,
    UserUpdateSerializer,
)
from core.permissions import CanGererPersonnel

User = get_user_model()
logger = logging.getLogger("apps.authentication")


class DDPTokenObtainPairView(TokenObtainPairView):
    """POST /auth/login — connexion avec JWT enrichi."""
    serializer_class = DDPTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            # Audit log connexion réussie
            email = request.data.get("email", "").lower()
            try:
                user = User.objects.get(email=email)
                user.derniere_connexion_ip = AuditLog._get_client_ip(request)
                user.save(update_fields=["derniere_connexion_ip"])
                AuditLog.log(user, "connexion", request=request)
            except User.DoesNotExist:
                pass
        else:
            # Audit log échec
            AuditLog.log(
                None, "echec_connexion",
                details={"email": request.data.get("email", "")},
                request=request,
            )

        return response


class LogoutView(APIView):
    """POST /auth/logout — révocation du refresh token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            AuditLog.log(request.user, "deconnexion", request=request)
            return Response({"success": True, "message": "Déconnexion réussie."})
        except Exception as e:
            logger.warning("Erreur logout: %s", e)
            return Response(
                {"success": False, "erreur": "Token invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MeView(APIView):
    """GET /auth/me — profil + modules + permissions de l'utilisateur connecté."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response({"success": True, "data": serializer.data})


class ChangePasswordView(APIView):
    """POST /auth/change-password — changement de mot de passe."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "erreur": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        if not user.check_password(serializer.validated_data["ancien_mot_de_passe"]):
            return Response(
                {"success": False, "erreur": "Ancien mot de passe incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["nouveau_mot_de_passe"])
        user.mot_de_passe_provisoire = False
        user.save(update_fields=["password", "mot_de_passe_provisoire"])

        AuditLog.log(user, "modification_user",
                     details={"action": "changement_mot_de_passe"}, request=request)

        return Response({"success": True, "message": "Mot de passe mis à jour."})


# ── GESTION DU PERSONNEL (Config → Personnel) ─────────────────────────────────

class UserListCreateView(generics.ListCreateAPIView):
    """GET/POST /auth/users — liste et création du personnel."""
    permission_classes = [permissions.IsAuthenticated, CanGererPersonnel]
    queryset = User.objects.select_related().prefetch_related(
        "modules_autorises", "permissions_granulaires"
    ).order_by("nom", "prenom")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserListSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        AuditLog.log(
            self.request.user, "creation_user",
            details={"email": user.email, "role": user.role},
            request=self.request,
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        # Exclure le super admin de la liste si pas super admin
        if not request.user.is_super_admin:
            qs = qs.exclude(role=User.SUPER_ADMIN)
        serializer = UserListSerializer(qs, many=True)
        return Response({"success": True, "data": serializer.data})


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /auth/users/<id> — détail et gestion d'un utilisateur."""
    permission_classes = [permissions.IsAuthenticated, CanGererPersonnel]
    queryset = User.objects.prefetch_related("modules_autorises", "permissions_granulaires")

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return UserUpdateSerializer
        return UserListSerializer

    def perform_update(self, serializer):
        user = serializer.save()
        AuditLog.log(
            self.request.user, "modification_user",
            details={"cible_id": str(user.id), "modifications": self.request.data},
            request=self.request,
        )

    def destroy(self, request, *args, **kwargs):
        """Désactivation (jamais suppression physique)."""
        user = self.get_object()
        if user == request.user:
            return Response(
                {"success": False, "erreur": "Vous ne pouvez pas désactiver votre propre compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_active = False
        user.save(update_fields=["is_active"])
        AuditLog.log(
            request.user, "desactivation_user",
            details={"cible_id": str(user.id), "email": user.email},
            request=request,
        )
        return Response({"success": True, "message": "Compte désactivé."})


class ModulesListView(APIView):
    """GET /auth/modules — liste tous les modules disponibles."""
    permission_classes = [permissions.IsAuthenticated, CanGererPersonnel]

    def get(self, request):
        from .serializers import ModuleSerializer, PermissionGranulaireSerializer
        modules = Module.objects.filter(actif=True).prefetch_related("permissions_granulaires")
        data = []
        for m in modules:
            data.append({
                "code": m.code,
                "nom": m.nom,
                "emoji": m.emoji,
                "permissions": PermissionGranulaireSerializer(
                    m.permissions_granulaires.all(), many=True
                ).data,
            })
        return Response({"success": True, "data": data})
