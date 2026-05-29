import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token manquant' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Utilisateur non trouvé' });
      return;
    }
    req.user = result.rows[0];
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}
