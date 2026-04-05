import random
import re

from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

color_re = re.compile("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")
validate_color = RegexValidator(color_re, _("Enter a valid color."), "invalid")


def random_hex_color():
    return "#{:06x}".format(random.randint(0, 0xFFFFFF))


class ColorField(models.CharField):
    """
    A CharField that stores a CSS hex color (e.g. #FF5733 or #F53).
    Generates a random color by default.
    """

    default_validators = [validate_color]

    def __init__(self, *args, **kwargs):
        kwargs["max_length"] = 18
        kwargs.setdefault("default", random_hex_color)
        super(ColorField, self).__init__(*args, **kwargs)
