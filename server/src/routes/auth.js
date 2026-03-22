import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });
    const token = signToken(user._id.toString());
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(user._id.toString());
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.userId).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user._id, email: user.email, name: user.name } });
});

export default router;
