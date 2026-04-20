import re
import unicodedata
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
    """
    JWT enrichi avec les infos utilisateur et ses modules.
    Accepte l'email OU le matricule comme identifiant (ex: b.assanvo).
    """

    def validate(self, attrs):
        # Résoudre le matricule vers l'email si nécessaire
        username = attrs.get(self.username_field, "")
        if username and "@" not in username:
            # C'est un matricule — chercher l'utilisateur correspondant
            try:
                user_obj = User.objects.get(matricule=username.lower())
                attrs[self.username_field] = user_obj.email
            except User.DoesNotExist:
                pass
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
            "role", "role_display", "tous_roles_display", "mot_de_passe_provisoire",
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
    """
    Création d'un utilisateur (personnel de la clinique).
    Email non requis — auto-généré depuis le matricule.
    Matricule = identifiant de connexion (ex: b.assanvo).
    """
    mot_de_passe = serializers.CharField(write_only=True, required=True)
    modules_ids = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False
    )

    class Meta:
        model = User
        fields = [
            "matricule", "nom", "prenom", "role", "roles_supplementaires",
            "telephone", "telephone2", "ville", "quartier",
            "date_naissance", "situation_matrimoniale",
            "mot_de_passe", "modules_ids",
        ]

    def validate_matricule(self, value):
        return value.lower().strip()

    def validate_mot_de_passe(self, value):
        """Mot de passe : tout caractère accepté, minimum 4 caractères."""
        if len(value) < 4:
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 4 caractères.")
        return value

    def create(self, validated_data):
        modules_ids = validated_data.pop("modules_ids", [])
        mot_de_passe = validated_data.pop("mot_de_passe")
        matricule = validated_data.get("matricule", "")

        # Auto-générer le matricule si absent
        if not matricule:
            prenom = validated_data.get("prenom", "")
            nom = validated_data.get("nom", "")
            def slug(s):
                nfkd = unicodedata.normalize("NFKD", s)
                return re.sub(r"[^a-z0-9]", "", nfkd.encode("ascii","ignore").decode().lower())
            base = f"{slug(prenom)[:1]}.{slug(nom)}"
            matricule = base
            counter = 2
            while User.objects.filter(matricule=matricule).exists():
                matricule = f"{base}{counter}"
                counter += 1
            validated_data["matricule"] = matricule

        # Email auto-généré depuis le matricule (requis par Django auth)
        email = f"{validated_data['matricule']}@ddp.local"
        counter = 2
        while User.objects.filter(email=email).exists():
            email = f"{validated_data['matricule']}{counter}@ddp.local"
            counter += 1
        validated_data["email"] = email

        user = User(**validated_data)
        user.set_password(mot_de_passe)
        user.mot_de_passe_provisoire = True
        user.save()

        from .role_permissions import assigner_role
        assigner_role(user, user.role, modules_supplementaires=modules_ids)

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
        validated_data.pop("permissions_codes", None)  # ignoré — calculé depuis le rôle

        role_changed = "role" in validated_data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si le rôle change ou si on met à jour les modules, recalculer les permissions
        if role_changed or modules_ids is not None:
            from .role_permissions import assigner_role
            assigner_role(instance, instance.role, modules_supplementaires=modules_ids)

        return instance


class AdminChangePasswordSerializer(serializers.Serializer):
    """Changement de mot de passe d'un utilisateur par l'admin."""
    nouveau_mot_de_passe = serializers.CharField(required=True, write_only=True)

    def validate_nouveau_mot_de_passe(self, value):
        """Mot de passe : tout caractère accepté, minimum 4 caractères."""
        if len(value) < 4:
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 4 caractères.")
        return value
