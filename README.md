# ✏️ Scribble

A Medium-style writing platform built with the **MERN stack** — read, write, and share stories with a hand-drawn, sketchbook aesthetic.

## Features

- **Auth** — register / login with email *or* username, JWT (httpOnly cookies) with refresh-token rotation
- **Write** — rich-text editor (TipTap) **and** raw Markdown with live, editable preview
- **Posts** — drafts, publish, edit, delete, tags, auto-generated titles, reading time
- **Discover** — feed with search (stories *and* users), tag filters, pagination
- **Social** — clap, comment, follow/unfollow, followers/following lists
- **Profiles** — public profiles, editable bio
- **Activity Log** — centralized audit trail of every write action, with event-data detail panel
- **UX** — custom hand-drawn toasts & confirm dialogs (no native alerts)

## Tech Stack

| Layer    | Tech                                            |
| -------- | ----------------------------------------------- |
| Frontend | React, Vite, React Router, Zustand, TailwindCSS |
| Editor   | TipTap, marked, DOMPurify, Turndown             |
| Backend  | Node.js, Express, Mongoose                       |
| Database | MongoDB (Atlas)                                 |
| Auth     | JWT + bcrypt                                     |

## Project Structure

```
scribble/
├── client/          # React + Vite frontend
│   └── src/
│       ├── api/         # axios API modules
│       ├── components/  # ui, layout, post, user, feedback, activity
│       ├── pages/       # route pages
│       ├── store/       # zustand auth store
│       └── lib/         # axios instance, content helpers
└── server/          # Express + MongoDB backend
    └── src/
        ├── config/      # env, database
        ├── models/      # User, Post, Comment, ActivityLog
        ├── services/    # business logic
        ├── controllers/ # HTTP handlers
        ├── routes/      # route definitions
        ├── middleware/  # auth, error, validate, activity logger
        └── validators/  # express-validator schemas
```

## Getting Started

### Backend

```bash
cd server
cp .env.example .env     # fill in MONGODB_URI + JWT secrets
npm install
npm run dev              # http://localhost:5000
```

### Frontend

```bash
cd client
npm install
npm run dev              # http://localhost:5173
```

## Architecture Notes

- **SOLID / DRY** — thin controllers delegate to a service layer; shared `ApiError` / `ApiResponse` utilities.
- **Centralized activity logging** — a single middleware records every successful non-GET request; controllers stay clean.
- **Reusable UI** — `Button`, `Input`, `Card`, `Pagination`, toast/confirm `FeedbackProvider`.

---

Built with ❤️ and a pencil.
