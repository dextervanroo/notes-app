.PHONY: use-local use-production up down migrate shell createsuperuser lint format test test-cov frontend-logs frontend-install frontend-lint frontend-test

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

# --- Frontend code quality and tests ---

frontend-logs:
	docker compose logs -f frontend

frontend-install:
	docker compose exec frontend npm install

frontend-lint:
	docker compose exec frontend npm run lint

frontend-test:
	docker compose exec frontend npm run test

frontend-test-cov:
	docker compose exec frontend npm run test:coverage

# --- Backend code quality and tests ---

backend-lint:
	docker compose exec backend poetry run flake8 .
	docker compose exec backend poetry run isort --check-only .
	docker compose exec backend poetry run black --check .

backend-format:
	docker compose exec backend poetry run isort .
	docker compose exec backend poetry run black .

backend-test:
	docker compose exec backend poetry run pytest $(ARGS)

backend-test-cov:
	docker compose exec backend poetry run pytest --cov-report=html $(ARGS)

# --- Django ---

migrate:
	docker compose exec backend poetry run python manage.py migrate

makemigrations:
	docker compose exec backend poetry run python manage.py makemigrations

createsuperuser:
	docker compose exec backend poetry run python manage.py createsuperuser

shell:
	docker compose exec backend poetry run python manage.py shell_plus
