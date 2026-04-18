"""
Management command : populate_assurances
========================================
Crée les assurances maladie ivoiriennes si elles n'existent pas encore.
Appelé automatiquement au démarrage via AppConfig.ready() dans apps.py.

Usage manuel :
    python manage.py populate_assurances

Les assurances existantes ne sont PAS écrasées — leurs taux peuvent être
modifiés librement depuis l'interface Configuration → Assurances.
"""
from django.core.management.base import BaseCommand
from apps.configuration.models import Assurance


ASSURANCES_CI = [
    # (nom, code, taux_defaut, description)
    (
        "CNPS — Caisse Nationale de Prévoyance Sociale",
        "CNPS", 80,
        "Assurance maladie obligatoire des salariés du secteur privé"
    ),
    (
        "MUGEF-CI — Mutuelle Générale des Fonctionnaires",
        "MUGEF", 80,
        "Mutuelle des fonctionnaires et agents de l'État ivoirien"
    ),
    (
        "SOHAM-CI — Société d'Hospitalisation et d'Assurance Maladie",
        "SOHAM", 75,
        "Organisme de prise en charge médicale des agents de l'État"
    ),
    (
        "SNAM-CI — Société Nationale d'Assurance Maladie",
        "SNAM", 70,
        "Assurance maladie complémentaire"
    ),
    (
        "NSIA Assurances Vie CI",
        "NSIA", 70,
        "Branche assurance maladie du groupe NSIA"
    ),
    (
        "SUNU Assurances Vie CI",
        "SUNU", 70,
        "Branche assurance maladie du groupe SUNU"
    ),
    (
        "AXA Assurances CI",
        "AXA", 70,
        "Branche assurance maladie d'AXA Côte d'Ivoire"
    ),
    (
        "Allianz Assurances CI",
        "ALLIANZ", 70,
        "Branche assurance maladie d'Allianz Côte d'Ivoire"
    ),
    (
        "Atlantique Assurances CI",
        "ATLANTIQUE", 70,
        "Filiale ivoirienne d'Atlantique Assurances"
    ),
    (
        "COLINA — Compagnie d'Assurances",
        "COLINA", 70,
        "Ancienne compagnie, intégrée au groupe SUNU"
    ),
    (
        "PRIMA Assurances",
        "PRIMA", 70,
        "Assurance maladie complémentaire"
    ),
    (
        "LOYALE Assurances",
        "LOYALE", 70,
        "Assurance maladie complémentaire"
    ),
]


class Command(BaseCommand):
    help = "Crée les assurances ivoiriennes par défaut (ne modifie pas les existantes)"

    def handle(self, *args, **options):
        created_count = 0
        skipped_count = 0

        for nom, code, taux, description in ASSURANCES_CI:
            assurance, created = Assurance.objects.get_or_create(
                code=code,
                defaults={
                    "nom": nom,
                    "taux_defaut": taux,
                    "description": description if hasattr(Assurance, 'description') else "",
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  ✅ Créée : {code} — {nom} ({taux}%)")
                )
            else:
                skipped_count += 1
                self.stdout.write(f"  — Existante : {code} — {assurance.nom}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\n{created_count} assurance(s) créée(s), {skipped_count} déjà présente(s)."
            )
        )
