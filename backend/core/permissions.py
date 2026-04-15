from rest_framework.permissions import BasePermission


class HasModule(BasePermission):
    """Vérifie que l'utilisateur a accès au module spécifié."""
    module_code = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_active:
            return False
        return request.user.has_module(self.module_code)


class HasPermissionCode(BasePermission):
    """Vérifie qu'un utilisateur possède une permission granulaire."""
    permission_code = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_active:
            return False
        return request.user.has_permission_code(self.permission_code)


def module_permission(module_code):
    """Factory — crée une classe de permission pour un module donné."""
    return type(
        f"HasModule_{module_code}",
        (HasModule,),
        {"module_code": module_code},
    )


def granular_permission(perm_code):
    """Factory — crée une classe de permission granulaire."""
    return type(
        f"HasPerm_{perm_code}",
        (HasPermissionCode,),
        {"permission_code": perm_code},
    )


# Permissions prédéfinies — Caisse
CanEnregistrerPatient = granular_permission("caisse.enregistrer_patient")
CanEditerFichePaiement = granular_permission("caisse.editer_fiche_paiement")
CanVoirDashboardRecettes = granular_permission("caisse.voir_dashboard_recettes")
CanExporterRapport = granular_permission("caisse.exporter_rapport")
CanGererCaisse = granular_permission("caisse.gerer_session_caisse")

# Permissions prédéfinies — Configuration
CanGererPrestations = granular_permission("config.gerer_prestations")
CanGererPersonnel = granular_permission("config.gerer_personnel")
CanGererAssurances = granular_permission("config.gerer_assurances")
CanGererParametres = granular_permission("config.gerer_parametres")

# Accès modules
HasCaisseModule = module_permission("caisse")
HasConfigModule = module_permission("configuration")
