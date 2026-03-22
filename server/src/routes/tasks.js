import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Task from '../models/Task.js';
import Board from '../models/Board.js';
import { authRequired } from '../middleware/auth.js';
import { getProjectRole, canEditTasks } from '../lib/projectAccess.js';
import Notification from '../models/Notification.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safe);
  },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

const router = Router();
router.use(authRequired);

async function loadTaskWithAccess(taskId, userId) {
  const task = await Task.findById(taskId)
    .populate('assignee', 'name email')
    .populate('reporter', 'name email')
    .populate('sprint');
  if (!task) return { task: null, role: null };
  const { role } = await getProjectRole(userId, task.project.toString());
  return { task, role };
}

router.get('/project/:projectId', async (req, res) => {
  const { role } = await getProjectRole(req.userId, req.params.projectId);
  if (!role) return res.status(403).json({ error: 'Forbidden' });
  const tasks = await Task.find({ project: req.params.projectId })
    .populate('assignee', 'name email')
    .populate('reporter', 'name email')
    .populate('sprint')
    .sort({ columnId: 1, order: 1 });
  res.json({ tasks });
});

router.post('/', async (req, res) => {
  try {
    const { projectId, boardId, columnId, title, description, priority, assigneeId, sprintId, labels } =
      req.body;
    if (!projectId || !boardId || !columnId || !title) {
      return res.status(400).json({ error: 'projectId, boardId, columnId, title required' });
    }
    const { role } = await getProjectRole(req.userId, projectId);
    if (!canEditTasks(role)) return res.status(403).json({ error: 'Forbidden' });
    const board = await Board.findById(boardId);
    if (!board || board.project.toString() !== projectId) {
      return res.status(400).json({ error: 'Invalid board' });
    }
    const col = board.columns.find((c) => c.id === columnId);
    if (!col) return res.status(400).json({ error: 'Invalid column' });
    const maxOrder = await Task.find({ board: boardId, columnId }).then((ts) =>
      ts.reduce((m, t) => Math.max(m, t.order), -1)
    );
    const task = await Task.create({
      project: projectId,
      board: boardId,
      columnId,
      title: title.trim(),
      description: description || '',
      order: maxOrder + 1,
      priority: priority || 'medium',
      assignee: assigneeId || null,
      sprint: sprintId || null,
      reporter: req.userId,
      labels: Array.isArray(labels) ? labels : [],
    });
    if (assigneeId && assigneeId !== req.userId) {
      await Notification.create({
        user: assigneeId,
        type: 'assign',
        title: 'New assignment',
        message: title,
        task: task._id,
        project: projectId,
      });
    }
    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .populate('sprint');
    res.status(201).json({ task: populated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  const { task, role } = await loadTaskWithAccess(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Not found' });
  if (!role) return res.status(403).json({ error: 'Forbidden' });
  res.json({ task });
});

router.patch('/:id', async (req, res) => {
  const { task, role } = await loadTaskWithAccess(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Not found' });
  if (!canEditTasks(role)) return res.status(403).json({ error: 'Forbidden' });
  const {
    title,
    description,
    columnId,
    order,
    priority,
    assigneeId,
    sprintId,
    labels,
    reorderBatch,
  } = req.body;

  if (Array.isArray(reorderBatch)) {
    for (const item of reorderBatch) {
      if (!item.id) continue;
      await Task.updateOne(
        { _id: item.id, project: task.project },
        { columnId: item.columnId, order: item.order }
      );
    }
    const tasks = await Task.find({ project: task.project, board: task.board })
      .populate('assignee', 'name email')
      .populate('reporter', 'name email')
      .populate('sprint')
      .sort({ columnId: 1, order: 1 });
    return res.json({ tasks });
  }

  if (title != null) task.title = title.trim();
  if (description != null) task.description = description;
  if (priority != null) task.priority = priority;
  if (labels != null) task.labels = labels;
  if (sprintId !== undefined) task.sprint = sprintId || null;

  if (assigneeId !== undefined) {
    const prev = task.assignee?.toString();
    task.assignee = assigneeId || null;
    if (assigneeId && assigneeId !== req.userId && assigneeId !== prev) {
      await Notification.create({
        user: assigneeId,
        type: 'assign',
        title: 'Assigned to task',
        message: task.title,
        task: task._id,
        project: task.project,
      });
    }
  }

  if (columnId != null) {
    const board = await Board.findById(task.board);
    if (board?.columns.some((c) => c.id === columnId)) task.columnId = columnId;
  }
  if (order != null) task.order = Number(order);

  await task.save();
  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email')
    .populate('reporter', 'name email')
    .populate('sprint');
  res.json({ task: populated });
});

router.delete('/:id', async (req, res) => {
  const { task, role } = await loadTaskWithAccess(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Not found' });
  if (!canEditTasks(role)) return res.status(403).json({ error: 'Forbidden' });
  for (const a of task.attachments || []) {
    try {
      fs.unlinkSync(path.join(uploadDir, path.basename(a.path)));
    } catch {
      /* ignore */
    }
  }
  await Task.deleteOne({ _id: task._id });
  res.json({ ok: true });
});

router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  const { task, role } = await loadTaskWithAccess(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Not found' });
  if (!canEditTasks(role)) return res.status(403).json({ error: 'Forbidden' });
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const rel = `/uploads/${req.file.filename}`;
  task.attachments.push({
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: rel,
    uploadedBy: req.userId,
  });
  await task.save();
  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email')
    .populate('reporter', 'name email');
  res.json({ task: populated });
});

export default router;
