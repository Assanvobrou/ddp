from django.contrib import admin
from .models import Service, Assurance, Prestation, ParametresClinique


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["nom", "code", "ordre", "actif"]
    search_fields = ["nom", "code"]


@admin.register(Assurance)
class AssuranceAdmin(admin.ModelAdmin):
    list_display = ["nom", "code", "taux_defaut", "actif"]
    list_editable = ["actif"]
    search_fields = ["nom", "code"]


@admin.register(Prestation)
class PrestationAdmin(admin.ModelAdmin):
    list_display = ["nom", "service", "prix", "prise_en_charge_assurance", "ordre", "actif"]
    list_editable = ["actif", "ordre"]
    list_filter = ["service", "prise_en_charge_assurance", "actif"]
    ordering = ["ordre"]


@admin.register(ParametresClinique)
class ParametresCliniqueAdmin(admin.ModelAdmin):
    list_display = ["nom", "telephone", "email"]

    def has_add_permission(self, request):
        return not ParametresClinique.objects.exists()
