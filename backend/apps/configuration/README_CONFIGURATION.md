# Module Configuration — Guide de référence

## Architecture

```
apps/configuration/
├── models.py          — Modèles de données
├── serializers.py     — Sérialisation API
├── views.py           — Vues et endpoints
├── urls.py            — Routes
└── README_CONFIGURATION.md  — Ce fichier
```

---

## Modèles et leurs rôles

### Service
Représente un service médical de la clinique (Gynécologie, Urgences, Labo…).

**Champs clés :**
- `code` : identifiant unique (ex: `GYNECO`, `URGENCES`) — utilisé pour filtrer les prestations
- `nom` : affiché dans les formulaires et les reçus
- `ordre` : ordre d'affichage dans les listes

**Lien :** Un Service a plusieurs Prestations (FK `service` sur Prestation).

**Pour ajouter un service :**
```python
Service.objects.create(nom="Cardiologie", code="CARDIO", ordre=9)
```

---

### Prestation
Acte médical avec son tarif. Rattachée à un Service.

**Champs clés :**
- `service` (FK → Service) : filtre les prestations par service dans le formulaire fiche
- `prix` : utilisé pour calculer `montant_total` sur FichePaiement
- `prise_en_charge_assurance` (bool) : si True, `taux_assurance` est appliqué
- `taux_assurance` : pourcentage pris en charge (0–100)

**Pour rattacher une nouvelle prestation à un service existant :**
```python
service = Service.objects.get(code="CARDIO")
Prestation.objects.create(
    nom="Holter ECG",
    service=service,
    prix=35000,
    prise_en_charge_assurance=True,
    taux_assurance=75,
)
```

**API — filtrer par service :**
```
GET /api/v1/configuration/prestations/?service=<uuid_service>
```

---

### Assurance
Organisme d'assurance maladie partenaire.

**Champs clés :**
- `code` : identifiant court (ex: `CNPS`, `MUGEF`)
- `taux_defaut` : taux appliqué si la prestation ne définit pas son propre taux

**Pour ajouter un organisme :**
```python
Assurance.objects.create(nom="SUNU Assurance", code="SUNU", taux_defaut=65)
```

**Lien futur possible :** rattacher une assurance à des prestations spécifiques
(table de jonction Assurance ↔ Prestation avec taux personnalisé par couple).

---

### ParametresClinique
Singleton — un seul enregistrement. Contient les infos de la clinique affichées sur les reçus.

**Champs :** `nom`, `slogan`, `adresse`, `telephone`, `email`, `monnaie`, `logo`, `informations_legales`

**Accès :**
```python
from apps.configuration.models import ParametresClinique
params = ParametresClinique.objects.first()
```

---

## Endpoints API

| Méthode | URL | Description | Permission |
|---------|-----|-------------|------------|
| GET | `/api/v1/configuration/services/` | Liste des services actifs | Authentifié |
| POST | `/api/v1/configuration/services/` | Créer un service | `config.gerer_prestations` |
| GET | `/api/v1/configuration/prestations/` | Liste des prestations | Authentifié |
| GET | `/api/v1/configuration/prestations/?service=<id>` | Prestations d'un service | Authentifié |
| POST | `/api/v1/configuration/prestations/` | Créer une prestation | `config.gerer_prestations` |
| GET | `/api/v1/configuration/assurances/` | Liste des assurances | Authentifié |
| POST | `/api/v1/configuration/assurances/` | Créer une assurance | `config.gerer_assurances` |
| GET/PATCH | `/api/v1/configuration/parametres/` | Paramètres clinique | `config.gerer_parametres` |

---

## Fonctionnalités futures à intégrer ici

- **Tarifs par assurance** : taux spécifique par couple (Prestation, Assurance)
- **Catégories de prestations** : regrouper par type (biologie, imagerie, consultation…)
- **Codes CIM-10** : rattacher un code diagnostic à une prestation
- **Grille tarifaire** : prix différent selon le statut du patient (cas social, tarif réduit…)
- **Services multi-niveaux** : sous-services (ex: Chirurgie → Orthopédie, Viscérale…)
