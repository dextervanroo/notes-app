import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.filters import UserFilter

User = get_user_model()

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/users/register/"
LOGIN_URL = "/api/users/login/"
REFRESH_URL = "/api/users/token/refresh/"
LOGOUT_URL = "/api/users/logout/"
ME_URL = "/api/users/me/"


class TestUserManager:
    def test_create_user(self, db):
        user = User.objects.create_user(
            username="u1", email="u1@example.com", password="pass"
        )
        assert user.username == "u1"
        assert user.check_password("pass")
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_user_requires_username(self, db):
        with pytest.raises(ValueError):
            User.objects.create_user(username="", email="u@example.com", password="p")

    def test_create_user_requires_email(self, db):
        with pytest.raises(ValueError):
            User.objects.create_user(username="u1", email="", password="p")

    def test_create_superuser(self, db):
        user = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="pass"
        )
        assert user.is_staff
        assert user.is_superuser

    def test_user_str(self, db):
        user = User.objects.create_user(
            username="struser", email="str@example.com", password="pass"
        )
        assert str(user) == "struser"


class TestRegisterView:
    def test_register_success(self, api_client):
        data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "strongpass123",
        }
        response = api_client.post(REGISTER_URL, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert "id" in response.data
        assert "password" not in response.data
        assert response.data["username"] == "newuser"

    def test_register_duplicate_username(self, api_client, user):
        data = {
            "username": "testuser",
            "email": "other@example.com",
            "password": "strongpass123",
        }
        response = api_client.post(REGISTER_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_duplicate_email(self, api_client, user):
        data = {
            "username": "newuser",
            "email": "test@example.com",
            "password": "strongpass123",
        }
        response = api_client.post(REGISTER_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_missing_fields(self, api_client):
        response = api_client.post(REGISTER_URL, {"username": "u"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_short_password(self, api_client):
        data = {"username": "newuser", "email": "new@example.com", "password": "short"}
        response = api_client.post(REGISTER_URL, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestLoginView:
    def test_login_success(self, api_client, user):
        response = api_client.post(
            LOGIN_URL, {"username": "testuser", "password": "testpass123"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_wrong_password(self, api_client, user):
        response = api_client.post(
            LOGIN_URL, {"username": "testuser", "password": "wrongpass"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        response = api_client.post(
            LOGIN_URL, {"username": "nobody", "password": "pass"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_missing_fields(self, api_client):
        response = api_client.post(LOGIN_URL, {"username": "testuser"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestTokenRefreshView:
    def test_refresh_success(self, api_client, user):
        refresh = RefreshToken.for_user(user)
        response = api_client.post(REFRESH_URL, {"refresh": str(refresh)})
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

    def test_refresh_invalid_token(self, api_client):
        response = api_client.post(REFRESH_URL, {"refresh": "invalid"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestMeView:
    def test_me_authenticated(self, auth_client, user):
        response = auth_client.get(ME_URL)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["username"] == "testuser"
        assert response.data["email"] == "test@example.com"
        assert "password" not in response.data

    def test_me_unauthenticated(self, api_client):
        response = api_client.get(ME_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestLogoutView:
    def test_logout_success(self, auth_client, user):
        refresh = RefreshToken.for_user(user)
        response = auth_client.post(LOGOUT_URL, {"refresh": str(refresh)})
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_logout_missing_refresh_token(self, auth_client):
        response = auth_client.post(LOGOUT_URL, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_logout_invalid_token(self, auth_client):
        response = auth_client.post(LOGOUT_URL, {"refresh": "invalid-token"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_logout_unauthenticated(self, api_client, user):
        refresh = RefreshToken.for_user(user)
        response = api_client.post(LOGOUT_URL, {"refresh": str(refresh)})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUserFilter:
    def test_filter_by_email(self, db):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="p"
        )
        User.objects.create_user(username="bob", email="bob@example.com", password="p")
        f = UserFilter({"email": "alice"}, queryset=User.objects.all())
        assert f.qs.count() == 1
        assert f.qs.first().username == "alice"

    def test_filter_by_email_case_insensitive(self, db):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="p"
        )
        f = UserFilter({"email": "ALICE"}, queryset=User.objects.all())
        assert f.qs.count() == 1

    def test_filter_by_username(self, db):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="p"
        )
        User.objects.create_user(username="bob", email="bob@example.com", password="p")
        f = UserFilter({"username": "bob"}, queryset=User.objects.all())
        assert f.qs.count() == 1
        assert f.qs.first().username == "bob"

    def test_filter_by_username_partial(self, db):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="p"
        )
        User.objects.create_user(username="bob", email="bob@example.com", password="p")
        f = UserFilter({"username": "ali"}, queryset=User.objects.all())
        assert f.qs.count() == 1

    def test_filter_by_is_active(self, db):
        User.objects.create_user(
            username="active", email="a@example.com", password="p", is_active=True
        )
        User.objects.create_user(
            username="inactive", email="b@example.com", password="p", is_active=False
        )
        f = UserFilter({"is_active": True}, queryset=User.objects.all())
        assert all(u.is_active for u in f.qs)

    def test_no_filter_returns_all(self, db):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="p"
        )
        User.objects.create_user(username="bob", email="bob@example.com", password="p")
        f = UserFilter({}, queryset=User.objects.all())
        assert f.qs.count() == 2
