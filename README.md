# 🗂️ DDP — Dossier Du Patient

Système de gestion clinique — caisse, dossiers patients, recettes.

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | Django 5 + Django REST Framework |
| Auth | JWT (SimpleJWT) + Argon2 |
| Base de données | PostgreSQL (SQLite en dev) |
| Sécurité | django-axes (brute force), CORS, HTTPS headers |

---

## 🚀 Installation rapide

### 1. Backend

```bash
cd backend

# Créer et activer l'environnement virtuel
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Installer les dépendances
pip install -r requirements/dev.txt

# ── Créer la base PostgreSQL ──────────────────────────────────────────────────
# Se connecter à psql en tant que superutilisateur puis :
psql -U postgres << 'SQL'
CREATE USER ddp_user WITH PASSWORD 'votre_mot_de_passe';
CREATE DATABASE ddp_db OWNER ddp_user;
GRANT ALL PRIVILEGES ON DATABASE ddp_db TO ddp_user;
SQL

# Configurer l'environnement
cp .env.example .env
# Éditer .env — renseigner DB_PASSWORD et DJANGO_SECRET_KEY

# Créer les dossiers nécessaires
mkdir -p logs

# Migrations
python manage.py migrate

# Données initiales (modules, permissions, super admin)
python manage.py populate_ddp_data

# Lancer le serveur
python manage.py runserver
```

**Super admin créé automatiquement :**
- Email : `admin@ddp.ci`
- Mot de passe : `Admin@DDP2026!`
- ⚠️ Changer immédiatement après la première connexion

### 2. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env

# Lancer en développement
npm run dev
```

Ouvrir : http://localhost:5173

---

## 📁 Structure

```
ddp/
├── backend/
│   ├── apps/
│   │   ├── authentication/   # Utilisateurs, modules, RBAC, audit
│   │   ├── caisse/           # Sessions, patients, fiches, dashboard
│   │   └── configuration/    # Prestations, assurances, paramètres
│   ├── config/               # Settings (base, dev, prod)
│   ├── core/                 # Permissions, pagination, exceptions
│   └── requirements/
└── frontend/
    └── src/
        ├── context/          # AuthContext, CaisseContext
        ├── pages/            # caisse/, configuration/
        ├── components/       # layout/, ui/
        ├── services/         # api.ts (axios)
        └── types/            # TypeScript types
```

---

## 🔐 Sécurité

| Mesure | Détail |
|--------|--------|
| Hachage mdp | Argon2 (le plus sécurisé) |
| Tokens | JWT access 15min + refresh 7j, blacklist activée |
| Brute force | django-axes : blocage après 5 tentatives / 1h |
| CORS | Origines whitelistées uniquement |
| Headers | NOSNIFF, X-FRAME-OPTIONS DENY, REFERRER |
| HTTPS | Forcé en production (HSTS) |
| Audit | Log de toutes les actions sensibles (immuable) |
| Permissions | RBAC granulaire par module ET par fonctionnalité |
| SQL | ORM Django uniquement, aucune requête brute |

---

## 👥 Rôles

| Rôle | Caisse | Dashboard recettes | Configuration |
|------|:------:|:-----------------:|:-------------:|
| Caissière | ✅ Enreg. + Fiche | ❌ | ❌ |
| Comptable | ❌ | ✅ | ❌ |
| Directrice | ❌ | ✅ | ✅ |
| Super Admin | ✅ | ✅ | ✅ |

---

## 🔄 Workflow caisse

1. **Ouverture** → tout utilisateur avec le module Caisse
2. **Enregistrement patients** → Caissière / Super Admin
3. **Fermeture** → saisie montant compté + justificatif si écart
4. **Versement** → apparaît chez le Comptable en attente
5. **Validation** → Comptable confirme la réception → statut "Validé"

---

## 🛠️ Commandes utiles

```bash
# Créer un super admin manuellement
python manage.py createsuperuser

# Réinitialiser les données de base
python manage.py populate_ddp_data

# Production
DJANGO_SETTINGS_MODULE=config.settings.prod gunicorn config.wsgi:application
```

---

## 📋 API Documentation

Swagger UI disponible à : http://localhost:8000/api/docs/
