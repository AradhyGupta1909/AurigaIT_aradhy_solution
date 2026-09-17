const db = require('../db/database');

function findByPhone(phone) {
  return db.prepare('SELECT id, name, phone, password_hash, role, created_at FROM users WHERE phone = ?').get(phone);
}

function create({ name, phone, passwordHash, role = 'customer' }) {
  const result = db.prepare(`
    INSERT INTO users (name, phone, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run(name, phone, passwordHash, role);

  return db.prepare('SELECT id, name, phone, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
}

module.exports = { findByPhone, create };
