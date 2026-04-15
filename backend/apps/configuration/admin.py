from django.contrib import admin
from .models import Assurance, Prestation, ParametresClinique


@admin.register(Assurance)
class AssuranceAdmin(admin.ModelAdmin):
    list_display = ["nom", "code", "taux_defaut", "actif"]
    list_editable = ["actif"]


@admin.register(Prestation)
class PrestationAdmin(admin.ModelAdmin):
    list_display = ["emoji", "nom", "prix", "taux_assurance", "ordre", "actif"]
    list_editable = ["actif", "ordre"]
    ordering = ["ordre"]


@admin.register(ParametresClinique)
class ParametresCliniqueAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not ParametresClinique.objects.exists()
