#!/usr/bin/env bash
set -o errexit
export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-config.settings.prod}

python manage.py migrate --noinput
python manage.py populate_ddp_data
python manage.py populate_assurances
python manage.py repair_permissions
python manage.py axes_reset || true
python manage.py shell -c "
from apps.authentication.models import User
email = 'admin@ddp.ci'
password = 'admin@ddp2026'
u, _ = User.objects.get_or_create(
    email=email,
    defaults={
        'nom': 'Admin',
        'prenom': 'Super',
        'role': 'super_admin',
        'is_active': True,
        'is_staff': True,
        'is_superuser': True,
    },
)
u.nom = u.nom or 'Admin'
u.prenom = u.prenom or 'Super'
u.role = 'super_admin'
u.is_active = True
u.is_staff = True
u.is_superuser = True
u.mot_de_passe_provisoire = True
u.set_password(password)
u.save()
print(f'Admin ready: {email} / {password}')
"
