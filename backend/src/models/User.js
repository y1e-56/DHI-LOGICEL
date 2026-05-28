const pool = require('../config/database');

class User {
  // Créer un nouvel utilisateur
  static async create(userData) {
    const { email, password, first_name, last_name, role } = userData;
    const query = `
      INSERT INTO users (email, password, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, is_active, created_at
    `;
    const values = [email, password, first_name, last_name, role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    const query = 'SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Mettre à jour un utilisateur
  static async update(id, userData) {
    const { first_name, last_name, role, is_active } = userData;
    const query = `
      UPDATE users
      SET first_name = $1, last_name = $2, role = $3, is_active = $4
      WHERE id = $5
      RETURNING id, email, first_name, last_name, role, is_active, updated_at
    `;
    const values = [first_name, last_name, role, is_active, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Supprimer un utilisateur (désactiver)
  static async deactivate(id) {
    const query = 'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, email, is_active';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Incrémenter les tentatives de connexion échouées
  static async incrementFailedAttempts(email) {
    const query = `
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1
      WHERE email = $1
      RETURNING failed_login_attempts
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Réinitialiser les tentatives de connexion échouées
  static async resetFailedAttempts(email) {
    const query = `
      UPDATE users
      SET failed_login_attempts = 0, locked_until = NULL
      WHERE email = $1
    `;
    await pool.query(query, [email]);
  }

  // Verrouiller un compte temporairement
  static async lockAccount(email, lockDurationMinutes = 30) {
    const lockedUntil = new Date(Date.now() + lockDurationMinutes * 60000);
    const query = `
      UPDATE users
      SET locked_until = $1
      WHERE email = $2
    `;
    await pool.query(query, [lockedUntil, email]);
  }

  // Vérifier si le compte est verrouillé
  static async isAccountLocked(email) {
    const query = 'SELECT locked_until FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    if (result.rows.length === 0) return false;
    
    const lockedUntil = result.rows[0].locked_until;
    if (!lockedUntil) return false;
    
    return new Date(lockedUntil) > new Date();
  }

  // Lister tous les utilisateurs
  static async findAll(filters = {}) {
    let query = 'SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE 1=1';
    const values = [];
    let paramCount = 0;

    if (filters.role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      values.push(filters.role);
    }

    if (filters.is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      values.push(filters.is_active);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = User;
