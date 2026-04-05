import re

import pytest
from django.core.exceptions import ValidationError

from helpers.fields import ColorField, random_hex_color, validate_color


def test_random_hex_color_format():
    color = random_hex_color()
    assert re.match(r"^#[0-9a-f]{6}$", color), f"Invalid color: {color}"


def test_random_hex_color_is_random():
    colors = {random_hex_color() for _ in range(30)}
    assert len(colors) > 1


def test_validate_color_valid_6_digits():
    validate_color("#FF5733")
    validate_color("#abcdef")


def test_validate_color_valid_3_digits():
    validate_color("#F53")
    validate_color("#abc")


def test_validate_color_invalid_raises():
    with pytest.raises(ValidationError):
        validate_color("not-a-color")


def test_validate_color_missing_hash_raises():
    with pytest.raises(ValidationError):
        validate_color("FF5733")


def test_color_field_max_length():
    field = ColorField()
    assert field.max_length == 18


def test_color_field_default_is_callable():
    field = ColorField()
    assert callable(field.default)


def test_color_field_default_generates_valid_color():
    field = ColorField()
    color = field.default()
    assert re.match(r"^#[0-9a-f]{6}$", color)


def test_color_field_has_validator():
    field = ColorField()
    assert validate_color in field.default_validators


def test_color_field_custom_default():
    field = ColorField(default="#123456")
    assert field.default == "#123456"
