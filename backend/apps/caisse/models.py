"""
Module Caisse — Modèles
- SessionCaisse : ouverture/fermeture avec workflow de versement
- Patient : dossier patient
- FichePaiement : paiement lié à un patient et une prestation
"""
import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings


class SessionCaisse(models.Model):
    """Session de caisse journalière avec workflow de clôture comptable."""

    OUVERTE = "ouverte"
    EN_ATTENTE = "en_attente"
    VALIDEE = "validee"

    STATUTS = [
        (OUVERTE, "Ouverte"),
        (EN_ATTENTE, "En attente de validation"),
        (VALIDEE, "Validée"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Ouverture
    ouverte_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="sessions_ouvertes", verbose_name="Ouverte par"
    )
    ouverte_le = models.DateTimeField(default=timezone.now, verbose_name="Date d'ouverture")
    date_session = models.DateField(default=timezone.localdate, unique=True, verbose_name="Date")

    # Fermeture — étape 1 (caissière)
    fermee_le = models.DateTimeField(null=True, blank=True, verbose_name="Date de fermeture")
    montant_systeme = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name="Montant système (calculé)"
    )
    montant_compte = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        verbose_name="Montant compté (caissière)"
    )
    ecart = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        verbose_name="Écart"
    )
    justificatif_caissiere = models.TextField(
        blank=True, verbose_name="Justificatif caissière"
    )

    # Validation — étape 2 (comptable)
    valide_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="sessions_validees", verbose_name="Validé par"
    )
    valide_le = models.DateTimeField(null=True, blank=True, verbose_name="Date de validation")
    montant_recu_comptable = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        verbose_name="Montant reçu (comptable)"
    )
    ecart_comptable = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        verbose_name="Écart côté comptable"
    )
    note_comptable = models.TextField(blank=True, verbose_name="Note comptable")

    statut = models.CharField(
        max_length=20, choices=STATUTS, default=OUVERTE, verbose_name="Statut"
    )

    class Meta:
        db_table = "ddp_sessions_caisse"
        ordering = ["-date_session"]
        verbose_name = "Session de caisse"
        verbose_name_plural = "Sessions de caisse"

    def __str__(self):
        return f"Session {self.date_session} — {self.get_statut_display()}"

    def calculer_montant_systeme(self):
        """Recalcule le montant total depuis les fiches de paiement."""
        from django.db.models import Sum
        total = self.fiches_paiement.filter(
            statut__in=[FichePaiement.PAYE, FichePaiement.ASSURANCE]
        ).aggregate(total=Sum("montant_patient"))["total"] or 0
        self.montant_systeme = total
        self.save(update_fields=["montant_systeme"])
        return total

    def fermer(self, montant_compte, justificatif=""):
        """Ferme la session et calcule l'écart."""
        self.calculer_montant_systeme()
        self.montant_compte = montant_compte
        self.ecart = montant_compte - self.montant_systeme
        self.justificatif_caissiere = justificatif
        self.fermee_le = timezone.now()
        self.statut = self.EN_ATTENTE
        self.save()

    def valider(self, comptable, montant_recu, note=""):
        """Valide la session côté comptable."""
        self.valide_par = comptable
        self.valide_le = timezone.now()
        self.montant_recu_comptable = montant_recu
        self.ecart_comptable = montant_recu - (self.montant_compte or 0)
        self.note_comptable = note
        self.statut = self.VALIDEE
        self.save()

    @property
    def est_ouverte(self):
        return self.statut == self.OUVERTE


