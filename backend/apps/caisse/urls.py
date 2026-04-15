from django.urls import path
from .views import (
    StatutCaisseView, OuvrirCaisseView,
    RecapitulatifFermetureView, FermerCaisseView,
    VersementsEnAttenteView, ValiderVersementView,
    SessionsHistoriqueView,
    PatientListCreateView, PatientDetailView,
    FichePaiementListCreateView, FichePaiementDetailView,
    DashboardRecettesView,
)

urlpatterns = [
    # Session caisse
    path("statut/", StatutCaisseView.as_view(), name="caisse-statut"),
    path("ouvrir/", OuvrirCaisseView.as_view(), name="caisse-ouvrir"),
    path("recapitulatif/", RecapitulatifFermetureView.as_view(), name="caisse-recapitulatif"),
    path("fermer/", FermerCaisseView.as_view(), name="caisse-fermer"),
    path("sessions/", SessionsHistoriqueView.as_view(), name="caisse-sessions"),

    # Versements
    path("versements/", VersementsEnAttenteView.as_view(), name="versements-liste"),
    path("versements/<uuid:pk>/valider/", ValiderVersementView.as_view(), name="versement-valider"),

    # Patients
    path("patients/", PatientListCreateView.as_view(), name="patient-list-create"),
    path("patients/<uuid:pk>/", PatientDetailView.as_view(), name="patient-detail"),

    # Fiches paiement
    path("fiches/", FichePaiementListCreateView.as_view(), name="fiche-list-create"),
    path("fiches/<uuid:pk>/", FichePaiementDetailView.as_view(), name="fiche-detail"),

    # Dashboard
    path("dashboard/", DashboardRecettesView.as_view(), name="caisse-dashboard"),
]
