import { Router } from 'express';
import Notification from '../models/Notification.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const notifications = await Notification.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('task', 'title')
    .populate('project', 'name key');
  res.json({ notifications });
});

router.patch('/:id/read', async (req, res) => {
  const n = await Notification.findOne({ _id: req.params.id, user: req.userId });
  if (!n) return res.status(404).json({ error: 'Not found' });
  n.read = true;
  await n.save();
  res.json({ notification: n });
});

router.post('/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.userId, read: false }, { $set: { read: true } });
  res.json({ ok: true });
});

export default router;
