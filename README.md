# 🍳 CodeCook

**CodeCook** is a backend API for a competitive coding platform — think LeetCode, but self-hosted. It supports user authentication, coding problems, async code execution via a job queue, playlists, leaderboards, and an admin panel.

Built with **Node.js**, **Express**, **PostgreSQL**, **Redis**, and **BullMQ**, with code execution offloaded to a remote [Piston](https://github.com/engineer-man/piston) instance.

---

## ✨ Features

- 🔐 **JWT Auth** — Register, login, logout, and token refresh with HTTP-only cookies
- 🧩 **Problems** — CRUD for coding problems with test cases (admin-only writes)
- ⚙️ **Code Execution** — Async submission pipeline via BullMQ + Piston API
- 📋 **Playlists** — Create and manage personal problem playlists
- 🏆 **Leaderboard** — Global ranking based on accepted submissions
- 🛡️ **Admin Panel** — Promote users and manage platform data
- 📖 **API Docs** — Auto-generated interactive docs via Scalar at `/docs`

---

## 🏗️ Architecture

```
Client
  │
  ▼
Express API (src/)
  ├── /api/v1/auth         → Auth (register, login, logout, refresh)
  ├── /api/v1/problems     → Problem CRUD
  ├── /api/v1/submissions  → Submit code → BullMQ queue
  ├── /api/v1/playlists    → Playlist management
  ├── /api/v1/leaderboard  → Global rankings
  ├── /api/v1/admin        → Admin actions
  └── /docs                → Scalar API reference
         │
         ├── PostgreSQL (Drizzle ORM)
         ├── Redis (BullMQ queue)
         └── Piston API (remote code execution)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **Docker** (for local Postgres + Redis)
- A running [Piston](https://github.com/engineer-man/piston) instance

### 1. Clone & install

```bash
git clone https://github.com/SohamShirke473/codecook.git
cd codecook
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable         | Description                             | Default                                      |
|------------------|-----------------------------------------|----------------------------------------------|
| `PORT`           | Port the server listens on              | `8080`                                       |
| `DATABASE_URL`   | PostgreSQL connection string            | `postgresql://admin@localhost:5433/codecook` |
| `REDIS_URL`      | Redis connection URL                    | `redis://localhost:6379`                     |
| `PISTON_API_URL` | Piston execution engine URL (with auth) | —                                            |
| `JWT_SECRET`     | Secret key for signing JWTs             | `dev-secret-change-in-production`            |
| `CORS_ORIGIN`    | Allowed CORS origin (your frontend URL) | `http://localhost:5173`                      |
| `NODE_ENV`       | `development` or `production`           | `development`                                |

### 3. Start infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port `5433`
- **Redis 7** on port `6379`

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Start the dev server

```bash
npm run dev
```

The API will be available at `http://localhost:8080`.  
Interactive API docs at `http://localhost:8080/docs`.

---

## 📡 API Reference

Full interactive docs are served at `/docs` (powered by [Scalar](https://scalar.com/)).

### Auth — `/api/v1/auth`

| Method | Endpoint    | Auth | Description               |
|--------|-------------|------|---------------------------|
| POST   | `/register` | —    | Create a new account      |
| POST   | `/login`    | —    | Login, receive JWT cookie |
| POST   | `/logout`   | —    | Clear auth cookies        |
| POST   | `/refresh`  | —    | Refresh access token      |
| GET    | `/check`    | ✅   | Validate current session  |

### Problems — `/api/v1/problems`

| Method | Endpoint | Auth     | Description          |
|--------|----------|----------|----------------------|
| GET    | `/`      | —        | List all problems    |
| GET    | `/:id`   | —        | Get a single problem |
| POST   | `/`      | ✅ Admin | Create a problem     |
| PUT    | `/:id`   | ✅ Admin | Update a problem     |
| DELETE | `/:id`   | ✅ Admin | Delete a problem     |

### Submissions — `/api/v1/submissions`

| Method | Endpoint | Auth | Description                         |
|--------|----------|------|-------------------------------------|
| POST   | `/`      | ✅   | Submit code (queued for execution)  |
| GET    | `/`      | ✅   | List your submissions               |
| GET    | `/:id`   | ✅   | Get a specific submission result    |

### Playlists — `/api/v1/playlists`

| Method | Endpoint                   | Auth | Description                  |
|--------|----------------------------|------|------------------------------|
| POST   | `/`                        | ✅   | Create a playlist            |
| GET    | `/`                        | ✅   | List your playlists          |
| GET    | `/:id`                     | ✅   | Get a playlist               |
| POST   | `/:id/problems`            | ✅   | Add problem to playlist      |
| DELETE | `/:id/problems/:problemId` | ✅   | Remove problem from playlist |
| DELETE | `/:id`                     | ✅   | Delete a playlist            |

### Leaderboard — `/api/v1/leaderboard`

| Method | Endpoint | Auth | Description            |
|--------|----------|------|------------------------|
| GET    | `/`      | —    | Get global leaderboard |

### Admin — `/api/v1/admin`

| Method | Endpoint                | Auth     | Description              |
|--------|-------------------------|----------|--------------------------|
| POST   | `/users/:id/make-admin` | ✅ Admin | Promote a user to admin  |

---

## 🗄️ Database

Schema is managed with **Drizzle ORM**. Tables:

- `users` — accounts and roles
- `problems` — problem statements and test cases
- `submissions` — code submissions and verdicts
- `test_case_results` — per-test-case execution results
- `playlists` / `playlist_problems` — playlist management
- `refresh_tokens` — persistent refresh token storage

### Useful DB commands

```bash
npm run db:generate   # Generate a new migration from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:studio     # Open Drizzle Studio (visual DB browser)
npm run db:push       # Push schema directly (dev only)
```

---

## ⚙️ Code Execution Pipeline

1. Client POSTs to `/api/v1/submissions`
2. A job is added to a **BullMQ** queue backed by Redis
3. A **worker** picks up the job and calls the **Piston API** with the submitted code and test cases
4. Results (verdicts per test case, overall status) are written back to PostgreSQL
5. Client polls `GET /api/v1/submissions/:id` to retrieve the result

---

## 🐳 Docker

A `docker-compose.yml` is provided to spin up local dependencies:

```bash
docker compose up -d      # Start Postgres + Redis
docker compose down       # Stop containers
docker compose down -v    # Stop and remove volumes (clears all data)
```

---

## 🚢 Deployment

The project includes a `nixpacks.toml` for deployment on platforms like [Railway](https://railway.app/):

```toml
[phases.start]
cmds = ["npm run start"]   # Runs migrations then starts the server
```

Set all environment variables from `.env.example` in your deployment platform's settings.

---

## 🧰 Tech Stack

| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Runtime       | Node.js 20                              |
| Framework     | Express 5                               |
| Language      | TypeScript                              |
| Database      | PostgreSQL 16 + Drizzle ORM             |
| Queue / Cache | Redis 7 + BullMQ                        |
| Code Execution| Piston API                              |
| Auth          | JWT (access + refresh tokens)           |
| Validation    | Zod                                     |
| API Docs      | Scalar (`@scalar/express-api-reference`)|

---

