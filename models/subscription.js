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

function findActiveForCustomerOnDate(customerId, date) {
  return db.prepare(`
    SELECT subscriptions.id, subscriptions.customer_id, subscriptions.plan_id, subscriptions.start_date, subscriptions.status
    FROM subscriptions
    WHERE customer_id = ? AND status = 'active' AND start_date <= ?
      AND NOT EXISTS (
        SELECT 1 FROM pauses WHERE pauses.subscription_id = subscriptions.id
          AND pauses.paused_from <= ? AND (pauses.paused_to IS NULL OR pauses.paused_to >= ?)
      )
    ORDER BY id DESC LIMIT 1
  `).get(customerId, date, date, date);
}

function findAllWithDetails({ limit = 50, offset = 0 } = {}) {
  return db.prepare(`
    SELECT
      subscriptions.id,
      subscriptions.customer_id,
      customers.name AS customer_name,
      customers.phone AS customer_phone,
      subscriptions.plan_id,
      plans.name AS plan_name,
      plans.price AS plan_price,
      subscriptions.start_date,
      subscriptions.status
    FROM subscriptions
    JOIN customers ON customers.id = subscriptions.customer_id
    JOIN plans ON plans.id = subscriptions.plan_id
    ORDER BY subscriptions.start_date DESC, subscriptions.id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

function findForBilling(id) {
  return db.prepare(`
    SELECT
      subscriptions.id,
      subscriptions.customer_id,
      customers.name AS customer_name,
      customers.phone AS customer_phone,
      subscriptions.plan_id,
      plans.name AS plan_name,
      plans.price AS plan_price,
      subscriptions.start_date,
      subscriptions.status
    FROM subscriptions
    JOIN customers ON customers.id = subscriptions.customer_id
    JOIN plans ON plans.id = subscriptions.plan_id
    WHERE subscriptions.id = ?
  `).get(id);
}

function findAllForBilling() {
  return db.prepare(`
    SELECT
      subscriptions.id,
      subscriptions.customer_id,
      customers.name AS customer_name,
      customers.phone AS customer_phone,
      subscriptions.plan_id,
      plans.name AS plan_name,
      plans.price AS plan_price,
      subscriptions.start_date,
      subscriptions.status
    FROM subscriptions
    JOIN customers ON customers.id = subscriptions.customer_id
    JOIN plans ON plans.id = subscriptions.plan_id
    ORDER BY subscriptions.id ASC
  `).all();
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

function updateStatus(id, status) {
  const result = db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?').run(status, id);
  return result.changes ? findById(id) : undefined;
}

function remove(id) {
  return db.prepare('DELETE FROM subscriptions WHERE id = ?').run(id).changes > 0;
}

module.exports = { findAll, findById, findActiveForCustomerOnDate, findAllWithDetails, findForBilling, findAllForBilling, create, update, updateStatus, remove };