class Patient(models.Model):
    """Dossier patient enregistré à la caisse."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_dossier = models.CharField(
        max_length=20, unique=True, verbose_name="Numéro de dossier"
    )
    nom = models.CharField(max_length=100, verbose_name="Nom")
    prenom = models.CharField(max_length=100, verbose_name="Prénom")
    date_naissance = models.DateField(null=True, blank=True, verbose_name="Date de naissance")
    age = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name="Âge")
    telephone = models.CharField(max_length=20, blank=True, verbose_name="Téléphone")
    domicile = models.CharField(max_length=200, blank=True, verbose_name="Domicile")
    sexe = models.CharField(
        max_length=1,
        choices=[("M", "Masculin"), ("F", "Féminin"), ("A", "Autre")],
        default="M", verbose_name="Sexe"
    )

    # Assurance
    a_assurance = models.BooleanField(default=False, verbose_name="Assuré")
    assurance = models.ForeignKey(
        "configuration.Assurance", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="patients",
        verbose_name="Assurance"
    )
    numero_assurance = models.CharField(
        max_length=50, blank=True, verbose_name="Numéro d'assurance"
    )

    enregistre_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="patients_enregistres", verbose_name="Enregistré par"
    )
    session = models.ForeignKey(
        SessionCaisse, on_delete=models.PROTECT,
        related_name="patients", verbose_name="Session de caisse"
    )
    date_enregistrement = models.DateTimeField(
        default=timezone.now, verbose_name="Date d'enregistrement"
    )

    class Meta:
        db_table = "ddp_patients"
        ordering = ["-date_enregistrement"]
        verbose_name = "Patient"
        verbose_name_plural = "Patients"

    def __str__(self):
        return f"{self.prenom} {self.nom} — {self.numero_dossier}"

    def save(self, *args, **kwargs):
        if not self.numero_dossier:
            self.numero_dossier = self._generer_numero()
        super().save(*args, **kwargs)

    @staticmethod
    def _generer_numero():
        from django.utils import timezone as tz
        import random
        annee = tz.localdate().year
        sequence = Patient.objects.filter(
            date_enregistrement__year=annee
        ).count() + 1
        return f"DDP{annee}{sequence:05d}"


class FichePaiement(models.Model):
    """Fiche de paiement liée à un patient et une prestation."""

    PAYE = "paye"
    EN_ATTENTE = "en_attente"
    ASSURANCE = "assurance"

    STATUTS = [
        (PAYE, "Payé"),
        (EN_ATTENTE, "En attente"),
        (ASSURANCE, "Prise en charge assurance"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        Patient, on_delete=models.PROTECT,
        related_name="fiches_paiement", verbose_name="Patient"
    )
    prestation = models.ForeignKey(
        "configuration.Prestation", on_delete=models.PROTECT,
        related_name="fiches_paiement", verbose_name="Prestation"
    )
    service = models.ForeignKey(
        "configuration.Service", on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="fiches_paiement", verbose_name="Service"
    )
    session = models.ForeignKey(
        SessionCaisse, on_delete=models.PROTECT,
        related_name="fiches_paiement", verbose_name="Session"
    )

    # Montants (calculés à l'enregistrement, figés ensuite)
    prix_unitaire = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Prix unitaire"
    )
    quantite = models.PositiveSmallIntegerField(default=1, verbose_name="Quantité")
    montant_total = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Montant total"
    )
    taux_assurance = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="Taux assurance (%)"
    )
    montant_assurance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        verbose_name="Montant assurance"
    )
    montant_patient = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Montant patient"
    )

    statut = models.CharField(
        max_length=20, choices=STATUTS, default=EN_ATTENTE,
        verbose_name="Statut"
    )
    notes = models.TextField(blank=True, verbose_name="Notes")

    creee_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="fiches_creees", verbose_name="Créée par"
    )
    date_creation = models.DateTimeField(default=timezone.now)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ddp_fiches_paiement"
        ordering = ["-date_creation"]
        verbose_name = "Fiche de paiement"
        verbose_name_plural = "Fiches de paiement"

    def __str__(self):
        return f"Fiche {self.patient} — {self.prestation} — {self.montant_total} FCFA"

    def save(self, *args, **kwargs):
        # Calcul automatique des montants
        self.montant_total = self.prix_unitaire * self.quantite
        self.montant_assurance = (self.montant_total * self.taux_assurance / 100).quantize(
            __import__("decimal").Decimal("0.01")
        )
        self.montant_patient = self.montant_total - self.montant_assurance

        # Statut auto selon assurance
        if self.taux_assurance > 0 and self.patient.a_assurance:
            if self.taux_assurance == 100:
                self.statut = self.ASSURANCE
        super().save(*args, **kwargs)
