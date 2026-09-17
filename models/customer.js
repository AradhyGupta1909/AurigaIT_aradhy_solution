const db = require('../db/database');

function findAll({ limit = 50, offset = 0 } = {}) {
  return db.prepare(`
    SELECT id, name, phone, created_at
    FROM customers
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

function findById(id) {
  return db.prepare('SELECT id, name, phone, created_at FROM customers WHERE id = ?').get(id);
}

function create({ name, phone }) {
  const result = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(name, phone);
  return findById(result.lastInsertRowid);
}

function update(id, { name, phone }) {
  const result = db.prepare('UPDATE customers SET name = ?, phone = ? WHERE id = ?').run(name, phone, id);
  return result.changes ? findById(id) : undefined;
}

function remove(id) {
  return db.prepare('DELETE FROM customers WHERE id = ?').run(id).changes > 0;
}

module.exports = { findAll, findById, create, update, remove };
