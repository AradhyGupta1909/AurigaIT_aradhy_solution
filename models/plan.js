const db = require('../db/database');

function findAll({ limit = 50, offset = 0 } = {}) {
  return db.prepare(`
    SELECT id, name, price, description
    FROM plans
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

function findById(id) {
  return db.prepare('SELECT id, name, price, description FROM plans WHERE id = ?').get(id);
}

function create({ name, price, description = '' }) {
  const result = db.prepare('INSERT INTO plans (name, price, description) VALUES (?, ?, ?)').run(name, price, description);
  return findById(result.lastInsertRowid);
}

function update(id, { name, price, description = '' }) {
  const result = db.prepare('UPDATE plans SET name = ?, price = ?, description = ? WHERE id = ?').run(name, price, description, id);
  return result.changes ? findById(id) : undefined;
}

function remove(id) {
  return db.prepare('DELETE FROM plans WHERE id = ?').run(id).changes > 0;
}

module.exports = { findAll, findById, create, update, remove };
