"""
Matrice de permissions par rôle — source de vérité unique.

Nomenclature : module.action_objet
- bureau.  = bureau des entrées
- caisse.  = module caisse
- config.  = configuration clinique

Pour ajouter une permission à un rôle :
1. Ajouter le code ici dans le bon rôle
2. Créer la permission en base via populate_ddp_data ou migration
3. La référencer dans core/permissions.py
"""

# Liste complète de toutes les permissions existantes
ALL_PERMISSIONS = [
    # Bureau des entrées
    {"code": "bureau.enregistrer_patient",  "nom": "Enregistrer un patient"},
    {"code": "bureau.creer_fiche_paiement", "nom": "Créer une fiche de paiement"},
    # Caisse — tous les rôles caisse
    {"code": "caisse.ouvrir_fermer_session","nom": "Ouvrir et fermer la caisse"},
    {"code": "caisse.valider_paiement",     "nom": "Valider un paiement patient"},
    # Caisse — responsables seulement
    {"code": "caisse.voir_rapports",        "nom": "Voir les rapports et recettes"},
    {"code": "caisse.valider_versement",    "nom": "Valider le versement d'une caissière"},
    # Configuration — directrice seulement
    {"code": "config.gerer_prestations",   "nom": "Gérer les prestations médicales"},
    {"code": "config.gerer_assurances",    "nom": "Gérer les assurances"},
    {"code": "config.gerer_personnel",     "nom": "Gérer le personnel et les rôles"},
    {"code": "config.gerer_parametres",    "nom": "Gérer les paramètres de la clinique"},
]

# Matrice rôle → modules + permissions
ROLE_MATRIX = {
    'caissiere': {
        'modules': ['bureau_entrees', 'caisse'],
        'permissions': [
            'bureau.enregistrer_patient',
            'bureau.creer_fiche_paiement',
            'caisse.ouvrir_fermer_session',
            'caisse.valider_paiement',
        ]
    },
    'comptable': {
        'modules': ['bureau_entrees', 'caisse'],
        'permissions': [
            'bureau.enregistrer_patient',
            'bureau.creer_fiche_paiement',
            'caisse.ouvrir_fermer_session',
            'caisse.valider_paiement',
            'caisse.voir_rapports',
            'caisse.valider_versement',
        ]
    },
    'directrice': {
        'modules': ['bureau_entrees', 'caisse', 'configuration'],
        'permissions': [
            'bureau.enregistrer_patient',
            'bureau.creer_fiche_paiement',
            'caisse.ouvrir_fermer_session',
            'caisse.valider_paiement',
            'caisse.voir_rapports',
            'caisse.valider_versement',
            'config.gerer_prestations',
            'config.gerer_assurances',
            'config.gerer_personnel',
            'config.gerer_parametres',
        ]
    },
}


def assigner_role(user, role: str, modules_supplementaires: list = None):
    """
    Assigne automatiquement les permissions et modules selon le(s) rôle(s).
    Si l'utilisateur a un role_secondaire, les permissions des deux rôles sont fusionnées.
    Appelé à la création ET à chaque modification de rôle.
    """
    from apps.authentication.models import Module, PermissionGranulaire

    if role == 'super_admin':
        user.modules_autorises.set(Module.objects.filter(actif=True))
        user.permissions_granulaires.set(PermissionGranulaire.objects.all())
        return

    profil = ROLE_MATRIX.get(role, {})
    role_secondaire = getattr(user, 'role_secondaire', None)
    profil2 = ROLE_MATRIX.get(role_secondaire, {}) if role_secondaire else {}

    # Fusion des modules
    codes_modules = list(set(profil.get('modules', []) + profil2.get('modules', [])))
    if modules_supplementaires:
        codes_modules += [m for m in modules_supplementaires if m not in codes_modules]

    # Fusion des permissions
    codes_perms = list(set(profil.get('permissions', []) + profil2.get('permissions', [])))

    modules = Module.objects.filter(code__in=codes_modules, actif=True)
    user.modules_autorises.set(modules)

    perms = PermissionGranulaire.objects.filter(code__in=codes_perms)
    user.permissions_granulaires.set(perms)
