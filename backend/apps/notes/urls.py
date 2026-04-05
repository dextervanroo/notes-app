from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import CategoryViewSet, NoteViewSet

notes_router = SimpleRouter()
notes_router.register(r"", NoteViewSet, basename="note")

categories_router = SimpleRouter()
categories_router.register(r"", CategoryViewSet, basename="category")

urlpatterns = [
    path("api/notes/", include(notes_router.urls)),
    path("api/categories/", include(categories_router.urls)),
]
