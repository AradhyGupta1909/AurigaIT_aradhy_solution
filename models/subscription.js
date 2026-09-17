const db = require('../db/database');

function findAll({ limit = 50, offset = 0 } = {}) {
  return db.prepare(`
    SELECT id, customer_id, plan_id, start_date, status
    FROM subscriptions
    ORDER BY start_date DESC, id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

function findById(id) {
  return db.prepare('SELECT id, customer_id, plan_id, start_date, status FROM subscriptions WHERE id = ?').get(id);
}

function create({ customerId, planId, startDate, status = 'active' }) {
  const result = db.prepare(`
    INSERT INTO subscriptions (customer_id, plan_id, start_date, status)
    VALUES (?, ?, ?, ?)
  `).run(customerId, planId, startDate, status);
  return findById(result.lastInsertRowid);
}

function update(id, { customerId, planId, startDate, status }) {
  const result = db.prepare(`
    UPDATE subscriptions
    SET customer_id = ?, plan_id = ?, start_date = ?, status = ?
    WHERE id = ?
  `).run(customerId, planId, startDate, status, id);
  return result.changes ? findById(id) : undefined;
}

function remove(id) {
  return db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id).changes > 0;
}

module.exports = { findAll, findById, create, update, remove };
