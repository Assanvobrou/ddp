from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Module, PermissionGranulaire, AuditLog


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ["emoji", "code", "nom", "ordre", "actif"]
    list_editable = ["actif", "ordre"]
    ordering = ["ordre"]


@admin.register(PermissionGranulaire)
class PermissionGranulaireAdmin(admin.ModelAdmin):
    list_display = ["code", "nom", "module"]
    list_filter = ["module"]


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "nom_complet", "role", "is_active", "date_creation"]
    list_filter = ["role", "is_active"]
    search_fields = ["email", "nom", "prenom", "matricule"]
    ordering = ["nom"]
    filter_horizontal = ["modules_autorises", "permissions_granulaires"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Identité", {"fields": ("nom", "prenom", "matricule")}),
        ("Rôle & Accès", {"fields": ("role", "modules_autorises", "permissions_granulaires")}),
        ("Statut", {"fields": ("is_active", "is_staff", "mot_de_passe_provisoire")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nom", "prenom", "role", "password1", "password2"),
        }),
    )


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["timestamp", "utilisateur", "action", "ip_address"]
    list_filter = ["action"]
    search_fields = ["utilisateur__email", "ip_address"]
    readonly_fields = ["id", "utilisateur", "action", "details", "ip_address", "user_agent", "timestamp"]

    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False
