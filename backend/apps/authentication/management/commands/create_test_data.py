"""
Commande : python manage.py create_test_data
Crée services, prestations liées aux services, et assurances de test.
"""
from django.core.management.base import BaseCommand

SERVICES_PRESTATIONS = {
    "Médecine Générale": {
        "code": "MED-GEN",
        "prestations": [
            {"nom": "Consultation générale",       "prix": 5000,  "assurance": False, "taux": 0},
            {"nom": "Renouvellement ordonnance",   "prix": 3000,  "assurance": False, "taux": 0},
            {"nom": "Injection / Perfusion",       "prix": 5000,  "assurance": False, "taux": 0},
            {"nom": "Pansement simple",            "prix": 3000,  "assurance": False, "taux": 0},
        ]
    },
    "Gynécologie": {
        "code": "GYNECO",
        "prestations": [
            {"nom": "Consultation gynécologique",  "prix": 10000, "assurance": True,  "taux": 70},
            {"nom": "Échographie obstétricale",    "prix": 20000, "assurance": True,  "taux": 70},
            {"nom": "Frottis cervical",            "prix": 12000, "assurance": True,  "taux": 60},
        ]
    },
    "Pédiatrie": {
        "code": "PEDIATRIE",
        "prestations": [
            {"nom": "Consultation pédiatrique",    "prix": 7000,  "assurance": True,  "taux": 70},
            {"nom": "Vaccination",                 "prix": 5000,  "assurance": True,  "taux": 80},
        ]
    },
    "Urgences": {
        "code": "URGENCES",
        "prestations": [
            {"nom": "Consultation urgences",       "prix": 7500,  "assurance": True,  "taux": 60},
            {"nom": "Suture plaie",                "prix": 15000, "assurance": True,  "taux": 70},
            {"nom": "Réhydratation IV",            "prix": 10000, "assurance": True,  "taux": 60},
        ]
    },
    "Radiologie": {
        "code": "RADIO",
        "prestations": [
            {"nom": "Radiographie thorax",         "prix": 15000, "assurance": True,  "taux": 80},
            {"nom": "Échographie abdominale",      "prix": 25000, "assurance": True,  "taux": 70},
            {"nom": "Scanner cérébral",            "prix": 80000, "assurance": True,  "taux": 80},
        ]
    },
    "Laboratoire": {
        "code": "LABO",
        "prestations": [
            {"nom": "Numération formule sanguine", "prix": 8000,  "assurance": True,  "taux": 60},
            {"nom": "Glycémie",                    "prix": 3000,  "assurance": False, "taux": 0},
            {"nom": "Bilan rénal",                 "prix": 12000, "assurance": True,  "taux": 60},
            {"nom": "Test paludisme (TDR)",        "prix": 4000,  "assurance": False, "taux": 0},
        ]
    },
    "Cardiologie": {
        "code": "CARDIO",
        "prestations": [
            {"nom": "Consultation cardiologique",  "prix": 15000, "assurance": True,  "taux": 75},
            {"nom": "ECG",                         "prix": 12000, "assurance": True,  "taux": 75},
            {"nom": "Échocardiographie",           "prix": 45000, "assurance": True,  "taux": 80},
        ]
    },
    "Chirurgie": {
        "code": "CHIRURGIE",
        "prestations": [
            {"nom": "Consultation chirurgicale",   "prix": 12000, "assurance": True,  "taux": 70},
            {"nom": "Petite chirurgie",            "prix": 50000, "assurance": True,  "taux": 75},
        ]
    },
}

ASSURANCES = [
    {"nom": "CNPS",             "code": "CNPS",    "taux": 70},
    {"nom": "MUGEF-CI",         "code": "MUGEF",   "taux": 80},
    {"nom": "SUNU Assurance",   "code": "SUNU",    "taux": 60},
    {"nom": "Allianz CI",       "code": "ALLIANZ", "taux": 75},
]


class Command(BaseCommand):
    help = "Crée des données de test : services avec leurs prestations, et assurances"

    def handle(self, *args, **options):
        from apps.configuration.models import Service, Prestation, Assurance

        self.stdout.write("\n🔧 Création des données de test...\n")

        ordre = 1
        for service_nom, data in SERVICES_PRESTATIONS.items():
            service, s_created = Service.objects.get_or_create(
                code=data["code"],
                defaults={"nom": service_nom, "ordre": list(SERVICES_PRESTATIONS.keys()).index(service_nom) + 1}
            )
            self.stdout.write(f"\n  {'✅' if s_created else '⏭ '} Service : {service.nom}")

            for p_data in data["prestations"]:
                presta, p_created = Prestation.objects.get_or_create(
                    nom=p_data["nom"],
                    defaults={
                        "service": service,
                        "prix": p_data["prix"],
                        "prise_en_charge_assurance": p_data["assurance"],
                        "taux_assurance": p_data["taux"],
                        "ordre": ordre,
                    }
                )
                # Lier au service si pas encore fait
                if not p_created and not presta.service:
                    presta.service = service
                    presta.save(update_fields=["service"])

                self.stdout.write(f"     {'✅' if p_created else '⏭ '} {presta.nom} — {presta.prix} FCFA")
                ordre += 1

        self.stdout.write("\n")
        for a_data in ASSURANCES:
            obj, created = Assurance.objects.get_or_create(
                code=a_data["code"],
                defaults={"nom": a_data["nom"], "taux_defaut": a_data["taux"]}
            )
            self.stdout.write(f"  {'✅' if created else '⏭ '} Assurance : {obj.nom}")

        self.stdout.write(self.style.SUCCESS("\n🎉 Données de test créées !"))
