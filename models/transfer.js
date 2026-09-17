const db = require('../db/database');

function findAllBySubscription(subscriptionId) {
  return db.prepare(`
    SELECT id, subscription_id, from_customer_id, to_customer_id, transferred_on, created_at
    FROM subscription_transfers
    WHERE subscription_id = ?
    ORDER BY transferred_on ASC, id ASC
  `).all(subscriptionId);
}

function findOwnerBefore(subscriptionId, date, originalCustomerId) {
  const transfer = db.prepare(`
    SELECT to_customer_id
    FROM subscription_transfers
    WHERE subscription_id = ? AND transferred_on < ?
    ORDER BY transferred_on DESC, id DESC
    LIMIT 1
  `).get(subscriptionId, date);
  return transfer ? transfer.to_customer_id : originalCustomerId;
}

function create({ subscriptionId, fromCustomerId, toCustomerId, transferredOn }) {
  const result = db.prepare(`
    INSERT INTO subscription_transfers (subscription_id, from_customer_id, to_customer_id, transferred_on)
    VALUES (?, ?, ?, ?)
  `).run(subscriptionId, fromCustomerId, toCustomerId, transferredOn);
  return db.prepare('SELECT id, subscription_id, from_customer_id, to_customer_id, transferred_on, created_at FROM subscription_transfers WHERE id = ?').get(result.lastInsertRowid);
}

module.exports = { findAllBySubscription, findOwnerBefore, create };