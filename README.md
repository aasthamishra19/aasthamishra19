# FlowTrack

Team task and project tracking: **Kanban boards** with drag-and-drop, **role-based access** (owner / admin / member), **comments**, **file attachments**, **sprint planning**, and **in-app notifications**.

## Stack

- **Frontend:** React (Vite), React Router, [@dnd-kit](https://dndkit.com/) for drag-and-drop
- **Backend:** Node.js, Express, JWT auth
- **Database:** MongoDB (Mongoose)

## Local setup

1. **MongoDB** — Install locally or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and copy the connection string.

2. **Server**

   ```bash
   cd server
   cp .env.example .env
   # Edit .env: MONGODB_URI, JWT_SECRET (long random string)
   npm install
   npm run dev
   ```

   API runs at `http://localhost:5000`.

3. **Client**

   ```bash
   cd client
   npm install
   npm run dev
   ```

   App runs at `http://localhost:5173` (Vite proxies `/api` and `/uploads` to the server).

4. **Optional — run both from repo root**

   ```bash
   npm install
   npm run install:all
   npm run dev
   ```

## Environment variables

| Location | Variable | Purpose |
|----------|----------|---------|
| `server/.env` | `MONGODB_URI` | MongoDB connection string |
| `server/.env` | `JWT_SECRET` | Secret for signing JWTs |
| `server/.env` | `PORT` | API port (default `5000`) |
| `server/.env` | `CLIENT_URL` | Allowed CORS origin (e.g. your Vercel URL) |
| `client/.env` | `VITE_API_URL` | Production API base URL (empty in local dev) |

## Deploy

### MongoDB Atlas

Create a free cluster, database user, and network access (`0.0.0.0/0` for a public API). Use the SRV connection string as `MONGODB_URI`.

### Backend (example: [Render](https://render.com))

1. New **Web Service**, connect this repo, **root directory** `server`.
2. Build: `npm install` (or leave default). Start: `npm start`.
3. Set env: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend URL).

**Note:** File uploads are stored on disk. On free PaaS, disks are often ephemeral. For durable files, add S3/Cloudinary later or treat attachments as a demo feature.

### Frontend (example: [Vercel](https://vercel.com))

1. New project, **root directory** `client`, framework Vite.
2. Build: `npm run build`, output `dist`.
3. Env: `VITE_API_URL` = your deployed API URL (no trailing slash), e.g. `https://flowtrack-api.onrender.com`.

After deploy, set `CLIENT_URL` on the server to your exact Vercel URL (including `https://`).

## GitHub

From this folder (not your user home directory):

```bash
git init
git add .
git commit -m "Add FlowTrack full-stack project management app"
git branch -M main
git remote add origin https://github.com/aasthamishra19/aasthamishra19.git
git push -u origin main
```

If the remote already has commits, run `git pull origin main --allow-unrelated-histories`, resolve conflicts, then `git push`.

## Roles

| Role | Capabilities |
|------|----------------|
| **Owner** | Full access; delete project |
| **Admin** | Edit project, manage members and roles, sprints, columns, tasks |
| **Member** | Board, tasks, comments, attachments |

Invites are by **email**; the user must **register** first, then an admin/owner can add them by email in **Project settings**.

## License

MIT
