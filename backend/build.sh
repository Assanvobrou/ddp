#!/usr/bin/env bash
set -o errexit
pip install -r requirements/prod.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py populate_ddp_data
python manage.py populate_assurances
python manage.py repair_permissions
python manage.py shell -c "
from apps.authentication.models import User
u = User.objects.filter(role='super_admin').first()
if u:
    u.set_password('admin@ddp2026')
    u.save()
    print('Super admin password reset OK')
"
