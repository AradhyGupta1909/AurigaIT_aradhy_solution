const db = require('../db/database');

function findAll({ limit = 50, offset = 0 } = {}) {
  return db.prepare(`
    SELECT id, subscription_id, paused_from, paused_to
    FROM pauses
    ORDER BY paused_from DESC, id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

function findById(id) {
  return db.prepare('SELECT id, subscription_id, paused_from, paused_to FROM pauses WHERE id = ?').get(id);
}

function create({ subscriptionId, pausedFrom, pausedTo = null }) {
  const result = db.prepare(`
    INSERT INTO pauses (subscription_id, paused_from, paused_to)
    VALUES (?, ?, ?)
  `).run(subscriptionId, pausedFrom, pausedTo);
  return findById(result.lastInsertRowid);
}

function update(id, { subscriptionId, pausedFrom, pausedTo = null }) {
  const result = db.prepare(`
    UPDATE pauses
    SET subscription_id = ?, paused_from = ?, paused_to = ?
    WHERE id = ?
  `).run(subscriptionId, pausedFrom, pausedTo, id);
  return result.changes ? findById(id) : undefined;
}

function remove(id) {
  return db.prepare('DELETE FROM pauses WHERE id = ?').run(id).changes > 0;
}

module.exports = { findAll, findById, create, update, remove };
