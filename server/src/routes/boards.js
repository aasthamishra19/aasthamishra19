import { Router } from 'express';
import Board from '../models/Board.js';
import { authRequired } from '../middleware/auth.js';
import { getProjectRole, canManageProject, canEditTasks } from '../lib/projectAccess.js';

const router = Router();
router.use(authRequired);

router.get('/:boardId', async (req, res) => {
  const board = await Board.findById(req.params.boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const { role } = await getProjectRole(req.userId, board.project.toString());
  if (!role) return res.status(403).json({ error: 'Forbidden' });
  res.json({ board });
});

router.patch('/:boardId/columns', async (req, res) => {
  const board = await Board.findById(req.params.boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const { role } = await getProjectRole(req.userId, board.project.toString());
  if (!canManageProject(role)) return res.status(403).json({ error: 'Forbidden' });
  const { columns } = req.body;
  if (!Array.isArray(columns)) return res.status(400).json({ error: 'columns array required' });
  board.columns = columns.map((c, i) => ({
    id: c.id,
    title: String(c.title).slice(0, 80),
    order: c.order ?? i,
  }));
  await board.save();
  res.json({ board });
});

router.post('/:boardId/columns', async (req, res) => {
  const board = await Board.findById(req.params.boardId);
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const { role } = await getProjectRole(req.userId, board.project.toString());
  if (!canEditTasks(role)) return res.status(403).json({ error: 'Forbidden' });
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const maxOrder = board.columns.reduce((m, c) => Math.max(m, c.order), -1);
  board.columns.push({ title: String(title).slice(0, 80), order: maxOrder + 1 });
  await board.save();
  res.json({ board });
});

export default router;
