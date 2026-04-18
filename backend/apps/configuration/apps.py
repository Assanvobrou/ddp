from django.apps import AppConfig


class ConfigurationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.configuration"
    verbose_name = "Configuration"

    def ready(self):
        """
        Appelé au démarrage Django.
        Génère les assurances ivoiriennes par défaut si la table est vide.
        N'écrase rien si des assurances existent déjà.
        """
        try:
            from django.db import connection
            # Vérifier que la table existe avant d'agir (évite les erreurs au premier makemigrations)
            if "ddp_assurances" in connection.introspection.table_names():
                from apps.configuration.models import Assurance
                if Assurance.objects.count() == 0:
                    from django.core.management import call_command
                    call_command("populate_assurances", verbosity=0)
        except Exception:
            # Ne pas bloquer le démarrage en cas d'erreur
            pass
