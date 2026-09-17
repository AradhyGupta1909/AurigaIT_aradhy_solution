const db = require('../db/database');

function notify(customerId, message, subscriptionId) {
  if (!subscriptionId) {
    const subscription = db.prepare(`
      SELECT id
      FROM subscriptions
      WHERE customer_id = ?
      ORDER BY id DESC
      LIMIT 1
    `).get(customerId);
    subscriptionId = subscription && subscription.id;
  }

  if (!subscriptionId) throw new Error('A subscription is required for an outbox notification');

  const result = db.prepare(`
    INSERT INTO outbox (customer_id, subscription_id, message)
    VALUES (?, ?, ?)
  `).run(customerId, subscriptionId, message);

  return db.prepare('SELECT id, customer_id, subscription_id, message, sent_at FROM outbox WHERE id = ?').get(result.lastInsertRowid);
}

function findAll() {
  return db.prepare(`
    SELECT id, customer_id, subscription_id, message, sent_at
    FROM outbox
    ORDER BY sent_at DESC, id DESC
  `).all();
}

module.exports = { notify, findAll };