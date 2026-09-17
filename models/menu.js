const db = require('../db/database');

function findAll({ availableOnly = false } = {}) {
  return db.prepare(`
    SELECT id, name, price, description, available_today
    FROM menu_items
    ${availableOnly ? 'WHERE available_today = 1' : ''}
    ORDER BY id DESC
  `).all();
}

function findById(id) {
  return db.prepare('SELECT id, name, price, description, available_today FROM menu_items WHERE id = ?').get(id);
}

function create({ name, price, description = '', availableToday = 1 }) {
  const result = db.prepare('INSERT INTO menu_items (name, price, description, available_today) VALUES (?, ?, ?, ?)').run(name, price, description, availableToday ? 1 : 0);
  return findById(result.lastInsertRowid);
}

function update(id, { name, price, description, availableToday }) {
  const result = db.prepare(`UPDATE menu_items SET name = ?, price = ?, description = ?, available_today = ? WHERE id = ?`).run(name, price, description, availableToday ? 1 : 0, id);
  return result.changes ? findById(id) : undefined;
}

function toggleAvailability(id) {
  const result = db.prepare('UPDATE menu_items SET available_today = CASE available_today WHEN 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
  return result.changes ? findById(id) : undefined;
}

module.exports = { findAll, findById, create, update, toggleAvailability };