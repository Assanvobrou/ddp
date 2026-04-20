"""
Matrice de permissions par rôle — source de vérité unique.
Un utilisateur peut cumuler plusieurs rôles via roles_supplementaires.
assigner_role() fusionne les permissions de TOUS ses rôles.
"""

ALL_PERMISSIONS = [
    {"code": "bureau.enregistrer_patient",   "nom": "Enregistrer un patient"},
    {"code": "bureau.creer_fiche_paiement",  "nom": "Créer une fiche de paiement"},
    {"code": "caisse.ouvrir_fermer_session", "nom": "Ouvrir et fermer la caisse"},
    {"code": "caisse.valider_paiement",      "nom": "Valider un paiement patient"},
    {"code": "caisse.voir_rapports",         "nom": "Voir les rapports et recettes"},
    {"code": "caisse.valider_versement",     "nom": "Valider le versement d'une caissière"},
    {"code": "config.gerer_prestations",     "nom": "Gérer les prestations médicales"},
    {"code": "config.gerer_assurances",      "nom": "Gérer les assurances"},
    {"code": "config.gerer_personnel",       "nom": "Gérer le personnel et les rôles"},
    {"code": "config.gerer_parametres",      "nom": "Gérer les paramètres de la clinique"},
]

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
    Assigne les permissions en fusionnant TOUS les rôles de l'utilisateur
    (role principal + roles_supplementaires).
    """
    from apps.authentication.models import Module, PermissionGranulaire

    if role == 'super_admin':
        user.modules_autorises.set(Module.objects.filter(actif=True))
        user.permissions_granulaires.set(PermissionGranulaire.objects.all())
        return

    tous_roles = [role]
    for r in (getattr(user, 'roles_supplementaires', None) or []):
        if r and r not in tous_roles:
            tous_roles.append(r)

    codes_modules = []
    codes_perms = []
    for r in tous_roles:
        profil = ROLE_MATRIX.get(r, {})
        for m in profil.get('modules', []):
            if m not in codes_modules:
                codes_modules.append(m)
        for p in profil.get('permissions', []):
            if p not in codes_perms:
                codes_perms.append(p)

    if modules_supplementaires:
        for m in modules_supplementaires:
            if m not in codes_modules:
                codes_modules.append(m)

    user.modules_autorises.set(Module.objects.filter(code__in=codes_modules, actif=True))
    user.permissions_granulaires.set(PermissionGranulaire.objects.filter(code__in=codes_perms))
