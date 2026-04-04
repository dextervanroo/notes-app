from rest_framework import serializers

from .models import Category, Note


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "color", "created_at", "category_count")
        read_only_fields = ("id", "color", "created_at")


class NoteSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        write_only=True,
        required=True,
        allow_null=False,
    )

    class Meta:
        model = Note
        fields = (
            "id",
            "title",
            "body",
            "category",
            "category_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "category_count")
