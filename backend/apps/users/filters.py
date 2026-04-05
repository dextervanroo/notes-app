from django_filters import rest_framework as filters

from .models import User


class UserFilter(filters.FilterSet):
    email = filters.CharFilter(lookup_expr="icontains")
    username = filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = User
        fields = ["email", "username", "is_active"]
