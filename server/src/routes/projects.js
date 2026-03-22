import { Router } from 'express';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Board from '../models/Board.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import Sprint from '../models/Sprint.js';
import { authRequired } from '../middleware/auth.js';
import { getProjectRole, canManageProject } from '../lib/projectAccess.js';
import Notification from '../models/Notification.js';

const router = Router();
router.use(authRequired);

router.get('/', async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.userId }, { 'members.user': req.userId }],
  })
    .populate('owner', 'name email')
    .sort({ updatedAt: -1 });
  res.json({ projects });
});

router.post('/', async (req, res) => {
  try {
    const { name, description, key } = req.body;
    if (!name || !key) return res.status(400).json({ error: 'name and key required' });
    const cleanKey = String(key).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (cleanKey.length < 2) return res.status(400).json({ error: 'key must be 2–6 letters/numbers' });
    const project = await Project.create({
      name: name.trim(),
      description: description || '',
      key: cleanKey,
      owner: req.userId,
      members: [],
    });
    const board = await Board.create({
      project: project._id,
      name: 'Main board',
      columns: [
        { title: 'To Do', order: 0 },
        { title: 'In Progress', order: 1 },
        { title: 'Done', order: 2 },
      ],
    });
    res.status(201).json({ project, boardId: board._id });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Project key already exists' });
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  const { project, role } = await getProjectRole(req.userId, req.params.id);
  if (!role) return res.status(404).json({ error: 'Project not found' });
  await project.populate('owner', 'name email');
  await project.populate('members.user', 'name email');
  const boards = await Board.find({ project: project._id });
  res.json({ project, role, boards });
});

router.patch('/:id', async (req, res) => {
  const { project, role } = await getProjectRole(req.userId, req.params.id);
  if (!role) return res.status(404).json({ error: 'Project not found' });
  if (!canManageProject(role)) return res.status(403).json({ error: 'Forbidden' });
  const { name, description } = req.body;
  if (name != null) project.name = name.trim();
  if (description != null) project.description = description;
  await project.save();
  res.json({ project });
});

router.delete('/:id', async (req, res) => {
  const { project, role } = await getProjectRole(req.userId, req.params.id);
  if (!role) return res.status(404).json({ error: 'Project not found' });
  if (role !== 'owner') return res.status(403).json({ error: 'Only owner can delete project' });
  const taskIds = await Task.find({ project: project._id }).distinct('_id');
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ project: project._id });
  await Sprint.deleteMany({ project: project._id });
  await Board.deleteMany({ project: project._id });
  await Notification.deleteMany({ project: project._id });
  await project.deleteOne();
  res.json({ ok: true });
});

router.post('/:id/members', async (req, res) => {
  const { project, role } = await getProjectRole(req.userId, req.params.id);
  if (!role) return res.status(404).json({ error: 'Project not found' });
  if (!canManageProject(role)) return res.status(403).json({ error: 'Forbidden' });
  const { email, memberRole } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const r = ['owner', 'admin', 'member'].includes(memberRole) ? memberRole : 'member';
  if (r === 'owner') return res.status(400).json({ error: 'Cannot add second owner' });
  if (project.owner.toString() === user._id.toString()) {
    return res.status(400).json({ error: 'User is already owner' });
  }
  const exists = project.members.some((m) => m.user.toString() === user._id.toString());
  if (exists) return res.status(409).json({ error: 'Already a member' });
  project.members.push({ user: user._id, role: r });
  await project.save();
  await Notification.create({
    user: user._id,
    type: 'project',
    title: 'Added to project',
    message: `You were added to ${project.name}`,
    project: project._id,
  });
  await project.populate('members.user', 'name email');
  res.json({ project });
});

router.patch('/:id/members/:userId', async (req, res) => {
  const { project, role } = await getProjectRole(req.userId, req.params.id);
  if (!role) return res.status(404).json({ error: 'Project not found' });
  if (!canManageProject(role)) return res.status(403).json({ error: 'Forbidden' });
  const { memberRole } = req.body;
  if (memberRole === 'owner') return res.status(400).json({ error: 'Invalid role' });
  const mem = project.members.find((m) => m.user.toString() === req.params.userId);
  if (!mem) return res.status(404).json({ error: 'Member not found' });
  if (['admin', 'member'].includes(memberRole)) mem.role = memberRole;
  await project.save();
  await project.populate('members.user', 'name email');
  res.json({ project });
});

router.delete('/:id/members/:userId', async (req, res) => {
  const { project, role } = await getProjectRole(req.userId, req.params.id);
  if (!role) return res.status(404).json({ error: 'Project not found' });
  if (!canManageProject(role)) return res.status(403).json({ error: 'Forbidden' });
  if (req.params.userId === project.owner.toString()) {
    return res.status(400).json({ error: 'Cannot remove owner' });
  }
  project.members = project.members.filter((m) => m.user.toString() !== req.params.userId);
  await project.save();
  res.json({ project });
});

export default router;
