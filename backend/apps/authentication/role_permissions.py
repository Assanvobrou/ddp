"""
Matrice de permissions par rôle — source de vérité unique.
Quand on assigne un rôle à un utilisateur, ses permissions sont définies ici.
"""

ROLE_MATRIX = {
    'caissiere': {
        'modules': ['bureau_entrees', 'caisse'],
        'permissions': [
            'bureau.enregistrer_patient',
            'bureau.creer_fiche_paiement',
            'caisse.gerer_session_caisse',
            'caisse.valider_paiement',
        ]
    },
    'comptable': {
        'modules': ['bureau_entrees', 'caisse'],
        'permissions': [
            'bureau.enregistrer_patient',
            'bureau.creer_fiche_paiement',
            'caisse.gerer_session_caisse',
            'caisse.valider_paiement',
            'caisse.voir_dashboard_recettes',
            'caisse.exporter_rapport',
        ]
    },
    'directrice': {
        'modules': ['bureau_entrees', 'caisse', 'configuration'],
        'permissions': [
            'bureau.enregistrer_patient',
            'bureau.creer_fiche_paiement',
            'caisse.gerer_session_caisse',
            'caisse.valider_paiement',
            'caisse.voir_dashboard_recettes',
            'caisse.exporter_rapport',
            'config.gerer_prestations',
            'config.gerer_assurances',
            'config.gerer_personnel',
            'config.gerer_parametres',
        ]
    },
}


def assigner_role(user, role: str, modules_supplementaires: list = None):
    """
    Assigne automatiquement les permissions et modules correspondant au rôle.
    modules_supplementaires : codes de modules additionnels à ajouter (optionnel)
    """
    from .models import Module, PermissionGranulaire

    if role == 'super_admin':
        # Super admin a tout
        tous_modules = Module.objects.filter(actif=True)
        user.modules_autorises.set(tous_modules)
        toutes_permissions = PermissionGranulaire.objects.all()
        user.permissions_granulaires.set(toutes_permissions)
        return

    profil = ROLE_MATRIX.get(role)
    if not profil:
        return

    # Modules du rôle
    codes_modules = list(profil['modules'])
    if modules_supplementaires:
        codes_modules += [m for m in modules_supplementaires if m not in codes_modules]

    modules = Module.objects.filter(code__in=codes_modules, actif=True)
    user.modules_autorises.set(modules)

    # Permissions du rôle
    perms = PermissionGranulaire.objects.filter(code__in=profil['permissions'])
    user.permissions_granulaires.set(perms)
