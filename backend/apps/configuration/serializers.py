from rest_framework import serializers
from .models import Service, Assurance, Prestation, ParametresClinique


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "code", "nom", "description", "ordre", "actif"]
        read_only_fields = ["id"]

    def validate_code(self, value):
        return value.upper().strip()


class AssuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assurance
        fields = ["id", "nom", "code", "description", "taux_defaut", "actif"]
        read_only_fields = ["id"]

    def validate_code(self, value):
        return value.upper().strip()

    def validate_taux_defaut(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Le taux doit être entre 0 et 100.")
        return value


class PrestationSerializer(serializers.ModelSerializer):
    """
    taux_assurance supprimé — le taux vient de l'assurance du patient.
    prise_en_charge_assurance = booléen : cette prestation est-elle remboursable ?
    """
    service_nom = serializers.CharField(source="service.nom", read_only=True)

    class Meta:
        model = Prestation
        fields = [
            "id", "nom", "service", "service_nom", "prix",
            "prise_en_charge_assurance",
            "ordre", "actif", "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "date_creation", "date_modification", "service_nom"]

    def validate_prix(self, value):
        if value < 0:
            raise serializers.ValidationError("Le prix ne peut pas être négatif.")
        return value


class ParametresCliniqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametresClinique
        fields = [
            "nom", "slogan", "adresse", "telephone",
            "email", "site_web", "monnaie", "informations_legales",
        ]
