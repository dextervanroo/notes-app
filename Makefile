.PHONY: use-local use-production up down migrate shell createsuperuser lint format test test-cov

# --- Environment switching ---

use-local:
	@sed -i 's/^STAGE=.*/STAGE=LOCAL/' .env
	@echo "Switched to LOCAL"
	docker compose up -d

use-production:
	@sed -i 's/^STAGE=.*/STAGE=PRODUCTION/' .env
	@echo "Switched to PRODUCTION"
	docker compose up -d

# --- Docker ---

up:
	docker compose up -d

down:
	docker compose down

rebuild:
	docker compose up -d --build

logs:
	docker compose logs -f backend

# --- Django ---

migrate:
	docker compose exec backend poetry run python manage.py migrate

makemigrations:
	docker compose exec backend poetry run python manage.py makemigrations

createsuperuser:
	docker compose exec backend poetry run python manage.py createsuperuser

shell:
	docker compose exec backend poetry run python manage.py shell

# --- Code quality ---

lint:
	docker compose exec backend poetry run flake8 .
	docker compose exec backend poetry run isort --check-only .
	docker compose exec backend poetry run black --check .

format:
	docker compose exec backend poetry run isort .
	docker compose exec backend poetry run black .

# --- Tests ---

test:
	docker compose exec backend poetry run pytest

test-cov:
	docker compose exec backend poetry run pytest --cov-report=html
