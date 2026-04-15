from rest_framework import serializers
from .models import Assurance, Prestation, Service, ParametresClinique


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "nom", "code", "description", "ordre", "actif"]
        read_only_fields = ["id"]

    def validate_code(self, value):
        return value.upper().strip()


class AssuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assurance
        fields = ["id", "nom", "code", "taux_defaut", "actif", "date_creation"]
        read_only_fields = ["id", "date_creation"]

    def validate_code(self, value):
        return value.upper().strip()

    def validate_taux_defaut(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Le taux doit être entre 0 et 100.")
        return value


class PrestationSerializer(serializers.ModelSerializer):
    service_nom = serializers.CharField(source="service.nom", read_only=True)

    class Meta:
        model = Prestation
        fields = [
            "id", "nom", "emoji", "service", "service_nom", "prix",
            "prise_en_charge_assurance", "taux_assurance",
            "ordre", "actif", "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "date_creation", "date_modification", "service_nom"]

    def validate_prix(self, value):
        if value < 0:
            raise serializers.ValidationError("Le prix ne peut pas être négatif.")
        return value

    def validate_taux_assurance(self, value):
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Le taux doit être entre 0 et 100.")
        return value

    def validate(self, attrs):
        if attrs.get("prise_en_charge_assurance") and not attrs.get("taux_assurance"):
            raise serializers.ValidationError(
                {"taux_assurance": "Définir le taux si prise en charge assurance activée."}
            )
        return attrs


class ParametresCliniqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametresClinique
        fields = [
            "nom", "slogan", "adresse", "telephone", "email",
            "site_web", "logo", "monnaie", "informations_legales",
        ]
