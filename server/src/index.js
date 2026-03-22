import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import boardRoutes from './routes/boards.js';
import taskRoutes from './routes/tasks.js';
import sprintRoutes from './routes/sprints.js';
import commentRoutes from './routes/comments.js';
import notificationRoutes from './routes/notifications.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flowtrack')
  .then(() => {
    app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
