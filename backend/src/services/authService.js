import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

function toPublic(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    created_at: user.created_at,
  };
}

export async function register(email, password, firstName, lastName, role) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError('Cet email est déjà utilisé', 409);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [email, password_hash, firstName, lastName, role]
  );
  return toPublic(result.rows[0]);
}

export async function login(email, password) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  const user = result.rows[0];

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new AppError('Compte temporairement verrouillé. Réessayez plus tard.', 423);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const attempts = user.failed_login_attempts + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
      await pool.query('UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3', [attempts, lockedUntil, user.id]);
      throw new AppError('Trop de tentatives. Compte verrouillé pour 15 minutes.', 423);
    }
    await pool.query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [attempts, user.id]);
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  await pool.query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]);

  const payload = { userId: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  return { user: toPublic(user), token };
}

export async function getProfile(userId) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new AppError('Utilisateur non trouvé', 404);
  }
  return toPublic(result.rows[0]);
}

export async function updateProfile(userId, data) {
  const fields = [];
  const values = [];
  let index = 1;

  if (data.first_name !== undefined) { fields.push(`first_name = $${index++}`); values.push(data.first_name); }
  if (data.last_name !== undefined) { fields.push(`last_name = $${index++}`); values.push(data.last_name); }
  if (data.email !== undefined) { fields.push(`email = $${index++}`); values.push(data.email); }

  if (fields.length === 0) {
    throw new AppError('Aucune donnée à mettre à jour', 400);
  }

  values.push(userId);
  const result = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`, values);
  if (result.rows.length === 0) {
    throw new AppError('Utilisateur non trouvé', 404);
  }
  return toPublic(result.rows[0]);
}

export async function listUsers() {
  const result = await pool.query('SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY id');
  return result.rows;
}

export async function blockUser(userId, durationMinutes = 60) {
  const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  const result = await pool.query('UPDATE users SET locked_until = $1 WHERE id = $2 RETURNING id', [lockedUntil, userId]);
  if (result.rows.length === 0) {
    throw new AppError('Utilisateur non trouvé', 404);
  }
}

export async function unblockUser(userId) {
  const result = await pool.query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1 RETURNING id', [userId]);
  if (result.rows.length === 0) {
    throw new AppError('Utilisateur non trouvé', 404);
  }
}

export async function changePassword(userId, currentPassword, newPassword) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new AppError('Utilisateur non trouvé', 404);
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw new AppError('Mot de passe actuel incorrect', 401);
  }

  const password_hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, userId]);
}
