const db = require('../db/database');
const { normalizePhone } = require('../utils/phone');

function findAll({ limit = 50, offset = 0 } = {}) {
  return db.prepare(`
    SELECT id, name, phone, created_at
    FROM customers
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

function search({ search = '', status = '', page = 1, limit = 20, sort = 'created_at', order = 'desc' }) {
  const sortColumns = {
    name: 'c.name',
    phone: 'c.phone',
    status: 'current_status',
    created_at: 'c.created_at'
  };
  const sortColumn = sortColumns[sort] || sortColumns.created_at;
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const where = [];
  const params = [];

  if (search) {
    where.push('(c.name LIKE ? OR c.phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    where.push("COALESCE(latest_subscription.status, 'none') = ?");
    params.push(status);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const fromClause = `
    FROM customers c
    LEFT JOIN subscriptions latest_subscription ON latest_subscription.id = (
      SELECT id
      FROM subscriptions
      WHERE customer_id = c.id
      ORDER BY id DESC
      LIMIT 1
    )
  `;
  const selectClause = `
    SELECT
      c.id,
      c.name,
      c.phone,
      c.created_at,
      latest_subscription.id AS subscription_id,
      COALESCE(latest_subscription.status, 'none') AS current_status
  `;
  const total = db.prepare(`SELECT COUNT(*) AS total ${fromClause} ${whereClause}`).get(...params).total;
  const offset = (page - 1) * limit;
  const data = db.prepare(`
    ${selectClause}
    ${fromClause}
    ${whereClause}
    ORDER BY ${sortColumn} ${direction}, c.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return { data, total };
}

function findById(id) {
  return db.prepare('SELECT id, name, phone, created_at FROM customers WHERE id = ?').get(id);
}

function findByPhone(phone) {
  return db.prepare('SELECT id, name, phone, password_hash, created_at FROM customers WHERE phone = ?').get(normalizePhone(phone));
}

function findByIdWithPassword(id) {
  return db.prepare('SELECT id, name, phone, password_hash, created_at FROM customers WHERE id = ?').get(id);
}

function createWithPassword({ name, phone, passwordHash }) {
  const result = db.prepare('INSERT INTO customers (name, phone, password_hash) VALUES (?, ?, ?)').run(name, normalizePhone(phone), passwordHash);
  return findByIdWithPassword(result.lastInsertRowid);
}

function create({ name, phone }) {
  const result = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(name, normalizePhone(phone));
  return findById(result.lastInsertRowid);
}

function update(id, { name, phone }) {
  const result = db.prepare('UPDATE customers SET name = ?, phone = ? WHERE id = ?').run(name, phone, id);
  return result.changes ? findById(id) : undefined;
}

function remove(id) {
  return db.prepare('DELETE FROM customers WHERE id = ?').run(id).changes > 0;
}

module.exports = { findAll, search, findById, findByPhone, findByIdWithPassword, createWithPassword, create, update, remove };
