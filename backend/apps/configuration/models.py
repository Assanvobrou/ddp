"""
Module Configuration — Modèles
Ordre obligatoire : Service → Assurance → Prestation → ParametresClinique
"""
import uuid
from django.db import models


class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=20, unique=True, verbose_name="Code")
    nom = models.CharField(max_length=100, verbose_name="Nom")
    description = models.TextField(blank=True, verbose_name="Description")
    ordre = models.PositiveIntegerField(default=0, verbose_name="Ordre")
    actif = models.BooleanField(default=True, verbose_name="Actif")

    class Meta:
        db_table = "ddp_services"
        ordering = ["ordre", "nom"]
        verbose_name = "Service"
        verbose_name_plural = "Services"

    def __str__(self):
        return self.nom


class Assurance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=150, verbose_name="Nom")
    code = models.CharField(max_length=20, unique=True, verbose_name="Code")
    description = models.TextField(blank=True, verbose_name="Description")
    taux_defaut = models.DecimalField(
        max_digits=5, decimal_places=2, default=70,
        verbose_name="Taux par défaut (%)"
    )
    actif = models.BooleanField(default=True, verbose_name="Actif")

    class Meta:
        db_table = "ddp_assurances"
        ordering = ["nom"]
        verbose_name = "Assurance"
        verbose_name_plural = "Assurances"

    def __str__(self):
        return f"{self.nom} ({self.taux_defaut}%)"


class Prestation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=150, verbose_name="Libellé")
    service = models.ForeignKey(
        Service, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="prestations",
        verbose_name="Service"
    )
    prix = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Prix (FCFA)"
    )
    prise_en_charge_assurance = models.BooleanField(
        default=False, verbose_name="Prise en charge assurance"
    )
    # taux_assurance retiré — le taux vient de l'assurance du patient
    ordre = models.PositiveIntegerField(default=0, verbose_name="Ordre d'affichage")
    actif = models.BooleanField(default=True, verbose_name="Actif")
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ddp_prestations"
        ordering = ["ordre", "nom"]
        verbose_name = "Prestation"
        verbose_name_plural = "Prestations"

    def __str__(self):
        return f"{self.nom} — {self.prix} FCFA"


class ParametresClinique(models.Model):
    nom = models.CharField(max_length=200, default="Ma Clinique", verbose_name="Nom")
    slogan = models.CharField(max_length=300, blank=True, verbose_name="Slogan")
    adresse = models.TextField(blank=True, verbose_name="Adresse")
    telephone = models.CharField(max_length=50, blank=True, verbose_name="Téléphone")
    email = models.EmailField(blank=True, verbose_name="Email")
    site_web = models.URLField(blank=True, verbose_name="Site web")
    logo = models.ImageField(upload_to="clinique/", null=True, blank=True, verbose_name="Logo")
    monnaie = models.CharField(max_length=10, default="FCFA", verbose_name="Monnaie")
    informations_legales = models.TextField(blank=True, verbose_name="Informations légales")
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ddp_parametres_clinique"
        verbose_name = "Paramètres clinique"

    def __str__(self):
        return self.nom
