FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_CREATE=false

RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

WORKDIR /app

COPY pyproject.toml poetry.lock* ./

# --- Development stage ---
FROM base AS development

RUN poetry install --no-root --no-interaction

COPY . .

EXPOSE 8000

# --- Production stage ---
FROM base AS production

RUN poetry install --no-root --no-interaction --without dev

COPY . .

EXPOSE 8000
