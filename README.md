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

1. **Dependencies:** From repo root: `npm install` then `npm run install:all` (or install in `server/` and `client/` separately).
2. **API env:** `cd server` → copy `.env.example` to `.env` → set `JWT_SECRET`. For a quick demo **without** installing MongoDB, set `MONGODB_URI=memory` (data clears when you stop the server). For persistence, use local MongoDB or Atlas.
3. **Run both:** From repo root, `npm run dev` → app **[http://localhost:5173](http://localhost:5173)**, API port `5000`.

Windows shortcut: `.\scripts\setup-local.ps1` creates `server\.env` with in-memory MongoDB, installs deps, then run `npm run dev`.

### Deploy (live URL for demos)  

** check my project here :** https://aasthamishra19-h17w4rq06-aasthamishra19s-projects.vercel.app

Step-by-step: **[DEPLOY.md](./DEPLOY.md)** (MongoDB Atlas + Render API + Vercel).

| Piece | Where | Notes |
|-------|--------|--------|
| Database | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Free tier; allow `0.0.0.0/0` for Render |
| API | [Render](https://render.com) | Root **`server`**, `npm start`; optional **`render.yaml`** blueprint; env: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` |
| Frontend | [Vercel](https://vercel.com) | Root **`client`**, framework Vite, output **`dist`**; env: `VITE_API_URL` = your Render URL (no trailing slash) |

Set **`CLIENT_URL`** on the API to your **exact** Vercel origin (comma-separated for multiple domains). Attachments on free Render use **ephemeral** disk—fine for class demos.

### Roles

| Role | Capabilities |
|------|----------------|
| Owner | Full access; delete project |
| Admin | Project settings, members, sprints, board |
| Member | Tasks, comments, attachments |

Invites are by email; the person must **register** in the app first, then be added in **Project settings**.

### License

MIT
