#!/usr/bin/env python
import os
import sys


def main():
    stage = os.environ.get("STAGE", "LOCAL")

    if stage == "LOCAL":
        django_settings = "config.settings.development"
    elif stage == "PRODUCTION":
        django_settings = "config.settings.production"
    else:
        raise Exception(f"Unknown STAGE: '{stage}'")

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", django_settings)

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
