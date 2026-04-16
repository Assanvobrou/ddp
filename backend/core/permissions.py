"""
Permissions DDP — nomenclature définitive : module.action_objet
Chaque permission est nommée pour être compréhensible dans 6 mois.
"""
from rest_framework.permissions import BasePermission


class HasModule(BasePermission):
    module_code = None
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_active:
            return False
        return request.user.has_module(self.module_code)


class HasPermissionCode(BasePermission):
    permission_code = None
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if not request.user.is_active:
            return False
        return request.user.has_permission_code(self.permission_code)


def module_permission(module_code):
    return type(f"HasModule_{module_code}", (HasModule,), {"module_code": module_code})

def granular_permission(perm_code):
    return type(f"HasPerm_{perm_code.replace('.','_')}", (HasPermissionCode,), {"permission_code": perm_code})


# ── BUREAU DES ENTRÉES ────────────────────────────────────────────────────────
CanEnregistrerPatient   = granular_permission("bureau.enregistrer_patient")
CanCreerFichePaiement   = granular_permission("bureau.creer_fiche_paiement")

# ── CAISSE ────────────────────────────────────────────────────────────────────
CanOuvrirFermerSession  = granular_permission("caisse.ouvrir_fermer_session")
CanValiderPaiement      = granular_permission("caisse.valider_paiement")
CanVoirRapports         = granular_permission("caisse.voir_rapports")
CanValiderVersement     = granular_permission("caisse.valider_versement")

# ── CONFIGURATION ─────────────────────────────────────────────────────────────
CanGererPrestations     = granular_permission("config.gerer_prestations")
CanGererAssurances      = granular_permission("config.gerer_assurances")
CanGererPersonnel       = granular_permission("config.gerer_personnel")
CanGererParametres      = granular_permission("config.gerer_parametres")

# ── ACCÈS MODULES ─────────────────────────────────────────────────────────────
HasBureauModule         = module_permission("bureau_entrees")
HasCaisseModule         = module_permission("caisse")
HasConfigModule         = module_permission("configuration")

# ── ALIASES rétrocompatibilité ─────────────────────────────────────────────────
CanGererCaisse           = CanOuvrirFermerSession
CanVoirDashboardRecettes = CanVoirRapports
CanEditerFichePaiement   = CanValiderPaiement
CanExporterRapport       = CanVoirRapports
