#!/usr/bin/env bash
set -o errexit

pip install -r requirements/prod.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py populate_ddp_data
python manage.py populate_assurances
python manage.py repair_permissions
