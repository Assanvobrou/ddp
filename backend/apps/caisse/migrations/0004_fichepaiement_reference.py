from django.db import migrations, models


def generer_references(apps, schema_editor):
    """Génère une référence unique pour chaque fiche existante."""
    FichePaiement = apps.get_model('caisse', 'FichePaiement')
    for fiche in FichePaiement.objects.all():
        fiche.reference = f"FICHE-{fiche.date_creation.year}-{fiche.id.hex[:8].upper()}"
        fiche.save(update_fields=['reference'])


class Migration(migrations.Migration):

    dependencies = [
        ('caisse', '0003_alter_fichepaiement_session_alter_patient_session'),
    ]

    operations = [
        # Étape 1 : ajouter la colonne sans contrainte unique
        migrations.AddField(
            model_name='fichepaiement',
            name='reference',
            field=models.CharField(blank=True, default='', max_length=30, verbose_name='Référence du reçu'),
        ),
        # Étape 2 : remplir les références existantes
        migrations.RunPython(generer_references, migrations.RunPython.noop),
        # Étape 3 : appliquer la contrainte unique maintenant que toutes les lignes ont une valeur
        migrations.AlterField(
            model_name='fichepaiement',
            name='reference',
            field=models.CharField(blank=True, max_length=30, unique=True, verbose_name='Référence du reçu'),
        ),
    ]
