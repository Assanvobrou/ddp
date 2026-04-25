from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Répare les permissions en base"

    def handle(self, *args, **options):
        from apps.authentication.models import User, Module, PermissionGranulaire
        from apps.authentication.role_permissions import assigner_role

        PERMISSIONS = [
            {"code": "bureau.enregistrer_patient",   "nom": "Enregistrer un patient",           "module": "bureau_entrees"},
            {"code": "bureau.creer_fiche_paiement",  "nom": "Créer une fiche de paiement",      "module": "bureau_entrees"},
            {"code": "caisse.ouvrir_fermer_session", "nom": "Ouvrir et fermer la caisse",        "module": "caisse"},
            {"code": "caisse.valider_paiement",      "nom": "Valider un paiement patient",       "module": "caisse"},
            {"code": "caisse.voir_rapports",         "nom": "Voir les rapports et recettes",     "module": "caisse"},
            {"code": "caisse.valider_versement",     "nom": "Valider le versement",              "module": "caisse"},
            {"code": "config.gerer_prestations",     "nom": "Gérer les prestations",             "module": "configuration"},
            {"code": "config.gerer_assurances",      "nom": "Gérer les assurances",              "module": "configuration"},
            {"code": "config.gerer_personnel",       "nom": "Gérer le personnel",                "module": "configuration"},
            {"code": "config.gerer_parametres",      "nom": "Gérer les paramètres",              "module": "configuration"},
        ]

        self.stdout.write("1. Permissions...")
        for p in PERMISSIONS:
            module = Module.objects.filter(code=p["module"]).first()
            obj, created = PermissionGranulaire.objects.update_or_create(
                code=p["code"],
                defaults={"nom": p["nom"], "module": module}
            )
            self.stdout.write(f"  {'+ Créée' if created else '✓ OK'} : {p['code']}")

        # Supprimer les vieux codes
        old = ["caisse.gerer_session_caisse", "caisse.voir_dashboard_recettes",
               "caisse.exporter_rapport", "caisse.editer_fiche_paiement"]
        n = PermissionGranulaire.objects.filter(code__in=old).delete()[0]
        if n:
            self.stdout.write(f"  Supprimées : {n} permissions obsolètes")

        self.stdout.write("\n2. Réassignation des rôles...")
        for user in User.objects.exclude(role="super_admin"):
            assigner_role(user, user.role)
            n_perms = user.permissions_granulaires.count()
            self.stdout.write(f"  ✓ {user.nom_complet} ({user.role}) → {n_perms} permissions")

        self.stdout.write("\nOK")
