# Notes App

A full-stack notes-taking application built with Django and Next.js.

---

## Project Overview

A clean, minimal note-taking app where users can create, organize, and manage personal notes across color-coded categories. Features JWT authentication, a category sidebar, and an auto-saving note editor.

---

## Screenshots

_Coming soon — will be added after the UI is complete._

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
docker compose exec backend python manage.py migrate

# 5. (Optional) Create a Django superuser
docker compose exec backend python manage.py createsuperuser
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/

### Running Tests

```bash
docker compose exec backend pytest
docker compose exec frontend npm run test
```

### Linting

```bash
docker compose exec backend python -m flake8 .
docker compose exec frontend npm run lint
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
| GET | `/api/notes/categories/` | Yes | List all categories |
| POST | `/api/notes/categories/` | Yes | Create a category |
| GET/PUT/DELETE | `/api/notes/categories/:id/` | Yes | Category detail |
| GET | `/api/notes/` | Yes | List notes (supports `?category=<id>`) |
| POST | `/api/notes/` | Yes | Create a note |
| GET/PUT/DELETE | `/api/notes/:id/` | Yes | Note detail |

---

## Project Structure

```
notes-app/
├── backend/                    # Django project
│   ├── config/
│   │   ├── settings/           # Split settings: base, dev, prod
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── users/                  # Auth, registration, user profile (custom User model)
│   ├── notes/                  # Notes and categories
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # Next.js project
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

**localStorage for JWT tokens** — The backend and frontend run on different origins in development (`localhost:8000` vs `localhost:3000`). Cross-origin `httpOnly` cookies require `SameSite=None; Secure`, which means HTTPS even locally. For this project's scope, `localStorage` with short-lived access tokens (60 min) and automatic refresh is a pragmatic choice. The migration path to `httpOnly` cookies is to proxy the API through Next.js rewrites and switch origins.

**Two Django apps (`users` and `notes`)** — `users` owns the custom User model (email-based auth), registration, login, and the `/api/users/` URL prefix. `notes` owns Category and Note models and the `/api/notes/` prefix. Each app is self-contained with its own models, serializers, views, and URLs.

**TextChoices for note colors** — Four fixed color options don't warrant a database table. An enum as a `CharField` keeps the schema simple, the API readable (`"color": "teal"`), and maps directly to Tailwind class names on the frontend without a join.

**No UI component library** — The design is custom enough that adopting shadcn/ui or MUI would require more overriding than building from scratch. Tailwind utility classes are sufficient to match the Figma design tokens.

---

## AI Tool Usage

This project was built with the assistance of **Claude Code (claude-sonnet-4-6)**, Anthropic's CLI tool for software engineering tasks.

**How AI was used:**

- **Design analysis** — Claude Code read the Figma export screenshots directly and extracted the full UI specification: color palette, screen layouts, component hierarchy, and copy text. This replaced the need to manually document the Figma file.

- **Architecture planning** — Used Claude Code's plan mode to design the full project structure before writing a single line of code. The plan covered the Django model schema, REST API shape, Next.js route groups, auth flow, and Docker setup.

- **Scaffolding** — Django project initialization, settings split, serializer boilerplate, and Next.js component structure were generated and reviewed iteratively.

- **Implementation** — Feature code (models, views, React components) was written collaboratively: Claude generated initial implementations, which were reviewed and refined.

- **README drafting** — This README was structured and written with Claude Code based on the challenge requirements and the decisions made during implementation.

**What required human judgment:**
- Choosing localStorage vs. httpOnly cookies (weighed DX vs. security tradeoffs)
- Deciding not to use a component library
- Reviewing all generated code for correctness and security (no user-controlled `user` field in API payloads)