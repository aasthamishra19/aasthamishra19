import { Router } from 'express';
import Sprint from '../models/Sprint.js';
import Task from '../models/Task.js';
import { authRequired } from '../middleware/auth.js';
import { getProjectRole, canManageProject, canEditTasks } from '../lib/projectAccess.js';

const router = Router();
router.use(authRequired);

router.get('/project/:projectId', async (req, res) => {
  const { role } = await getProjectRole(req.userId, req.params.projectId);
  if (!role) return res.status(403).json({ error: 'Forbidden' });
  const sprints = await Sprint.find({ project: req.params.projectId }).sort({ startDate: -1 });
  res.json({ sprints });
});

router.post('/', async (req, res) => {
  const { projectId, name, goal, startDate, endDate, active } = req.body;
  if (!projectId || !name || !startDate || !endDate) {
    return res.status(400).json({ error: 'projectId, name, startDate, endDate required' });
  }
  const { role } = await getProjectRole(req.userId, projectId);
  if (!canManageProject(role)) return res.status(403).json({ error: 'Forbidden' });
  const sprint = await Sprint.create({
    project: projectId,
    name: name.trim(),
    goal: goal || '',
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    active: active !== false,
  });
  res.status(201).json({ sprint });
});

router.patch('/:id', async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);
  if (!sprint) return res.status(404).json({ error: 'Not found' });
  const { role } = await getProjectRole(req.userId, sprint.project.toString());
  if (!canManageProject(role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, goal, startDate, endDate, active } = req.body;
  if (name != null) sprint.name = name.trim();
  if (goal != null) sprint.goal = goal;
  if (startDate != null) sprint.startDate = new Date(startDate);
  if (endDate != null) sprint.endDate = new Date(endDate);
  if (active != null) sprint.active = active;
  await sprint.save();
  res.json({ sprint });
});

router.delete('/:id', async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);
  if (!sprint) return res.status(404).json({ error: 'Not found' });
  const { role } = await getProjectRole(req.userId, sprint.project.toString());
  if (!canManageProject(role)) return res.status(403).json({ error: 'Forbidden' });
  await Task.updateMany({ sprint: sprint._id }, { $set: { sprint: null } });
  await sprint.deleteOne();
  res.json({ ok: true });
});

router.post('/:id/tasks/:taskId', async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);
  if (!sprint) return res.status(404).json({ error: 'Sprint not found' });
  const { role } = await getProjectRole(req.userId, sprint.project.toString());
  if (!canEditTasks(role)) return res.status(403).json({ error: 'Forbidden' });
  const task = await Task.findOne({ _id: req.params.taskId, project: sprint.project });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.sprint = sprint._id;
  await task.save();
  const populated = await Task.findById(task._id)
    .populate('assignee', 'name email')
    .populate('sprint');
  res.json({ task: populated });
});

router.delete('/:id/tasks/:taskId', async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);
  if (!sprint) return res.status(404).json({ error: 'Sprint not found' });
  const { role } = await getProjectRole(req.userId, sprint.project.toString());
  if (!canEditTasks(role)) return res.status(403).json({ error: 'Forbidden' });
  await Task.updateOne(
    { _id: req.params.taskId, project: sprint.project, sprint: sprint._id },
    { $set: { sprint: null } }
  );
  res.json({ ok: true });
});

export default router;
