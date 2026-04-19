"""
Commande de management Django : populate_ddp_data
Initialise les modules, permissions et le super admin.

Usage : python manage.py populate_ddp_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

MODULES = [
    {"code": "bureau_entrees", "nom": "Bureau des entrées", "emoji": "🏥", "ordre": 1},
    {"code": "caisse",         "nom": "Caisse",             "emoji": "💰", "ordre": 2},
    {"code": "configuration",  "nom": "Configuration",      "emoji": "⚙️", "ordre": 3},
]

PERMISSIONS = [
    # Bureau des entrées
    {"code": "bureau.enregistrer_patient",   "nom": "Enregistrer un patient",        "module": "bureau_entrees"},
    {"code": "bureau.creer_fiche_paiement",  "nom": "Créer une fiche de paiement",   "module": "bureau_entrees"},
    # Caisse
    {"code": "caisse.gerer_session_caisse",  "nom": "Ouvrir / fermer la caisse",     "module": "caisse"},
    {"code": "caisse.valider_paiement",      "nom": "Valider un paiement",           "module": "caisse"},
    {"code": "caisse.voir_dashboard_recettes","nom": "Voir le dashboard des recettes","module": "caisse"},
    {"code": "caisse.exporter_rapport",      "nom": "Exporter les rapports",         "module": "caisse"},
    # Configuration
    {"code": "config.gerer_prestations",    "nom": "Gérer les prestations",          "module": "configuration"},
    {"code": "config.gerer_personnel",      "nom": "Gérer le personnel",             "module": "configuration"},
    {"code": "config.gerer_assurances",     "nom": "Gérer les assurances",           "module": "configuration"},
    {"code": "config.gerer_parametres",     "nom": "Gérer les paramètres clinique",  "module": "configuration"},
]


class Command(BaseCommand):
    help = "Initialise les modules, permissions et données de base DDP"

    def handle(self, *args, **options):
        from apps.authentication.models import Module, PermissionGranulaire

        self.stdout.write("🗂️  Initialisation DDP...\n")

        # Modules
        for m_data in MODULES:
            module, created = Module.objects.get_or_create(
                code=m_data["code"],
                defaults={k: v for k, v in m_data.items() if k != "code"}
            )
            status = "✅ Créé" if created else "⏭  Existe"
            self.stdout.write(f"  {status} — Module : {module.emoji} {module.nom}")

        # Permissions
        for p_data in PERMISSIONS:
            module = Module.objects.get(code=p_data["module"])
            perm, created = PermissionGranulaire.objects.get_or_create(
                code=p_data["code"],
                defaults={"nom": p_data["nom"], "module": module}
            )
            status = "✅ Créé" if created else "⏭  Existe"
            self.stdout.write(f"  {status} — Permission : {perm.code}")

        # Super admin
        admin, created = User.objects.get_or_create(
            email="admin@ddp.ci",
            defaults={"nom": "Admin", "prenom": "Super", "is_superuser": True, "is_staff": True}
        )
        admin.set_password("Admin@DDP2026!")
        admin.mot_de_passe_provisoire = False
        admin.is_superuser = True
        admin.is_staff = True
        admin.save()
        status = "✅ Créé" if created else "🔄 Mot de passe réinitialisé"
        self.stdout.write(f"\n{status} — Super admin : admin@ddp.ci / Admin@DDP2026!")

        self.stdout.write(self.style.SUCCESS("\n🎉 Initialisation terminée !"))
