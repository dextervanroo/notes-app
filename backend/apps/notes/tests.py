import pytest
from rest_framework import status

from apps.notes.models import Category, Note

pytestmark = pytest.mark.django_db

CATEGORIES_URL = "/api/notes/categories/"
NOTES_URL = "/api/notes/"


# --- Fixtures ---


@pytest.fixture
def category(user):
    return Category.objects.create(name="Work", user=user)


@pytest.fixture
def other_category(other_user):
    return Category.objects.create(name="Personal", user=other_user)


@pytest.fixture
def note(user, category):
    return Note.objects.create(
        title="Test Note", body="Some body", category=category, user=user
    )


# --- Category tests ---


class TestCategoryList:
    def test_list_own_categories(self, auth_client, category):
        response = auth_client.get(CATEGORIES_URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Work"

    def test_does_not_return_other_users_categories(self, auth_client, other_category):
        response = auth_client.get(CATEGORIES_URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_unauthenticated_returns_401(self, api_client):
        response = api_client.get(CATEGORIES_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCategoryCreate:
    def test_create_category_success(self, auth_client):
        response = auth_client.post(CATEGORIES_URL, {"name": "Travel"})
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Travel"

    def test_create_category_auto_generates_color(self, auth_client):
        response = auth_client.post(CATEGORIES_URL, {"name": "Travel"})
        assert response.status_code == status.HTTP_201_CREATED
        color = response.data["color"]
        assert color.startswith("#")
        assert len(color) in (4, 7)

    def test_create_category_color_not_settable(self, auth_client):
        response = auth_client.post(
            CATEGORIES_URL, {"name": "Travel", "color": "#000000"}
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["color"] != "#000000"

    def test_create_category_missing_name(self, auth_client):
        response = auth_client.post(CATEGORIES_URL, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_duplicate_category_name(self, auth_client, category):
        response = auth_client.post(CATEGORIES_URL, {"name": "Work"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unauthenticated_cannot_create(self, api_client):
        response = api_client.post(CATEGORIES_URL, {"name": "Travel"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestCategoryRetrieveUpdate:
    def test_retrieve_category(self, auth_client, category):
        response = auth_client.get(f"{CATEGORIES_URL}{category.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Work"

    def test_update_category(self, auth_client, category):
        response = auth_client.patch(
            f"{CATEGORIES_URL}{category.id}/", {"name": "Updated"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated"

    def test_cannot_access_other_users_category(self, auth_client, other_category):
        response = auth_client.get(f"{CATEGORIES_URL}{other_category.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCategoryDelete:
    def test_delete_category_blocked(self, auth_client, category):
        response = auth_client.delete(f"{CATEGORIES_URL}{category.id}/")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_category_with_notes_protected_at_db_level(self, user, category):
        Note.objects.create(title="N", body="", category=category, user=user)
        with pytest.raises(Exception):
            category.delete()


class TestCategoryFilter:
    def test_filter_by_name(self, auth_client, user):
        Category.objects.create(name="Work", user=user)
        Category.objects.create(name="Travel", user=user)
        response = auth_client.get(CATEGORIES_URL, {"name": "work"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Work"

    def test_search_by_name(self, auth_client, user):
        Category.objects.create(name="Work", user=user)
        Category.objects.create(name="Travel", user=user)
        response = auth_client.get(CATEGORIES_URL, {"search": "trav"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1


# --- Note tests ---


class TestNoteList:
    def test_list_own_notes(self, auth_client, note):
        response = auth_client.get(NOTES_URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["title"] == "Test Note"

    def test_does_not_return_other_users_notes(
        self, auth_client, other_user, other_category
    ):
        Note.objects.create(
            title="Other", body="", category=other_category, user=other_user
        )
        response = auth_client.get(NOTES_URL)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_unauthenticated_returns_401(self, api_client):
        response = api_client.get(NOTES_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestNoteCreate:
    def test_create_note_success(self, auth_client, category):
        data = {"title": "New Note", "body": "Content", "category_id": str(category.id)}
        response = auth_client.post(NOTES_URL, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["title"] == "New Note"
        assert response.data["category"]["name"] == "Work"

    def test_create_note_without_body(self, auth_client, category):
        data = {"title": "No Body", "category_id": str(category.id)}
        response = auth_client.post(NOTES_URL, data)
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_note_missing_category(self, auth_client):
        response = auth_client.post(NOTES_URL, {"title": "No Category"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_note_missing_title(self, auth_client, category):
        response = auth_client.post(
            NOTES_URL, {"body": "No title", "category_id": str(category.id)}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_use_other_users_category(self, auth_client, other_category):
        data = {
            "title": "Sneaky Note",
            "category_id": str(other_category.id),
        }
        response = auth_client.post(NOTES_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_unauthenticated_cannot_create(self, api_client, category):
        response = api_client.post(
            NOTES_URL, {"title": "N", "category_id": str(category.id)}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestNoteRetrieveUpdateDelete:
    def test_retrieve_note(self, auth_client, note):
        response = auth_client.get(f"{NOTES_URL}{note.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Test Note"
        assert "category" in response.data
        assert "category_id" not in response.data

    def test_update_note_title(self, auth_client, note):
        response = auth_client.patch(f"{NOTES_URL}{note.id}/", {"title": "Updated"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data["title"] == "Updated"

    def test_update_note_category(self, auth_client, user, note):
        new_category = Category.objects.create(name="New Cat", user=user)
        response = auth_client.patch(
            f"{NOTES_URL}{note.id}/", {"category_id": str(new_category.id)}
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["category"]["name"] == "New Cat"

    def test_delete_note(self, auth_client, note):
        response = auth_client.delete(f"{NOTES_URL}{note.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Note.objects.filter(id=note.id).exists()

    def test_cannot_access_other_users_note(
        self, auth_client, other_user, other_category
    ):
        other_note = Note.objects.create(
            title="Other", body="", category=other_category, user=other_user
        )
        response = auth_client.get(f"{NOTES_URL}{other_note.id}/")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestNoteFilter:
    def test_filter_by_category(self, auth_client, user, category):
        other_cat = Category.objects.create(name="Other", user=user)
        Note.objects.create(title="N1", body="", category=category, user=user)
        Note.objects.create(title="N2", body="", category=other_cat, user=user)
        response = auth_client.get(NOTES_URL, {"category": str(category.id)})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["title"] == "N1"

    def test_filter_by_title(self, auth_client, user, category):
        Note.objects.create(
            title="Meeting notes", body="", category=category, user=user
        )
        Note.objects.create(
            title="Shopping list", body="", category=category, user=user
        )
        response = auth_client.get(NOTES_URL, {"title": "meeting"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_search_in_body(self, auth_client, user, category):
        Note.objects.create(
            title="N1", body="important content", category=category, user=user
        )
        Note.objects.create(title="N2", body="other", category=category, user=user)
        response = auth_client.get(NOTES_URL, {"search": "important"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_ordering_by_title(self, auth_client, user, category):
        Note.objects.create(title="Banana", body="", category=category, user=user)
        Note.objects.create(title="Apple", body="", category=category, user=user)
        response = auth_client.get(NOTES_URL, {"sort": "title"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]["title"] == "Apple"


class TestNoteModelStr:
    def test_note_str(self, note):
        assert str(note) == "Test Note"

    def test_category_str(self, category):
        assert str(category) == "Work"
