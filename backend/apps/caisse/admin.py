from django.contrib import admin
from .models import SessionCaisse, Patient, FichePaiement


@admin.register(SessionCaisse)
class SessionCaisseAdmin(admin.ModelAdmin):
    list_display = ["date_session", "ouverte_par", "statut", "montant_systeme", "montant_compte", "ecart"]
    list_filter = ["statut"]
    readonly_fields = ["id", "montant_systeme", "ecart", "ecart_comptable"]
    ordering = ["-date_session"]

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ["numero_dossier", "nom", "prenom", "a_assurance", "date_enregistrement"]
    search_fields = ["nom", "prenom", "numero_dossier", "telephone"]
    list_filter = ["a_assurance"]
    readonly_fields = ["id", "numero_dossier"]


@admin.register(FichePaiement)
class FichePaiementAdmin(admin.ModelAdmin):
    list_display = ["patient", "prestation", "montant_total", "montant_patient", "statut", "date_creation"]
    list_filter = ["statut"]
    readonly_fields = ["id", "montant_total", "montant_assurance", "montant_patient"]
