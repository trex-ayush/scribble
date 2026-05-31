# ✏️ Scribble

A Medium-style writing platform built on the **MERN stack** — read, write, clap, and follow, with a hand-drawn "sketchbook" aesthetic. Includes team workspace delegation, a public REST API, an audit/activity log, and in-app notifications.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Team Member Access](#team-member-access)
- [Public API (Basic Auth)](#public-api-basic-auth)
- [Notifications](#notifications)
- [Security](#security)
- [Scripts](#scripts)
- [Contributing](#contributing)

---

## Features

- **Authentication** — register / login with **email *or* username**, JWT access + refresh tokens stored in `httpOnly` cookies, refresh-token **rotation with reuse detection**, logout.
- **Writing** — a **rich-text editor (TipTap)** *and* a **raw Markdown** mode with a live, editable preview. Content is sanitized with DOMPurify before render.
- **Posts** — drafts & publish, edit, delete, tags (max 5), auto-generated title / excerpt / reading time, unique slugs.
- **Discover** — paginated feed with **search** (stories *and* users), tag filters, and a popular-tags list.
- **Social** — clap, comment ("responses"), follow / unfollow, followers / following lists.
- **Profiles** — public profiles with an editable bio (public view strips private fields like email).
- **Team workspaces** — an account owner can grant another user **`full`** or **`read`** access to operate inside their account; backend-enforced, with read-only blocking and an audit trail. See [Team Member Access](#team-member-access).
- **Public REST API** — programmatic post management via **HTTP Basic Auth** (`apiKey:apiSecret`). See [Public API](#public-api-basic-auth).
- **Activity Log** — a centralized audit trail of every write action (web app *and* API), with 90-day retention and a detail panel.
- **Notifications** — in-app notifications for follows, claps, comments, and team adds, with an unread badge (event-driven, no polling).
- **UX** — custom hand-drawn toasts and confirm dialogs (no native `alert` / `confirm`).

---

## Tech Stack

| Layer       | Technology                                                        |
| ----------- | ----------------------------------------------------------------- |
| Frontend    | React 18, Vite 5, React Router 6, Zustand, Tailwind CSS 3         |
| Editor      | TipTap, `marked`, DOMPurify, Turndown                             |
| Backend     | Node.js (ESM), Express 4, Mongoose 8                              |
| Database    | MongoDB (Atlas or local)                                          |
| Auth        | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)                        |
| Hardening   | Helmet, CORS, `express-rate-limit`, `express-validator`          |

---

## Architecture

The backend follows a clean, layered flow — each request passes top-to-bottom:

```
route  →  middleware (auth → workspace → validate)  →  controller  →  service  →  model (Mongoose)
```

- **Routes** declare endpoints and attach middleware.
- **Middleware** handles auth (JWT/Basic), workspace resolution, read-only enforcement, validation, activity logging, and centralized error handling.
- **Controllers** are thin — they parse the request and shape the response via `ApiResponse`.
- **Services** hold all business logic and DB access.
- **Models** are Mongoose schemas with hooks and instance methods.

Cross-cutting pieces:
- **`activityLog.middleware`** — the single place every successful non-GET request is recorded.
- **`workspace.middleware`** — resolves the active account from the `X-Workspace-Id` header and enforces role permissions.
- **`error.middleware`** — maps errors to a consistent JSON shape; hides internals in production.

---

## Project Structure

```
scribble/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── api/                 # axios wrappers per resource
│   │   ├── components/          # activity/ feedback/ layout/ post/ ui/ user/
│   │   ├── hooks/               # useAuth
│   │   ├── lib/                 # axios instance, content (md/html) helpers
│   │   ├── pages/               # Home, PostDetail, Profile, settings/, …
│   │   ├── store/               # zustand: auth, workspace, notification
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js           # dev proxy: /api → http://localhost:5000
│
└── server/                      # Express + Mongoose backend
    ├── server.js                # entry point
    ├── scripts/                 # one-off maintenance scripts
    └── src/
        ├── app.js               # express app: helmet, cors, rate-limit, routers
        ├── config/              # env.js, database.js
        ├── controllers/         # auth, post, comment, user, team, apiKey, activity, notification
        ├── middleware/          # auth, basicAuth, workspace, validate, activityLog, error
        ├── models/              # user, post, comment, teamMember, activityLog, notification
        ├── routes/              # one router per resource + index + public
        ├── services/            # business logic per resource
        ├── utils/               # ApiError, ApiResponse, asyncHandler, tokens
        └── validators/          # express-validator schemas
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- A **MongoDB** connection string (MongoDB Atlas free tier or a local `mongod`)

### 1. Clone

```bash
git clone https://github.com/trex-ayush/scribble.git
cd scribble
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env        # then edit .env (see below)
npm run dev                 # starts on http://localhost:5000 with nodemon
```

> Generate strong JWT secrets for `.env`, e.g. `openssl rand -base64 48`. The server logs a `[SECURITY]` warning on startup if a secret is weak or a placeholder.

### 3. Frontend

```bash
cd ../client
npm install
npm run dev                 # starts on http://localhost:5173
```

The Vite dev server proxies `/api` → `http://localhost:5000`, so no client-side env file is needed for local development.

### 4. Open

Visit **http://localhost:5173**.

### Production build

```bash
cd client && npm run build  # outputs client/dist
cd ../server && npm start    # node server.js
```

---

## Environment Variables

Create `server/.env` (template in `server/.env.example`):

| Variable                 | Required | Default                 | Description                                              |
| ------------------------ | -------- | ----------------------- | -------------------------------------------------------- |
| `NODE_ENV`               | no       | `development`           | `production` enables secure cookies & rate limits        |
| `PORT`                   | no       | `5000`                  | Backend port                                             |
| `MONGODB_URI`            | **yes**  | —                       | MongoDB connection string                                |
| `JWT_SECRET`             | **yes**  | —                       | Secret for access tokens (use 32+ random chars)          |
| `JWT_EXPIRES_IN`         | no       | `15m`                   | Access-token lifetime                                    |
| `JWT_REFRESH_SECRET`     | **yes**  | —                       | Secret for refresh tokens (different 32+ random chars)   |
| `JWT_REFRESH_EXPIRES_IN` | no       | `30d`                   | Refresh-token lifetime                                   |
| `CLIENT_URL`             | no       | `http://localhost:5173` | Allowed CORS origin                                      |

> `.env` is git-ignored. Never commit real secrets.

---

## API Reference

Base URL: `/api/v1`. Web-app routes authenticate via the `accessToken` **httpOnly cookie** (or `Authorization: Bearer <token>`). Responses use a consistent envelope:

```json
{ "statusCode": 200, "data": { }, "message": "Success", "success": true }
```

### Auth — `/auth`
| Method | Path        | Auth      | Description                          |
| ------ | ----------- | --------- | ------------------------------------ |
| POST   | `/register` | public    | Create account, set cookies          |
| POST   | `/login`    | public    | Log in with `identifier` + `password`|
| POST   | `/refresh`  | cookie    | Rotate tokens                         |
| POST   | `/logout`   | required  | Clear cookies, revoke refresh token   |
| GET    | `/me`       | required  | Current user                          |

### Users — `/users`
| Method | Path                    | Auth     | Description                  |
| ------ | ----------------------- | -------- | ---------------------------- |
| GET    | `/search?q=`            | public   | Search users                 |
| GET    | `/:username`            | public   | Public profile (PII-stripped)|
| GET    | `/:username/posts`      | optional | A user's posts               |
| GET    | `/:username/followers`  | public   | Followers list               |
| GET    | `/:username/following`  | public   | Following list               |
| PUT    | `/me/profile`           | required | Update name / bio            |
| POST   | `/:username/follow`     | required | Toggle follow                |

### Posts — `/posts`
| Method | Path          | Auth     | Description                       |
| ------ | ------------- | -------- | --------------------------------- |
| GET    | `/`           | public   | Feed (`page`, `tag`, `search`, `limit`) |
| GET    | `/tags`       | public   | Popular tags                      |
| GET    | `/:slug`      | optional | Single published post             |
| GET    | `/drafts`     | required | Your drafts (workspace-scoped)    |
| GET    | `/:id/edit`   | required | Editable post by id               |
| POST   | `/`           | required | Create post                       |
| PUT    | `/:id`        | required | Update post                       |
| DELETE | `/:id`        | required | Delete post                       |
| POST   | `/:id/clap`   | required | Toggle clap                       |

### Comments — `/posts`
| Method | Path                | Auth     | Description           |
| ------ | ------------------- | -------- | --------------------- |
| GET    | `/:slug/comments`   | public   | List comments         |
| POST   | `/:slug/comments`   | required | Add comment           |
| DELETE | `/comments/:id`     | required | Delete own comment    |

### Notifications — `/notifications`
| Method | Path             | Auth     | Description            |
| ------ | ---------------- | -------- | ---------------------- |
| GET    | `/`              | required | List + unread count    |
| GET    | `/unread-count`  | required | Unread count only      |
| PATCH  | `/read-all`      | required | Mark all read          |
| PATCH  | `/:id/read`      | required | Mark one read          |

### Team — `/team`
| Method | Path                     | Auth     | Description                         |
| ------ | ------------------------ | -------- | ----------------------------------- |
| GET    | `/`                      | required | Owner's team members                |
| POST   | `/members`               | required | Add a member (`username`, `role`)   |
| PATCH  | `/members/:memberId/role`| required | Change a member's role              |
| DELETE | `/members/:memberId`     | required | Remove a member                     |
| GET    | `/mine`                  | required | Teams you belong to                 |
| POST   | `/access/:ownerId`       | required | Record an "Access Now" audit event  |

### API Keys — `/api-keys`
| Method | Path        | Auth     | Description                   |
| ------ | ----------- | -------- | ----------------------------- |
| GET    | `/`         | required | Current API settings          |
| POST   | `/generate` | required | Create / rotate credentials   |
| PATCH  | `/toggle`   | required | Enable / disable API access   |
| DELETE | `/`         | required | Revoke credentials            |

### Activity — `/activity`
| Method | Path | Auth     | Description                   |
| ------ | ---- | -------- | ----------------------------- |
| GET    | `/`  | required | Paginated activity log        |

---

## Team Member Access

An account **owner** can add another existing user as a team member with a role:

- **`full`** — create, update, delete, publish on the owner's content.
- **`read`** — read-only; all write methods are rejected.

How it works:
- The client sends an **`X-Workspace-Id: <ownerId>`** header to act inside that owner's account.
- `resolveWorkspace` middleware verifies an **accepted membership** before granting context — the header alone is never trusted.
- `enforceReadOnly` centrally blocks every write for `read` members.
- Members are **hard-blocked** from managing the owner's team list or API keys (`blockImpersonation`).
- Every action a member performs is recorded in the **owner's** activity log, attributed to the member.

---

## Public API (Basic Auth)

Generate credentials in **Settings → API**, then call write endpoints with HTTP Basic Auth (`apiKey` as username, `apiSecret` as password):

```bash
curl -u sk_xxx:secret_xxx \
  -X POST https://your-host/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello API","content":"Posted via the public API","status":"published"}'
```

Available: `POST /posts`, `PUT /posts/:id`, `DELETE /posts/:id`, `POST /posts/:id/clap`. Reads use the standard web routes.

---

## Notifications

Notifications are created server-side from the relevant action (follow, clap, comment, team add), skipping self-actions and de-duplicating repeated follows/claps. The navbar bell refreshes the unread count **event-driven** — on mount, when the tab regains focus, and when the dropdown opens — so there is **no background polling**. Notifications auto-expire after 90 days.

---

## Security

The codebase has been through a security pass. Highlights:

- JWT secrets are validated on boot; weak/placeholder secrets log a warning.
- Public profile responses strip `email`, `apiKey`, and credentials.
- Post create/update **whitelist** writable fields (no mass assignment of `author`, `slug`, `claps`, timestamps).
- Feed search escapes input (ReDoS / NoSQL operator-injection safe).
- Dedicated **rate limiter** on `/auth` (login / register / refresh).
- The activity log derives the owning account from the **validated** workspace owner, never the raw header (prevents audit-log injection).
- Passwords hashed with bcrypt; secure `httpOnly` + `sameSite` cookies in production; Helmet + locked-down CORS.

Found a vulnerability? Please report it privately rather than opening a public issue.

---

## Scripts

| Location                              | Purpose                                                        |
| ------------------------------------- | -------------------------------------------------------------- |
| `server/scripts/cleanup-test-data.js` | Remove test accounts and their content created during dev/testing. Run with `node scripts/cleanup-test-data.js` from `server/`. |

---

## Contributing

Contributions are welcome! `main` is **protected** — all changes land via pull request.

### Workflow

1. **Fork** the repo (external contributors) or create a branch (collaborators).
2. **Branch off `main`** with a descriptive name:
   ```bash
   git checkout main && git pull
   git checkout -b feat/<short-name>      # or fix/, chore/, docs/, style/
   ```
3. **Make your change.** Keep it focused — one concern per PR.
4. **Match the existing style** (see below) and make sure both apps run:
   ```bash
   cd client && npm run build             # frontend must build clean
   cd ../server && npm run dev            # backend must boot without errors
   ```
5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add bookmark/reading-list
   fix: prevent duplicate clap notifications
   docs: expand API reference
   ```
6. **Push** your branch and **open a Pull Request** against `main` with a clear description (what & why; screenshots for UI changes).
7. A maintainer reviews and merges.

### Branch naming

`feat/…`, `fix/…`, `chore/…`, `docs/…`, `style/…`, `refactor/…`

### Code style & conventions

- **Backend:** keep the `route → controller → service → model` layering. Controllers stay thin; business logic and DB access live in services. Throw `ApiError.*` for expected errors; respond via `ApiResponse.*`. Validate input with `express-validator` schemas in `validators/`.
- **Frontend:** functional components + hooks. Global state in Zustand stores (`store/`); API calls in `api/` wrappers using the shared axios instance. Tailwind for styling — follow the existing hand-drawn design tokens (`pencil`, `paper`, `accent`, `shadow-hard`, etc.).
- **Security:** never trust client-provided IDs or roles; enforce ownership/permissions on the server. Don't log secrets. Don't expose internal fields in API responses.
- **No secrets in commits.** `.env` is git-ignored — keep it that way.

### Reporting issues

Open a GitHub issue with steps to reproduce, expected vs. actual behavior, and environment details. For security issues, report privately.

---

> Built with a pencil ✏️ — happy scribbling.
