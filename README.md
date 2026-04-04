# Notes App

A full-stack notes-taking application built with Django and Next.js.

---

## Project Overview

A clean, minimal note-taking app where users can create, organize, and manage personal notes across color-coded categories. Features JWT authentication, a category sidebar, and an auto-saving note editor.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Django 5 + Django REST Framework | Robust ORM, batteries-included auth, clean API patterns |
| Auth | djangorestframework-simplejwt | Stateless JWT with built-in token refresh and blacklist |
| Database | PostgreSQL 16 | Reliable relational DB; runs in Docker for local dev |
| Frontend | Next.js 14 (App Router) + React | File-based routing, SSR-ready, strong TypeScript support |
| Styling | Tailwind CSS | Utility-first, maps cleanly to Figma design tokens |
| State | React Context | Built-in auth context; notes/categories are local component state |
| HTTP Client | Native `fetch` | Built-in, no dependency needed; thin wrapper handles JWT headers |
| Orchestration | Docker Compose | Single command to spin up all services |

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd notes-app

# 2. Copy environment variables
cp .env.example .env
# Edit .env and set DJANGO_SECRET_KEY and POSTGRES_PASSWORD

# 3. Start all services
docker compose up --build

# 4. Run migrations (first time only)
docker compose exec backend poetry run python manage.py migrate

# 5. (Optional) Create a Django superuser
docker compose exec backend poetry run python manage.py createsuperuser
```

- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

### Running Tests

```bash
docker compose exec backend poetry run pytest
```

### Linting

```bash
docker compose exec backend poetry run flake8 .
docker compose exec backend poetry run black --check .
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/register/` | No | Create a new account |
| POST | `/api/users/login/` | No | Log in, returns JWT pair |
| POST | `/api/users/token/refresh/` | No | Refresh access token |
| POST | `/api/users/logout/` | Yes | Blacklist refresh token |
| GET | `/api/users/me/` | Yes | Get current user info |
| GET/POST | `/api/notes/categories/` | Yes | List / create categories |
| GET/PUT/PATCH | `/api/notes/categories/:id/` | Yes | Category detail (delete blocked) |
| GET/POST | `/api/notes/` | Yes | List (supports `?category=`, `?search=`, `?sort=`) / create |
| GET/PUT/PATCH/DELETE | `/api/notes/:id/` | Yes | Note detail |

### Authentication

All protected endpoints accept either:
- **JWT** — `Authorization: Bearer <access_token>`
- **Basic Auth** — `Authorization: Basic <base64(username:password)>`

---

## Project Structure

```
notes-app/
├── backend/                    # Django project
│   ├── apps/
│   │   ├── users/              # Custom User model (username + email), auth endpoints
│   │   └── notes/              # Category and Note models, ViewSets, filters
│   ├── config/
│   │   ├── settings/           # Split settings: base, development, production
│   │   ├── urls.py             # Root URLs + Swagger
│   │   └── wsgi.py
│   ├── helpers/
│   │   └── fields.py           # ColorField with random hex default
│   ├── Dockerfile
│   ├── pyproject.toml          # Poetry dependencies (incl. black + flake8)
│   └── poetry.lock
├── frontend/                   # Next.js project (to be implemented)
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── (auth)/         # Login, Signup
│   │   │   └── (app)/          # Protected: notes list + editor
│   │   ├── components/         # UI components
│   │   ├── lib/                # fetch wrapper, TypeScript types
│   │   └── context/            # React AuthContext
│   └── public/illustrations/   # SVG illustrations from design
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Design Decisions

**React Context over Zustand** — Auth state is the only truly global state in the app. Notes and categories are fetched and held locally in the components that need them. A single `AuthContext` with `useState` covers the global needs without adding a dependency.

**Native `fetch` over Axios** — No extra dependency needed. A thin `fetchApi()` wrapper handles JWT headers and 401 refresh logic.

**localStorage for JWT tokens** — The backend and frontend run on different origins in development (`localhost:8000` vs `localhost:3000`). Cross-origin `httpOnly` cookies require `SameSite=None; Secure`, which means HTTPS even locally. For this project's scope, `localStorage` with short-lived access tokens (60 min) and automatic refresh is a pragmatic choice.

**Django apps under `apps/`** — Both `users` and `notes` live in `backend/apps/` to keep the project root clean. Each app is self-contained with its own models, serializers, ViewSets, filters, and URLs.

**ViewSets + SimpleRouter** — Reduces view boilerplate; all CRUD routes are generated automatically. `CategoryViewSet.destroy` raises `MethodNotAllowed` to block deletion.

**Random hex color per category** — Color is generated automatically via `ColorField`'s `default=random_hex_color` callable. It is read-only on the API — the client cannot set or change it.

**UUIDs as primary keys** — All models use `UUIDField(primary_key=True, default=uuid.uuid4)` to avoid enumerable integer IDs in URLs.

**Username-based auth** — `USERNAME_FIELD = "username"` so both the Django admin and the API authenticate with username + password. Email is stored separately and must be unique.

**No UI component library** — The design is custom enough that adopting shadcn/ui or MUI would require more overriding than building from scratch. Tailwind utility classes are sufficient to match the Figma design tokens.

---

## AI Tool Usage

This project was built with the assistance of **Claude Code (claude-sonnet-4-6)**, Anthropic's CLI tool for software engineering tasks.

**How AI was used:**

- **Design analysis** — Claude Code read the Figma export screenshots directly and extracted the full UI specification: color palette, screen layouts, component hierarchy, and copy text. This replaced the need to manually document the Figma file.

- **Architecture planning** — Used Claude Code's plan mode to design the full project structure before writing a single line of code. The plan covered the Django model schema, REST API shape, Next.js route groups, auth flow, and Docker setup.

- **Scaffolding** — Django project initialization, settings split, serializer boilerplate, ViewSet and filter structure were generated and reviewed iteratively.

- **Implementation** — Feature code (models, views, React components) was written collaboratively: Claude generated initial implementations, which were reviewed and refined.

- **Reference codebase analysis** — Claude Code read settings, Docker, and view patterns from an existing production project (`hidros-backend`) and selectively applied relevant conventions (black/flake8 config, `apps/` folder structure, ViewSet pattern, `django-filter`, `drf-yasg`).

- **README drafting** — This README was structured and written with Claude Code based on the challenge requirements and the decisions made during implementation.

**What required human judgment:**
- Choosing localStorage vs. httpOnly cookies (weighed DX vs. security tradeoffs)
- Deciding not to use a component library
- Deciding to move color ownership from Note to Category
- Choosing username-based over email-based authentication
- Reviewing all generated code for correctness and security