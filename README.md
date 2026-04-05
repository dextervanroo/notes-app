# Notes App

A full-stack note-taking application built with Django and Next.js.

---

## Project Overview

A clean, minimal note-taking app where users can create, organize, and manage personal notes across color-coded categories. Features JWT authentication, a category sidebar, and a note editor with inline category creation.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Django 5 + Django REST Framework | Robust ORM, batteries-included auth, clean API patterns |
| Auth | djangorestframework-simplejwt | Stateless JWT with built-in token refresh and blacklist |
| Database | PostgreSQL 16 | Reliable relational DB; runs in Docker for local dev |
| CamelCase | djangorestframework-camel-case | Consistent camelCase JSON across all API responses |
| Frontend | Next.js 16 (App Router) + React 19 | File-based routing, strong TypeScript support |
| Styling | Tailwind CSS v4 | CSS-based config, utility-first, maps cleanly to design tokens |
| HTTP Client | Native `fetch` | No extra dependency; thin wrapper handles JWT headers and auto-refresh |
| FE Testing | Vitest + React Testing Library | ESM-native, fast, same API as Jest; RTL for component + interaction tests |
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
make up

# 4. Run migrations (first time only)
make migrate

# 5. (Optional) Create a Django superuser
make createsuperuser
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000/ |
| Backend API | http://localhost:8000/api/ |
| Swagger UI | http://localhost:8000/swagger/ |
| ReDoc | http://localhost:8000/redoc/ |
| Django Admin | http://localhost:8000/admin/ |

### Running Tests

```bash
# Backend
make backend-test                                                          # all tests
make backend-test ARGS="apps/notes/tests.py::TestCategoryList"            # single class
make backend-test ARGS="apps/notes/tests.py::TestCategoryList::test_list" # single test

# Frontend
make frontend-test   # vitest run with coverage table
```

### Linting

```bash
make backend-lint           # backend: flake8 + isort --check + black --check
make backend-format         # backend: isort + black (auto-fix)
make frontend-lint  # frontend: eslint src/
```

---

## API Reference

All responses are serialized as **camelCase** JSON.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/register/` | No | Create a new account |
| POST | `/api/users/login/` | No | Log in, returns JWT pair |
| POST | `/api/users/token/refresh/` | No | Refresh access token |
| POST | `/api/users/logout/` | Yes | Blacklist refresh token |
| GET | `/api/users/me/` | Yes | Get current user info |
| GET/POST | `/api/notes/categories/` | Yes | List (`?name=`, `?sort=`) / create categories |
| GET/PUT/PATCH | `/api/notes/categories/:id/` | Yes | Category detail (delete blocked — 405) |
| GET/POST | `/api/notes/` | Yes | List (`?category=`, `?sort=`) / create notes |
| GET/PUT/PATCH/DELETE | `/api/notes/:id/` | Yes | Note detail |

### Authentication

All protected endpoints accept either:
- **JWT** — `Authorization: Bearer <access_token>`
- **Basic Auth** — `Authorization: Basic <base64(username:password)>`

---

## Project Structure

```
notes-app/
├── backend/
│   ├── apps/
│   │   ├── users/              # Custom User model (username + email), auth endpoints
│   │   └── notes/              # Category and Note models, ViewSets, filters
│   ├── config/
│   │   ├── settings/           # Split settings: base, development, production
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── helpers/
│   │   └── fields.py           # ColorField with random hex default
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── poetry.lock
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout (fonts: Inter + Inria Serif)
│   │   │   ├── globals.css             # Tailwind v4 + design tokens
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── (protected)/            # Auth-guarded route group
│   │   │       ├── layout.tsx          # Redirects to /login if unauthenticated
│   │   │       ├── page.tsx            # Dashboard: category sidebar + notes grid
│   │   │       └── notes/
│   │   │           ├── new/page.tsx    # Create note
│   │   │           └── [id]/page.tsx   # View / edit / delete note
│   │   ├── components/
│   │   │   └── CategoryDialog.tsx      # Modal for creating a new category
│   │   └── lib/
│   │       └── api.ts                  # API client, TypeScript types, utilities
│   ├── src/__tests__/                  # Vitest test suites
│   │   ├── lib/api.test.ts             # Utility + token helper tests
│   │   ├── components/                 # CategoryDialog tests
│   │   └── app/                        # Page + interaction tests
│   ├── public/images/                  # Illustrations (login, register)
│   ├── Dockerfile
│   ├── package.json
│   ├── vitest.config.ts
│   └── eslint.config.mjs
├── .github/workflows/lint.yml  # CI: backend lint + frontend lint + tests
├── docker-compose.yml
├── Makefile
└── .env.example
```

---

## Design Decisions

**Native `fetch` over Axios** — No extra dependency needed. The `apiFetch` wrapper in `api.ts` handles JWT headers and transparent token refresh on 401, then retries the original request.

**localStorage for JWT tokens** — The backend and frontend run on different origins in development (`localhost:8000` vs `localhost:3000`). Cross-origin `httpOnly` cookies require `SameSite=None; Secure`, which means HTTPS even locally. For this project's scope, `localStorage` with short-lived access tokens (60 min) and automatic refresh is a pragmatic choice.

**camelCase API responses** — `djangorestframework-camel-case` converts all JSON keys automatically, so the frontend can use idiomatic JavaScript naming (`createdAt`, `categoryId`) without any manual transformation.

**Django apps under `apps/`** — Both `users` and `notes` live in `backend/apps/` to keep the project root clean. Each app is self-contained with its own models, serializers, ViewSets, filters, and URLs.

**ViewSets + SimpleRouter** — Reduces view boilerplate; all CRUD routes are generated automatically. `CategoryViewSet.destroy` raises `MethodNotAllowed` to block deletion.

**Color per category** — Color is stored on the category (not the note). `ColorField` auto-generates a random hex if no color is supplied at creation; color is also writable via the API so clients can pick their own.

**UUIDs as primary keys** — All models use `UUIDField(primary_key=True, default=uuid.uuid4)` to avoid enumerable integer IDs in URLs.

**Username-based auth** — `USERNAME_FIELD = "username"` so both the Django admin and the API authenticate with username + password. Email is stored separately and must be unique.

**No UI component library** — The design is custom; Tailwind CSS v4 utility classes are sufficient to match the Figma design tokens without the overhead of overriding a third-party library.

**Named Docker volume for `node_modules`** — The frontend container mounts the source tree from the host, but `node_modules` lives in a named volume (`frontend_node_modules`). This prevents the host directory (empty or stale) from shadowing the container's packages.

---

## AI Tool Usage

This project was built with the assistance of **Claude Code (claude-sonnet-4-6)**, Anthropic's CLI tool for software engineering tasks.

**How AI was used:**

- **Design analysis** — Claude Code connected to Figma via MCP and extracted the full UI specification: color palette, screen layouts, component hierarchy, and copy text.

- **Architecture planning** — Used Claude Code's plan mode to design the full project structure before writing code. The plan covered the Django model schema, REST API shape, Next.js route groups, auth flow, and Docker setup.

- **Scaffolding & implementation** — Backend and frontend code was written collaboratively: Claude generated initial implementations, which were reviewed and refined iteratively.

- **Reference codebase analysis** — Claude Code read settings, Docker, and view patterns from an existing production project (`hidros-backend`) and applied relevant conventions.

**What required human judgment:**
- Choosing localStorage vs. httpOnly cookies
- Deciding not to use a UI component library
- Deciding to move color ownership from Note to Category
- Choosing username-based over email-based authentication
- Reviewing all generated code for correctness and security
