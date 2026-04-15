import logging
from decimal import Decimal
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend

from apps.authentication.models import AuditLog
from core.permissions import (
    HasCaisseModule, CanEnregistrerPatient, CanEditerFichePaiement,
    CanVoirDashboardRecettes, CanGererCaisse,
)
from .models import SessionCaisse, Patient, FichePaiement
from .serializers import (
    SessionCaisseSerializer, OuvertureCaisseSerializer,
    FermetureCaisseSerializer, ValidationVersementSerializer,
    RecapitulatifFermetureSerializer,
    PatientSerializer, FichePaiementListSerializer,
    FichePaiementCreateSerializer, FichePaiementUpdateSerializer,
    DashboardRecettesSerializer,
)
from .filters import FichePaiementFilter, SessionCaisseFilter

logger = logging.getLogger("apps.caisse")


# ── SESSION CAISSE ─────────────────────────────────────────────────────────────

class StatutCaisseView(APIView):
    """GET /caisse/statut — état de la session courante."""
    permission_classes = [permissions.IsAuthenticated, HasCaisseModule]

    def get(self, request):
        session = SessionCaisse.objects.filter(
            statut=SessionCaisse.OUVERTE
        ).select_related("ouverte_par").first()
        if session:
            return Response({
                "success": True,
                "ouverte": True,
                "session": SessionCaisseSerializer(session).data,
            })
        return Response({"success": True, "ouverte": False, "session": None})


