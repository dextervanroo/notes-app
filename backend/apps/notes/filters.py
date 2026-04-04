from django_filters import rest_framework as filters

from .models import Category, Note


class CategoryFilter(filters.FilterSet):
    name = filters.CharFilter(lookup_expr="icontains")
    color = filters.CharFilter(lookup_expr="iexact")

    class Meta:
        model = Category
        fields = ["name", "color"]


class NoteFilter(filters.FilterSet):
    category = filters.UUIDFilter(field_name="category__id")
    title = filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = Note
        fields = ["category", "title"]
