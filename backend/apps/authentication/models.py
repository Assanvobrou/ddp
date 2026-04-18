"""
Modèles d'authentification DDP
- User : modèle utilisateur personnalisé avec RBAC
- Module : modules accessibles de l'application
- PermissionGranulaire : permissions par fonctionnalité
- AuditLog : journal d'audit des actions sensibles
"""
import uuid
import logging
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone

logger = logging.getLogger("apps.authentication")


class Module(models.Model):
    """Représente un module de l'application (caisse, configuration, etc.)"""
    code = models.CharField(max_length=50, unique=True, verbose_name="Code")
    nom = models.CharField(max_length=100, verbose_name="Nom")
    description = models.TextField(blank=True, verbose_name="Description")
    emoji = models.CharField(max_length=10, default="📦", verbose_name="Emoji")
    ordre = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    actif = models.BooleanField(default=True, verbose_name="Actif")

    class Meta:
        db_table = "ddp_modules"
        ordering = ["ordre"]
        verbose_name = "Module"
        verbose_name_plural = "Modules"

    def __str__(self):
        return f"{self.emoji} {self.nom}"


class PermissionGranulaire(models.Model):
    """Permission granulaire par fonctionnalité dans un module."""
    code = models.CharField(max_length=100, unique=True, verbose_name="Code")
    nom = models.CharField(max_length=200, verbose_name="Nom lisible")
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE,
        related_name="permissions_granulaires",
        verbose_name="Module"
    )

    class Meta:
        db_table = "ddp_permissions_granulaires"
        verbose_name = "Permission granulaire"
        verbose_name_plural = "Permissions granulaires"

    def __str__(self):
        return f"{self.module.code}.{self.code}"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire")
        email = self.normalize_email(email).lower()
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.SUPER_ADMIN)
        extra_fields.setdefault("nom", "Super")
        extra_fields.setdefault("prenom", "Admin")
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Un superuser doit avoir is_staff=True")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    CAISSIERE = "caissiere"
    COMPTABLE = "comptable"
    DIRECTRICE = "directrice"
    SUPER_ADMIN = "super_admin"

    ROLES = [
        (CAISSIERE, "Caissière"),
        (COMPTABLE, "Comptable"),
        (DIRECTRICE, "Directrice"),
        (SUPER_ADMIN, "Super Administrateur"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name="Email")
    matricule = models.CharField(
        max_length=20, unique=True, blank=True, null=True,
        verbose_name="Matricule"
    )
    nom = models.CharField(max_length=100, verbose_name="Nom")

    # ── Informations personnelles ─────────────────────────────────────────────
    telephone = models.CharField(max_length=25, blank=True, verbose_name="Téléphone")
    telephone2 = models.CharField(max_length=25, blank=True, verbose_name="Téléphone 2 (optionnel)")
    ville = models.CharField(max_length=100, blank=True, verbose_name="Ville de résidence")
    quartier = models.CharField(max_length=100, blank=True, verbose_name="Quartier")
    date_naissance = models.DateField(null=True, blank=True, verbose_name="Date de naissance")
    situation_matrimoniale = models.CharField(
        max_length=20, blank=True,
        choices=[("celibataire", "Célibataire"), ("marie", "Marié(e)"), ("divorce", "Divorcé(e)"), ("veuf", "Veuf/Veuve")],
        verbose_name="Situation matrimoniale"
    )
    prenom = models.CharField(max_length=100, verbose_name="Prénom")
    role = models.CharField(
        max_length=20, choices=ROLES,
        verbose_name="Rôle"
    )
    modules_autorises = models.ManyToManyField(
        Module, blank=True,
        related_name="utilisateurs",
        verbose_name="Modules autorisés"
    )
    permissions_granulaires = models.ManyToManyField(
        PermissionGranulaire, blank=True,
        related_name="utilisateurs",
        verbose_name="Permissions granulaires"
    )
    is_active = models.BooleanField(default=True, verbose_name="Compte actif")
    is_staff = models.BooleanField(default=False, verbose_name="Staff Django")
    mot_de_passe_provisoire = models.BooleanField(
        default=True, verbose_name="Mot de passe provisoire"
    )
    date_creation = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    date_modification = models.DateTimeField(auto_now=True, verbose_name="Dernière modification")
    derniere_connexion_ip = models.GenericIPAddressField(
        null=True, blank=True, verbose_name="Dernière IP de connexion"
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom", "role"]

    class Meta:
        db_table = "ddp_users"
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.get_role_display()})"

    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"

    @property
    def is_super_admin(self):
        return self.role == self.SUPER_ADMIN

    def get_modules(self):
        """Retourne les modules accessibles selon le rôle."""
        if self.is_super_admin:
            return Module.objects.filter(actif=True).order_by("ordre")
        return self.modules_autorises.filter(actif=True).order_by("ordre")

    def has_module(self, module_code: str) -> bool:
        """Vérifie l'accès à un module."""
        if self.is_super_admin:
            return Module.objects.filter(code=module_code, actif=True).exists()
        return self.modules_autorises.filter(code=module_code, actif=True).exists()

    def has_permission_code(self, permission_code: str) -> bool:
        """Vérifie une permission granulaire."""
        if self.is_super_admin:
            return True
        return self.permissions_granulaires.filter(code=permission_code).exists()


class AuditLog(models.Model):
    """Journal d'audit des actions sensibles — immuable."""
    ACTIONS = [
        ("connexion", "Connexion"),
        ("deconnexion", "Déconnexion"),
        ("echec_connexion", "Échec de connexion"),
        ("creation_user", "Création utilisateur"),
        ("modification_user", "Modification utilisateur"),
        ("desactivation_user", "Désactivation utilisateur"),
        ("modification_permissions", "Modification des permissions"),
        ("ouverture_caisse", "Ouverture de caisse"),
        ("fermeture_caisse", "Fermeture de caisse"),
        ("validation_versement", "Validation versement"),
        ("enregistrement_patient", "Enregistrement patient"),
        ("modification_fiche", "Modification fiche paiement"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True,
        related_name="audit_logs", verbose_name="Utilisateur"
    )
    action = models.CharField(max_length=50, choices=ACTIONS, verbose_name="Action")
    details = models.JSONField(default=dict, verbose_name="Détails")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="Adresse IP")
    user_agent = models.CharField(max_length=500, blank=True, verbose_name="User Agent")
    timestamp = models.DateTimeField(default=timezone.now, verbose_name="Horodatage")

    class Meta:
        db_table = "ddp_audit_logs"
        ordering = ["-timestamp"]
        verbose_name = "Journal d'audit"
        verbose_name_plural = "Journal d'audit"
        # Empêche toute modification après création
        default_permissions = ("view",)

    def __str__(self):
        return f"{self.timestamp:%Y-%m-%d %H:%M} — {self.utilisateur} — {self.action}"

    @classmethod
    def log(cls, utilisateur, action, details=None, request=None):
        """Crée une entrée d'audit de façon sécurisée."""
        ip = None
        ua = ""
        if request:
            ip = cls._get_client_ip(request)
            ua = request.META.get("HTTP_USER_AGENT", "")[:500]
        try:
            cls.objects.create(
                utilisateur=utilisateur,
                action=action,
                details=details or {},
                ip_address=ip,
                user_agent=ua,
            )
        except Exception as e:
            logger.error("Échec création audit log: %s", e)

    @staticmethod
    def _get_client_ip(request):
        x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded:
            return x_forwarded.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")