const db = require('../db/database');

function findByEmail(email) {
  return db.prepare(`
    SELECT id, email, password_hash, created_at
    FROM users
    WHERE email = ?
  `).get(email.toLowerCase());
}

function findById(id) {
  return db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(id);
}

function create({ email, passwordHash }) {
  const result = db.prepare(`
    INSERT INTO users (email, password_hash)
    VALUES (?, ?)
  `).run(email.toLowerCase(), passwordHash);
  return findById(result.lastInsertRowid);
}

module.exports = { findByEmail, findById, create };
