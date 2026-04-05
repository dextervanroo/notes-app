from rest_framework import serializers

from .models import Category, Note


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "color", "created_at")
        read_only_fields = ("id", "color", "created_at")

    def validate_name(self, value):
        request = self.context.get("request")
        if request:
            qs = Category.objects.filter(user=request.user, name=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    "A category with this name already exists."
                )
        return value


class NoteSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
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
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_category_id(self, value):
        request = self.context.get("request")
        if (
            request
            and not Category.objects.filter(user=request.user, pk=value.pk).exists()
        ):
            raise serializers.ValidationError("Invalid category.")
        return value
