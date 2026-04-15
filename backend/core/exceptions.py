import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger("apps")


def ddp_exception_handler(exc, context):
    """Gestionnaire d'exceptions centralisé — format de réponse uniforme."""
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "success": False,
            "erreur": _extract_error(response.data),
            "code": response.status_code,
        }
        response.data = error_data

        # Log les erreurs 5xx
        if response.status_code >= 500:
            logger.error(
                "Erreur serveur %s: %s — Vue: %s",
                response.status_code,
                exc,
                context.get("view"),
            )

    return response


def _extract_error(data):
    """Extrait le message d'erreur lisible depuis les données DRF."""
    if isinstance(data, dict):
        for key in ("detail", "non_field_errors"):
            if key in data:
                val = data[key]
                return str(val[0]) if isinstance(val, list) else str(val)
        # Première erreur de champ
        for key, val in data.items():
            if isinstance(val, list) and val:
                return f"{key}: {val[0]}"
            return str(val)
    if isinstance(data, list) and data:
        return str(data[0])
    return str(data)