class OuvrirCaisseView(APIView):
    """POST /caisse/ouvrir — ouvre une nouvelle session."""
    permission_classes = [permissions.IsAuthenticated, HasCaisseModule, CanGererCaisse]

    def post(self, request):
        # Vérifier qu'aucune session n'est déjà ouverte aujourd'hui
        today = timezone.localdate()
        if SessionCaisse.objects.filter(date_session=today).exists():
            return Response(
                {"success": False, "erreur": "Une session existe déjà pour aujourd'hui."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = SessionCaisse.objects.create(ouverte_par=request.user)
        AuditLog.log(request.user, "ouverture_caisse",
                     details={"session_id": str(session.id), "date": str(today)},
                     request=request)
        return Response({
            "success": True,
            "message": "Caisse ouverte.",
            "session": SessionCaisseSerializer(session).data,
        }, status=status.HTTP_201_CREATED)


class RecapitulatifFermetureView(APIView):
    """GET /caisse/recapitulatif — récap avant fermeture (protège la caissière)."""
    permission_classes = [permissions.IsAuthenticated, HasCaisseModule, CanGererCaisse]

    def get(self, request):
        session = SessionCaisse.objects.filter(
            statut=SessionCaisse.OUVERTE
        ).prefetch_related(
            "fiches_paiement__patient",
            "fiches_paiement__prestation"
        ).first()

        if not session:
            return Response(
                {"success": False, "erreur": "Aucune caisse ouverte."},
                status=status.HTTP_404_NOT_FOUND,
            )

        session.calculer_montant_systeme()
        serializer = RecapitulatifFermetureSerializer(session)
        return Response({"success": True, "data": serializer.data})


class FermerCaisseView(APIView):
    """POST /caisse/fermer — ferme la session (étape 1)."""
    permission_classes = [permissions.IsAuthenticated, HasCaisseModule, CanGererCaisse]

    def post(self, request):
        session = SessionCaisse.objects.filter(
            statut=SessionCaisse.OUVERTE
        ).first()

        if not session:
            return Response(
                {"success": False, "erreur": "Aucune caisse ouverte."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FermetureCaisseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "erreur": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.fermer(
            montant_compte=serializer.validated_data["montant_compte"],
            justificatif=serializer.validated_data.get("justificatif", ""),
        )

        AuditLog.log(
            request.user, "fermeture_caisse",
            details={
                "session_id": str(session.id),
                "montant_systeme": str(session.montant_systeme),
                "montant_compte": str(session.montant_compte),
                "ecart": str(session.ecart),
            },
            request=request,
        )

        return Response({
            "success": True,
            "message": "Caisse fermée. En attente de validation comptable.",
            "session": SessionCaisseSerializer(session).data,
        })


class VersementsEnAttenteView(generics.ListAPIView):
    """GET /caisse/versements — liste les sessions en attente de validation."""
    permission_classes = [permissions.IsAuthenticated, CanVoirDashboardRecettes]
    serializer_class = SessionCaisseSerializer

    def get_queryset(self):
        return SessionCaisse.objects.filter(
            statut=SessionCaisse.EN_ATTENTE
        ).select_related("ouverte_par").order_by("-date_session")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        return Response({
            "success": True,
            "count": qs.count(),
            "data": SessionCaisseSerializer(qs, many=True).data,
        })


class ValiderVersementView(APIView):
    """POST /caisse/versements/<id>/valider — valide le versement (comptable)."""
    permission_classes = [permissions.IsAuthenticated, CanVoirDashboardRecettes]

    def post(self, request, pk):
        try:
            session = SessionCaisse.objects.get(pk=pk, statut=SessionCaisse.EN_ATTENTE)
        except SessionCaisse.DoesNotExist:
            return Response(
                {"success": False, "erreur": "Session introuvable ou déjà validée."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ValidationVersementSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "erreur": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.valider(
            comptable=request.user,
            montant_recu=serializer.validated_data["montant_recu"],
            note=serializer.validated_data.get("note", ""),
        )

        AuditLog.log(
            request.user, "validation_versement",
            details={
                "session_id": str(session.id),
                "montant_recu": str(session.montant_recu_comptable),
                "ecart_comptable": str(session.ecart_comptable),
            },
            request=request,
        )

        return Response({
            "success": True,
            "message": "Versement validé.",
            "session": SessionCaisseSerializer(session).data,
        })


class SessionsHistoriqueView(generics.ListAPIView):
    """GET /caisse/sessions — historique complet des sessions."""
    permission_classes = [permissions.IsAuthenticated, CanVoirDashboardRecettes]
    serializer_class = SessionCaisseSerializer
    filterset_class = SessionCaisseFilter

    def get_queryset(self):
        return SessionCaisse.objects.select_related(
            "ouverte_par", "valide_par"
        ).order_by("-date_session")

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        return Response({
            "success": True,
            "count": qs.count(),
            "data": SessionCaisseSerializer(qs, many=True).data,
        })


# ── PATIENTS ───────────────────────────────────────────────────────────────────

class PatientListCreateView(generics.ListCreateAPIView):
    """GET/POST /caisse/patients"""
    permission_classes = [permissions.IsAuthenticated, HasCaisseModule]
    serializer_class = PatientSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), HasCaisseModule(), CanEnregistrerPatient()]
        return super().get_permissions()

    def get_queryset(self):
        return Patient.objects.select_related(
            "assurance", "enregistre_par", "session"
        ).order_by("-date_enregistrement")

    def perform_create(self, serializer):
        session = SessionCaisse.objects.filter(statut=SessionCaisse.OUVERTE).first()
        if not session:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Caisse fermée. Impossible d'enregistrer un patient.")

        patient = serializer.save(
            enregistre_par=self.request.user,
            session=session,
        )
        AuditLog.log(
            self.request.user, "enregistrement_patient",
            details={"patient_id": str(patient.id), "dossier": patient.numero_dossier},
            request=self.request,
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        # Filtre session du jour si pas super admin
        session_id = request.query_params.get("session")
        if session_id:
            qs = qs.filter(session__id=session_id)
        serializer = PatientSerializer(qs, many=True)
        return Response({"success": True, "count": qs.count(), "data": serializer.data})


class PatientDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /caisse/patients/<id>"""
    permission_classes = [permissions.IsAuthenticated, HasCaisseModule, CanEditerFichePaiement]
    queryset = Patient.objects.select_related("assurance", "enregistre_par")

    def get_serializer_class(self):
        return PatientSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({"success": True, "data": PatientSerializer(instance).data})


# ── FICHES PAIEMENT ────────────────────────────────────────────────────────────

class FichePaiementListCreateView(generics.ListCreateAPIView):
    """GET/POST /caisse/fiches"""
    permission_classes = [permissions.IsAuthenticated, HasCaisseModule]
    filterset_class = FichePaiementFilter

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), HasCaisseModule(), CanEnregistrerPatient()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return FichePaiementCreateSerializer
        return FichePaiementListSerializer

    def get_queryset(self):
        return FichePaiement.objects.select_related(
            "patient", "prestation", "session", "creee_par"
        ).order_by("-date_creation")

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        return Response({
            "success": True,
            "count": qs.count(),
            "data": FichePaiementListSerializer(qs, many=True).data,
        })

    def perform_create(self, serializer):
        fiche = serializer.save()
        AuditLog.log(
            self.request.user, "enregistrement_patient",
            details={"fiche_id": str(fiche.id)},
            request=self.request,
        )


class FichePaiementDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /caisse/fiches/<id>"""
    permission_classes = [permissions.IsAuthenticated, HasCaisseModule, CanEditerFichePaiement]
    queryset = FichePaiement.objects.select_related("patient", "prestation", "session")

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return FichePaiementUpdateSerializer
        return FichePaiementListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({"success": True, "data": FichePaiementListSerializer(instance).data})

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        response = super().update(request, *args, **kwargs)
        AuditLog.log(request.user, "modification_fiche",
                     details={"fiche_id": str(kwargs.get("pk"))}, request=request)
        return Response({"success": True, "data": response.data})


# ── DASHBOARD RECETTES ─────────────────────────────────────────────────────────

class DashboardRecettesView(APIView):
    """GET /caisse/dashboard — tableau de bord des recettes (Comptable/Directrice)."""
    permission_classes = [permissions.IsAuthenticated, CanVoirDashboardRecettes]

    def get(self, request):
        # Filtres
        date_debut = request.query_params.get("date_debut")
        date_fin = request.query_params.get("date_fin")
        prestation_id = request.query_params.get("prestation")
        caissiere_id = request.query_params.get("caissiere")

        qs = FichePaiement.objects.select_related("prestation", "session", "creee_par")

        if date_debut:
            qs = qs.filter(date_creation__date__gte=date_debut)
        if date_fin:
            qs = qs.filter(date_creation__date__lte=date_fin)
        if prestation_id:
            qs = qs.filter(prestation__id=prestation_id)
        if caissiere_id:
            qs = qs.filter(creee_par__id=caissiere_id)

        # Agrégats globaux
        totaux = qs.aggregate(
            total_recettes=Sum("montant_total") or Decimal("0"),
            total_patient=Sum("montant_patient") or Decimal("0"),
            total_assurance=Sum("montant_assurance") or Decimal("0"),
            nb_fiches=Count("id"),
        )

        # Par prestation
        par_prestation = list(
            qs.values(
                nom_prestation=F("prestation__nom"),
                emoji_prestation=F("prestation__emoji"),
            ).annotate(
                nb=Count("id"),
                total=Sum("montant_total"),
                total_patient=Sum("montant_patient"),
                total_assurance=Sum("montant_assurance"),
            ).order_by("-total")
        )

        # Par jour
        par_jour = list(
            qs.values(jour=F("date_creation__date"))
            .annotate(total=Sum("montant_patient"), nb=Count("id"))
            .order_by("jour")
        )

        # Sessions sur la période
        sessions_qs = SessionCaisse.objects.select_related("ouverte_par")
        if date_debut:
            sessions_qs = sessions_qs.filter(date_session__gte=date_debut)
        if date_fin:
            sessions_qs = sessions_qs.filter(date_session__lte=date_fin)
        if caissiere_id:
            sessions_qs = sessions_qs.filter(ouverte_par__id=caissiere_id)

        return Response({
            "success": True,
            "data": {
                **{k: str(v) if v else "0" for k, v in totaux.items()},
                "nb_patients": Patient.objects.filter(
                    session__fiches_paiement__in=qs
                ).distinct().count(),
                "par_prestation": par_prestation,
                "par_jour": par_jour,
                "sessions": SessionCaisseSerializer(
                    sessions_qs.order_by("-date_session")[:30], many=True
                ).data,
            }
        })
