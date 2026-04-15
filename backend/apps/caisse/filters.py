import django_filters
from .models import FichePaiement, SessionCaisse


class FichePaiementFilter(django_filters.FilterSet):
    date_debut = django_filters.DateFilter(
        field_name="date_creation__date", lookup_expr="gte"
    )
    date_fin = django_filters.DateFilter(
        field_name="date_creation__date", lookup_expr="lte"
    )
    prestation = django_filters.UUIDFilter(field_name="prestation__id")
    session = django_filters.UUIDFilter(field_name="session__id")
    statut = django_filters.ChoiceFilter(choices=FichePaiement.STATUTS)
    caissiere = django_filters.UUIDFilter(field_name="creee_par__id")

    class Meta:
        model = FichePaiement
        fields = ["date_debut", "date_fin", "prestation", "session", "statut", "caissiere"]


class SessionCaisseFilter(django_filters.FilterSet):
    date_debut = django_filters.DateFilter(field_name="date_session", lookup_expr="gte")
    date_fin = django_filters.DateFilter(field_name="date_session", lookup_expr="lte")
    statut = django_filters.ChoiceFilter(choices=SessionCaisse.STATUTS)
    caissiere = django_filters.UUIDFilter(field_name="ouverte_par__id")

    class Meta:
        model = SessionCaisse
        fields = ["date_debut", "date_fin", "statut", "caissiere"]
