from rest_framework import serializers
from django.utils import timezone
from .models import SessionCaisse, Patient, FichePaiement


class SessionCaisseSerializer(serializers.ModelSerializer):
    ouverte_par_nom = serializers.CharField(
        source="ouverte_par.nom_complet", read_only=True
    )
    valide_par_nom = serializers.CharField(
        source="valide_par.nom_complet", read_only=True
    )
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    nb_patients = serializers.SerializerMethodField()
    nb_fiches = serializers.SerializerMethodField()

    class Meta:
        model = SessionCaisse
        fields = [
            "id", "date_session", "statut", "statut_display",
            "ouverte_par", "ouverte_par_nom", "ouverte_le",
            "fermee_le", "montant_systeme", "montant_compte",
            "ecart", "justificatif_caissiere",
            "valide_par", "valide_par_nom", "valide_le",
            "montant_recu_comptable", "ecart_comptable", "note_comptable",
            "nb_patients", "nb_fiches",
        ]
        read_only_fields = [
            "id", "montant_systeme", "ecart", "statut",
            "ouverte_par", "ouverte_le", "valide_par", "valide_le",
        ]

    def get_nb_patients(self, obj):
        return obj.patients.count()

    def get_nb_fiches(self, obj):
        return obj.fiches_paiement.count()


class OuvertureCaisseSerializer(serializers.Serializer):
    """Aucune donnée requise pour l'ouverture."""
    pass


class FermetureCaisseSerializer(serializers.Serializer):
    montant_compte = serializers.DecimalField(
        max_digits=14, decimal_places=2,
        min_value=0,
    )
    justificatif = serializers.CharField(
        max_length=1000, required=False, allow_blank=True, default=""
    )

    def validate_montant_compte(self, value):
        if value < 0:
            raise serializers.ValidationError("Le montant ne peut pas être négatif.")
        return value


class ValidationVersementSerializer(serializers.Serializer):
    montant_recu = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=0)
    note = serializers.CharField(max_length=1000, required=False, allow_blank=True, default="")


class RecapitulatifFermetureSerializer(serializers.ModelSerializer):
    """Récapitulatif détaillé pour la caissière à la fermeture."""
    fiches = serializers.SerializerMethodField()
    totaux_par_prestation = serializers.SerializerMethodField()
    totaux_par_statut = serializers.SerializerMethodField()
    ouverte_par_nom = serializers.CharField(source="ouverte_par.nom_complet", read_only=True)

    class Meta:
        model = SessionCaisse
        fields = [
            "id", "date_session", "ouverte_le", "ouverte_par_nom",
            "montant_systeme", "fiches",
            "totaux_par_prestation", "totaux_par_statut",
        ]

    def get_fiches(self, obj):
        return FichePaiementListSerializer(
            obj.fiches_paiement.select_related("patient", "prestation"),
            many=True
        ).data

    def get_totaux_par_prestation(self, obj):
        from django.db.models import Sum, Count
        return list(
            obj.fiches_paiement.values(
                nom=models.F("prestation__nom"),
                emoji=models.F("prestation__emoji"),
            ).annotate(
                nb=Count("id"),
                total=Sum("montant_total"),
                total_patient=Sum("montant_patient"),
                total_assurance=Sum("montant_assurance"),
            )
        )

    def get_totaux_par_statut(self, obj):
        from django.db.models import Sum, Count
        return {
            statut: obj.fiches_paiement.filter(statut=statut).aggregate(
                nb=Count("id"), total=Sum("montant_patient")
            )
            for statut, _ in FichePaiement.STATUTS
        }


# Import nécessaire pour RecapitulatifFermetureSerializer
import django.db.models as models


class PatientSerializer(serializers.ModelSerializer):
    assurance_nom = serializers.CharField(source="assurance.nom", read_only=True)
    enregistre_par_nom = serializers.CharField(
        source="enregistre_par.nom_complet", read_only=True
    )
    sexe_display = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "id", "numero_dossier", "nom", "prenom", "sexe", "sexe_display",
            "date_naissance", "age", "telephone", "domicile",
            "a_assurance", "assurance", "assurance_nom", "numero_assurance",
            "enregistre_par", "enregistre_par_nom",
            "date_enregistrement",
        ]
        read_only_fields = [
            "id", "numero_dossier", "enregistre_par", "date_enregistrement"
        ]

    def get_sexe_display(self, obj):
        return {"M": "Masculin", "F": "Féminin", "A": "Autre"}.get(obj.sexe, obj.sexe)

    def validate(self, attrs):
        if not attrs.get("date_naissance") and not attrs.get("age"):
            raise serializers.ValidationError("Fournir la date de naissance OU l'âge.")
        if attrs.get("a_assurance") and not attrs.get("assurance"):
            raise serializers.ValidationError({"assurance": "Sélectionner un organisme d'assurance."})
        if attrs.get("a_assurance") and not attrs.get("numero_assurance"):
            raise serializers.ValidationError({"numero_assurance": "Le numéro d'assurance est requis."})
        return attrs


class FichePaiementListSerializer(serializers.ModelSerializer):
    patient_nom = serializers.SerializerMethodField()
    patient_code = serializers.CharField(source="patient.numero_dossier", read_only=True)
    prestation_nom = serializers.CharField(source="prestation.nom", read_only=True)
    service_nom = serializers.CharField(source="service.nom", read_only=True)
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)

    class Meta:
        model = FichePaiement
        fields = [
            "id", "patient", "patient_nom", "patient_code",
            "prestation", "prestation_nom",
            "service", "service_nom",
            "prix_unitaire", "quantite", "montant_total",
            "taux_assurance", "montant_assurance", "montant_patient",
            "statut", "statut_display", "notes", "date_creation",
        ]

    def get_patient_nom(self, obj):
        return f"{obj.patient.prenom} {obj.patient.nom}" 


class FichePaiementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichePaiement
        fields = ["patient", "prestation", "service", "quantite", "statut", "notes"]

    def create(self, validated_data):
        prestation = validated_data["prestation"]
        patient = validated_data["patient"]

        taux_assurance = 0
        if patient.a_assurance and prestation.prise_en_charge_assurance:
            taux_assurance = prestation.taux_assurance

        session = SessionCaisse.objects.filter(statut=SessionCaisse.OUVERTE).first()

        fiche = FichePaiement(
            **validated_data,
            session=session,
            prix_unitaire=prestation.prix,
            taux_assurance=taux_assurance,
            creee_par=self.context["request"].user,
        )
        fiche.save()
        return fiche


class FichePaiementUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichePaiement
        fields = ["statut", "notes", "quantite"]

    def validate(self, attrs):
        # Impossible de modifier si session fermée
        if self.instance and self.instance.session.statut != SessionCaisse.OUVERTE:
            raise serializers.ValidationError(
                "Impossible de modifier une fiche après fermeture de caisse."
            )
        return attrs


class DashboardRecettesSerializer(serializers.Serializer):
    """Agrégat pour le tableau de bord recettes."""
    total_recettes = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_patient = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_assurance = serializers.DecimalField(max_digits=14, decimal_places=2)
    nb_patients = serializers.IntegerField()
    nb_fiches = serializers.IntegerField()
    par_prestation = serializers.ListField()
    par_jour = serializers.ListField()
    sessions = serializers.ListField()
