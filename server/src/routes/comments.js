import { Router } from 'express';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import { authRequired } from '../middleware/auth.js';
import { getProjectRole, canEditTasks } from '../lib/projectAccess.js';
import Notification from '../models/Notification.js';

const router = Router();
router.use(authRequired);

router.get('/task/:taskId', async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { role } = await getProjectRole(req.userId, task.project.toString());
  if (!role) return res.status(403).json({ error: 'Forbidden' });
  const comments = await Comment.find({ task: task._id })
    .populate('author', 'name email')
    .sort({ createdAt: 1 });
  res.json({ comments });
});

router.post('/', async (req, res) => {
  const { taskId, body } = req.body;
  if (!taskId || !body?.trim()) return res.status(400).json({ error: 'taskId and body required' });
  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { role } = await getProjectRole(req.userId, task.project.toString());
  if (!canEditTasks(role)) return res.status(403).json({ error: 'Forbidden' });
  const comment = await Comment.create({ task: taskId, author: req.userId, body: body.trim() });
  const toNotify = new Set();
  if (task.assignee && task.assignee.toString() !== req.userId) {
    toNotify.add(task.assignee.toString());
  }
  if (task.reporter && task.reporter.toString() !== req.userId) {
    toNotify.add(task.reporter.toString());
  }
  for (const uid of toNotify) {
    await Notification.create({
      user: uid,
      type: 'comment',
      title: 'New comment',
      message: task.title,
      task: task._id,
      project: task.project,
    });
  }
  await comment.populate('author', 'name email');
  res.status(201).json({ comment });
});

router.delete('/:id', async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Not found' });
  const task = await Task.findById(comment.task);
  const { role } = await getProjectRole(req.userId, task.project.toString());
  if (!role) return res.status(403).json({ error: 'Forbidden' });
  if (comment.author.toString() !== req.userId && role !== 'owner' && role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await comment.deleteOne();
  res.json({ ok: true });
});

export default router;
