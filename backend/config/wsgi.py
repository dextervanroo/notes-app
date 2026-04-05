import os

from django.core.wsgi import get_wsgi_application

stage = os.environ.get("STAGE", "LOCAL")

if stage == "LOCAL":
    django_settings = "config.settings.development"
elif stage == "PRODUCTION":
    django_settings = "config.settings.production"
else:
    raise Exception(f"Unknown STAGE: '{stage}'")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", django_settings)

application = get_wsgi_application()
