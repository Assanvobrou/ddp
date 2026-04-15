import logging
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from core.permissions import (
    HasConfigModule, CanGererPrestations,
    CanGererAssurances, CanGererParametres,
)
from .models import Assurance, Prestation, Service, ParametresClinique
from .serializers import (
    AssuranceSerializer, PrestationSerializer,
    ServiceSerializer, ParametresCliniqueSerializer
)

logger = logging.getLogger("apps.configuration")


# ── SERVICES ──────────────────────────────────────────────────────────────────

class ServiceListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), HasConfigModule(), CanGererPrestations()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Service.objects.all()
        if self.request.query_params.get("actif") is None:
            qs = qs.filter(actif=True)
        return qs.order_by("ordre", "nom")

    def list(self, request, *args, **kwargs):
        return Response({"success": True, "data": ServiceSerializer(self.get_queryset(), many=True).data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response({"success": True, "data": ServiceSerializer(instance).data}, status=status.HTTP_201_CREATED)


class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated, HasConfigModule, CanGererPrestations]

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.actif = False
        obj.save(update_fields=["actif"])
        return Response({"success": True, "message": "Service désactivé."})

    def retrieve(self, request, *args, **kwargs):
        return Response({"success": True, "data": ServiceSerializer(self.get_object()).data})

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "data": serializer.data})


# ── ASSURANCES ────────────────────────────────────────────────────────────────

class AssuranceListCreateView(generics.ListCreateAPIView):
    serializer_class = AssuranceSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), HasConfigModule(), CanGererAssurances()]
        # Lecture accessible à tous les authentifiés (pour le formulaire patient)
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Assurance.objects.all()
        # Si pas admin de config, ne retourner que les actives
        if self.request.method == "GET":
            actif_param = self.request.query_params.get("actif")
            if actif_param is None:
                qs = qs.filter(actif=True)
        return qs.order_by("nom")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        return Response({"success": True, "data": AssuranceSerializer(qs, many=True).data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            {"success": True, "data": AssuranceSerializer(instance).data},
            status=status.HTTP_201_CREATED,
        )


class AssuranceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Assurance.objects.all()
    serializer_class = AssuranceSerializer
    permission_classes = [permissions.IsAuthenticated, HasConfigModule, CanGererAssurances]

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.actif = False
        obj.save(update_fields=["actif"])
        return Response({"success": True, "message": "Assurance désactivée."})

    def retrieve(self, request, *args, **kwargs):
        return Response({"success": True, "data": AssuranceSerializer(self.get_object()).data})

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "data": serializer.data})


# ── PRESTATIONS ───────────────────────────────────────────────────────────────

class PrestationListCreateView(generics.ListCreateAPIView):
    serializer_class = PrestationSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), HasConfigModule(), CanGererPrestations()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Prestation.objects.all()
        if self.request.query_params.get("actif") is None:
            qs = qs.filter(actif=True)
        # Filtre par service
        service_id = self.request.query_params.get("service")
        if service_id:
            qs = qs.filter(service__id=service_id)
        return qs.order_by("ordre", "nom")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        return Response({"success": True, "data": PrestationSerializer(qs, many=True).data})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(
            {"success": True, "data": PrestationSerializer(instance).data},
            status=status.HTTP_201_CREATED,
        )


class PrestationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Prestation.objects.all()
    serializer_class = PrestationSerializer
    permission_classes = [permissions.IsAuthenticated, HasConfigModule, CanGererPrestations]

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.actif = False
        obj.save(update_fields=["actif"])
        return Response({"success": True, "message": "Prestation désactivée."})

    def retrieve(self, request, *args, **kwargs):
        return Response({"success": True, "data": PrestationSerializer(self.get_object()).data})

    def update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "data": serializer.data})


# ── PARAMÈTRES CLINIQUE ───────────────────────────────────────────────────────

class ParametresCliniqueView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), HasConfigModule(), CanGererParametres()]

    def get(self, request):
        params = ParametresClinique.get()
        return Response({
            "success": True,
            "data": ParametresCliniqueSerializer(params).data
        })

    def patch(self, request):
        params = ParametresClinique.get()
        serializer = ParametresCliniqueSerializer(params, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "data": serializer.data})
