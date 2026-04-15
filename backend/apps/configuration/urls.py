from django.urls import path
from .views import (
    ServiceListCreateView, ServiceDetailView,
    AssuranceListCreateView, AssuranceDetailView,
    PrestationListCreateView, PrestationDetailView,
    ParametresCliniqueView,
)

urlpatterns = [
    path("services/", ServiceListCreateView.as_view(), name="service-list-create"),
    path("services/<uuid:pk>/", ServiceDetailView.as_view(), name="service-detail"),
    path("assurances/", AssuranceListCreateView.as_view(), name="assurance-list-create"),
    path("assurances/<uuid:pk>/", AssuranceDetailView.as_view(), name="assurance-detail"),
    path("prestations/", PrestationListCreateView.as_view(), name="prestation-list-create"),
    path("prestations/<uuid:pk>/", PrestationDetailView.as_view(), name="prestation-detail"),
    path("parametres/", ParametresCliniqueView.as_view(), name="parametres-clinique"),
]
