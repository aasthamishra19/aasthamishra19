# Deploy FlowTrack (show your professor a live link)

Follow these steps in order. Total time: about **20–30 minutes** the first time.

## 1. MongoDB Atlas (free database)

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. Create a **free M0** cluster (any region).
3. **Database Access** → add a database user (username + password). Save the password.
4. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) so Render can connect.
5. **Database** → **Connect** → **Drivers** → copy the **connection string** (SRV).
6. Replace `<password>` with your user’s password (URL-encode special characters if needed).
7. Example shape:  
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/flowtrack?retryWrites=true&w=majority`

---

## 2. Deploy the API (Render)

1. Push this repo to GitHub (already done if you use your `aasthamishra19` repo).
2. Go to [https://render.com](https://render.com) → sign up with GitHub.
3. **New** → **Blueprint** → connect the repo → Render may detect `render.yaml`, or create a **Web Service** manually:
   - **Root directory:** `server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. **Environment** → add:

   | Key | Value |
   |-----|--------|
   | `MONGODB_URI` | Your Atlas SRV string (step 1) |
   | `JWT_SECRET` | Long random string (e.g. 32+ characters) |
   | `CLIENT_URL` | Your **frontend** URL from step 3 **exactly**, e.g. `https://your-app.vercel.app` (no trailing slash). You can add this **after** Vercel deploy, then **Manual Deploy → Clear build cache & deploy** on Render if CORS blocks you. |
   | `NODE_ENV` | `production` (often set automatically) |

5. Wait until the service is **Live**. Open `https://YOUR-SERVICE.onrender.com/api/health` — you should see `{"ok":true}`.

**Cold starts:** On the free tier the API may sleep after ~15 minutes. First request after sleep can take ~30–60 seconds.

---

## 3. Deploy the frontend (Vercel)

1. Go to [https://vercel.com](https://vercel.com) → import the **same** GitHub repo.
2. **Root Directory:** `client` (required — do not use the repo root, or the build will not find Vite).
3. **Framework Preset:** Vite  
4. **Build command:** `npm run build`  
5. **Output directory:** `dist`
6. **Environment Variables:**

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | Your Render API URL **with no trailing slash**, e.g. `https://flowtrack-api.onrender.com` |

7. Deploy. Copy the production URL (e.g. `https://flowtrack-xxx.vercel.app`).

---

## 4. Finish CORS

1. In **Render**, set `CLIENT_URL` to that **exact** Vercel URL (scheme + host, no path, no trailing slash).
2. If you use both `www` and non-`www`, set **comma-separated** URLs in `CLIENT_URL`, e.g.  
   `https://app.vercel.app,https://www.app.vercel.app`
3. Redeploy the API on Render (or it will pick up env changes on next deploy).

---

## 5. Demo checklist (for your professor)

1. Open the **Vercel** URL.
2. **Register** a user → **Create project** → use the **Board** (drag tasks with **⋮⋮**).
3. Open a task → **comments**, **priority**, **assignee**.
4. **Sprints** and **Settings** (roles / invite by email after the teammate registers).

---

## Troubleshooting

| Problem | What to check |
|--------|----------------|
| `vite: command not found` / build exit 127 | Set **Root Directory** to **`client`**. This project lists **Vite** under `dependencies` so production installs still get the CLI; redeploy after pulling latest. |
| Blank page / failed fetch | `VITE_API_URL` matches Render URL exactly; rebuild Vercel after changing it. |
| CORS error in browser console | `CLIENT_URL` on Render matches the browser address bar origin exactly. |
| API won’t start | `MONGODB_URI` correct; Atlas network allows `0.0.0.0/0`. |
| Attachments disappear | Free Render disk is ephemeral; attachments are a **demo** unless you add cloud storage (S3, etc.). |

---

## Run locally (no Atlas)

From repo root:

```bash
npm install
npm run install:all
```

`server/.env` (copy from `server/.env.example`):

- `MONGODB_URI=memory` — no local Mongo install; data clears when you stop the server.
- Or use a normal `mongodb://...` or Atlas URI.

Then:

```bash
npm run dev
```

App: [http://localhost:5173](http://localhost:5173) · API: port `5000`.
