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
app.set('trust proxy', 1);

const PORT = Number(process.env.PORT) || 5000;
const DEFAULT_ORIGINS = ['http://localhost:5173'];
function allowedOrigins() {
  const raw = process.env.CLIENT_URL || '';
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : DEFAULT_ORIGINS;
}

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (process.env.NODE_ENV !== 'production') {
        if (/^https?:\/\/localhost:\d+$/.test(origin) || /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
          return cb(null, true);
        }
      }
      const ok = allowedOrigins().includes(origin);
      cb(null, ok);
    },
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

async function connectDb() {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flowtrack';
  if (uri === 'memory') {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        'MONGODB_URI=memory is not allowed in production. Set MONGODB_URI to your MongoDB Atlas connection string.'
      );
      process.exit(1);
    }
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('Dev: using in-memory MongoDB (data resets when server stops)');
  }
  await mongoose.connect(uri);
}

connectDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
