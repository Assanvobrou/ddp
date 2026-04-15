import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Module, PermissionGranulaire, AuditLog

User = get_user_model()


class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["code", "nom", "emoji", "ordre"]


class PermissionGranulaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = PermissionGranulaire
        fields = ["code", "nom", "module"]


class DDPTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT enrichi avec les infos utilisateur et ses modules."""

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        modules = user.get_modules()
        permissions = (
            list(user.permissions_granulaires.values_list("code", flat=True))
            if not user.is_super_admin
            else list(
                PermissionGranulaire.objects.values_list("code", flat=True)
            )
        )

        data["utilisateur"] = {
            "id": str(user.id),
            "email": user.email,
            "nom_complet": user.nom_complet,
            "nom": user.nom,
            "prenom": user.prenom,
            "role": user.role,
            "role_display": user.get_role_display(),
            "mot_de_passe_provisoire": user.mot_de_passe_provisoire,
            "modules": ModuleSerializer(modules, many=True).data,
            "permissions": permissions,
        }
        return data


class UserMeSerializer(serializers.ModelSerializer):
    """Sérialiseur pour GET /auth/me — infos complètes de l'utilisateur connecté."""
    modules = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "matricule", "nom", "prenom",
            "role", "role_display", "mot_de_passe_provisoire",
            "modules", "permissions",
        ]

    def get_modules(self, obj):
        return ModuleSerializer(obj.get_modules(), many=True).data

    def get_permissions(self, obj):
        if obj.is_super_admin:
            return list(PermissionGranulaire.objects.values_list("code", flat=True))
        return list(obj.permissions_granulaires.values_list("code", flat=True))


class ChangePasswordSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField(required=True, write_only=True)
    nouveau_mot_de_passe = serializers.CharField(required=True, write_only=True)
    confirmation = serializers.CharField(required=True, write_only=True)

    def validate_nouveau_mot_de_passe(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["nouveau_mot_de_passe"] != attrs["confirmation"]:
            raise serializers.ValidationError(
                {"confirmation": "Les mots de passe ne correspondent pas."}
            )
        return attrs


class UserCreateSerializer(serializers.ModelSerializer):
    """Création d'un utilisateur par l'admin/directrice."""
    mot_de_passe = serializers.CharField(write_only=True, required=True)
    modules_ids = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    permissions_codes = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )

    class Meta:
        model = User
        fields = [
            "email", "matricule", "nom", "prenom", "role",
            "mot_de_passe", "modules_ids", "permissions_codes",
        ]

    def validate_email(self, value):
        return value.lower().strip()

    def validate_matricule(self, value):
        if value:
            return value.upper().strip()
        return value

    def validate_mot_de_passe(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        modules_ids = validated_data.pop("modules_ids", [])
        permissions_codes = validated_data.pop("permissions_codes", [])
        mot_de_passe = validated_data.pop("mot_de_passe")

        user = User(**validated_data)
        user.set_password(mot_de_passe)
        user.mot_de_passe_provisoire = True
        user.save()

        if modules_ids:
            modules = Module.objects.filter(code__in=modules_ids, actif=True)
            user.modules_autorises.set(modules)

        if permissions_codes:
            perms = PermissionGranulaire.objects.filter(code__in=permissions_codes)
            user.permissions_granulaires.set(perms)

        return user


class UserListSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    modules = ModuleSerializer(source="get_modules", many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "matricule", "nom", "prenom",
            "role", "role_display", "is_active",
            "mot_de_passe_provisoire", "date_creation", "modules",
        ]


class UserUpdateSerializer(serializers.ModelSerializer):
    modules_ids = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )
    permissions_codes = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )

    class Meta:
        model = User
        fields = [
            "nom", "prenom", "role", "is_active",
            "modules_ids", "permissions_codes",
        ]

    def update(self, instance, validated_data):
        modules_ids = validated_data.pop("modules_ids", None)
        permissions_codes = validated_data.pop("permissions_codes", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if modules_ids is not None:
            modules = Module.objects.filter(code__in=modules_ids, actif=True)
            instance.modules_autorises.set(modules)

        if permissions_codes is not None:
            perms = PermissionGranulaire.objects.filter(code__in=permissions_codes)
            instance.permissions_granulaires.set(perms)

        return instance
