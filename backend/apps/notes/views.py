from django.db.models.functions import Lower
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated

from .filters import CategoryFilter, NoteFilter
from .models import Category, Note
from .serializers import CategorySerializer, NoteSerializer


class CaseInsensitiveOrderingFilter(OrderingFilter):
    """Custom filter for case-insensitive ordering"""

    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        if ordering:
            # Apply case-insensitive ordering using Lower()
            return queryset.order_by(Lower(ordering[0]))
        return queryset


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filterset_class = CategoryFilter
    filter_backends = [DjangoFilterBackend, CaseInsensitiveOrderingFilter]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]
    ordering = "name"

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed("DELETE")


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = NoteFilter
    search_fields = ["title", "body"]
    ordering_fields = ["title", "created_at", "updated_at"]
    ordering = "-updated_at"

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
