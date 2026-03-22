import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function attachUser(req, res, next) {
  if (!req.userId) return next();
  try {
    req.user = await User.findById(req.userId).select('-passwordHash');
    next();
  } catch {
    next();
  }
}
