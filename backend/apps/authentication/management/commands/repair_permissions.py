from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Répare les permissions — à lancer si les admins ne voient pas toutes les sous-rubriques"

    def handle(self, *args, **options):
        from apps.authentication.models import User, Module, PermissionGranulaire
        from apps.authentication.role_permissions import ALL_PERMISSIONS, assigner_role

        # 1. Créer les permissions manquantes
        self.stdout.write("1. Vérification des permissions...")
        for perm_data in ALL_PERMISSIONS:
            obj, created = PermissionGranulaire.objects.update_or_create(
                code=perm_data["code"],
                defaults={"nom": perm_data["nom"]}
            )
            if created:
                self.stdout.write(f"  + Créée : {perm_data['code']}")
            else:
                self.stdout.write(f"  ✓ OK : {perm_data['code']}")

        # 2. Supprimer les vieilles permissions avec les mauvais noms
        old_codes = [
            "caisse.voir_dashboard_recettes",
            "caisse.gerer_session_caisse",
            "caisse.editer_fiche_paiement",
        ]
        deleted = PermissionGranulaire.objects.filter(code__in=old_codes).delete()
        if deleted[0]:
            self.stdout.write(f"  Supprimées : {deleted[0]} permissions obsolètes")

        # 3. Réassigner les rôles de tous les utilisateurs
        self.stdout.write("\n2. Réassignation des rôles...")
        for user in User.objects.exclude(role="super_admin"):
            assigner_role(user, user.role)
            perms = list(user.permissions_granulaires.values_list("code", flat=True))
            self.stdout.write(f"  ✓ {user.nom_complet} ({user.role}) → {len(perms)} permissions")

        self.stdout.write("\nOK — Permissions réparées.")
