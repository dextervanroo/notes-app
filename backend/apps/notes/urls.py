from rest_framework.routers import SimpleRouter

from .views import CategoryViewSet, NoteViewSet

router = SimpleRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"", NoteViewSet, basename="note")

urlpatterns = router.urls
