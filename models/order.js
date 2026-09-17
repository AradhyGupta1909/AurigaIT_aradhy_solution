const db = require('../db/database');

function findById(id) {
  return db.prepare(`
    SELECT orders.id, orders.customer_id, orders.subscription_id, orders.order_date, orders.status,
      orders.delivery_agent_id, delivery_agents.name AS agent_name, delivery_agents.phone AS agent_phone,
      orders.estimated_delivery_time, orders.created_at
    FROM orders JOIN delivery_agents ON delivery_agents.id = orders.delivery_agent_id
    WHERE orders.id = ?
  `).get(id);
}

function findItems(orderId) {
  return db.prepare(`
    SELECT order_items.menu_item_id, order_items.quantity, menu_items.name, menu_items.price
    FROM order_items JOIN menu_items ON menu_items.id = order_items.menu_item_id
    WHERE order_items.order_id = ?
  `).all(orderId);
}

function findForCustomer(customerId) {
  return db.prepare(`
    SELECT orders.id, orders.order_date, orders.status, orders.estimated_delivery_time, orders.created_at,
      delivery_agents.name AS agent_name, delivery_agents.phone AS agent_phone
    FROM orders JOIN delivery_agents ON delivery_agents.id = orders.delivery_agent_id
    WHERE orders.customer_id = ? ORDER BY orders.order_date DESC, orders.id DESC
  `).all(customerId).map((order) => ({ ...order, items: findItems(order.id) }));
}

function findToday(date) {
  return db.prepare(`
    SELECT orders.id, orders.order_date, orders.status, orders.estimated_delivery_time, orders.created_at,
      customers.name AS customer_name, customers.phone AS customer_phone,
      delivery_agents.name AS agent_name, delivery_agents.phone AS agent_phone
    FROM orders
    JOIN customers ON customers.id = orders.customer_id
    JOIN delivery_agents ON delivery_agents.id = orders.delivery_agent_id
    WHERE orders.order_date = ? ORDER BY orders.created_at DESC, orders.id DESC
  `).all(date).map((order) => ({ ...order, items: findItems(order.id) }));
}

function create({ customerId, subscriptionId, orderDate, deliveryAgentId, estimatedDeliveryTime, items }) {
  const result = db.prepare(`
    INSERT INTO orders (customer_id, subscription_id, order_date, delivery_agent_id, estimated_delivery_time)
    VALUES (?, ?, ?, ?, ?)
  `).run(customerId, subscriptionId, orderDate, deliveryAgentId, estimatedDeliveryTime);
  const insertItem = db.prepare('INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES (?, ?, ?)');
  items.forEach((item) => insertItem.run(result.lastInsertRowid, item.menuItemId, item.quantity));
  return { ...findById(result.lastInsertRowid), items: findItems(result.lastInsertRowid) };
}

module.exports = { findById, findForCustomer, findToday, create, findItems };