# Hello, I'm Aastha

Welcome to my GitHub profile. I focus on software development and competitive coding, and I like projects that blend creativity with solid engineering.

**Contact:** aasthamishraa19@gmail.com · [LinkedIn](https://linkedin.com/in/aastha-mishra19)

---

## Featured project: FlowTrack

This repository contains **FlowTrack**, a full-stack team task tracker (Jira-style): Kanban with drag-and-drop, roles (owner / admin / member), comments, attachments, sprint planning, and in-app notifications.

### Stack

- **Frontend:** React (Vite), React Router, [@dnd-kit](https://dndkit.com/)
- **Backend:** Node.js, Express, JWT
- **Database:** MongoDB (Mongoose)

### Local setup

1. **MongoDB** — Local or [Atlas](https://www.mongodb.com/cloud/atlas).
2. **API:** `cd server` → copy `.env.example` to `.env` → set `MONGODB_URI`, `JWT_SECRET` → `npm install` → `npm run dev` (port `5000`).
3. **Web:** `cd client` → `npm install` → `npm run dev` (port `5173`; Vite proxies `/api`).

From repo root: `npm install` → `npm run install:all` → `npm run dev`.

### Deploy

| Piece | Suggestion |
|-------|------------|
| Database | MongoDB Atlas |
| API | [Render](https://render.com) — root `server`, start `npm start`, env: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your site URL) |
| Frontend | [Vercel](https://vercel.com) — root `client`, build `npm run build`, output `dist`, env `VITE_API_URL` = API origin (no trailing slash) |

Set `CLIENT_URL` on the API to your exact frontend URL for CORS. Uploads use server disk; on free hosts they may not persist—consider cloud storage for production files.

### Roles

| Role | Capabilities |
|------|----------------|
| Owner | Full access; delete project |
| Admin | Project settings, members, sprints, board |
| Member | Tasks, comments, attachments |

Invites are by email; the person must **register** in the app first, then be added in **Project settings**.

### License

MIT
