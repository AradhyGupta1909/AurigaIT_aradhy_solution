const express = require('express');
const db = require('../db/database');
const menu = require('../models/menu');
const orders = require('../models/order');
const subscriptions = require('../models/subscription');

const router = express.Router();

function today() { return new Date().toISOString().slice(0, 10); }

function orderPage(req, res) {
  const date = today();
  const subscription = subscriptions.findActiveForCustomerOnDate(req.session.customer.id, date);
  return res.render('customer-order', { menu: subscription ? menu.findAll({ availableOnly: true }) : [], subscription, date });
}

router.get('/order', orderPage);

router.post('/order', (req, res, next) => {
  const date = today();
  const subscription = subscriptions.findActiveForCustomerOnDate(req.session.customer.id, date);
  if (!subscription) return res.status(403).send('You need an active, unpaused subscription to order today.');
  let requestedItems = req.body.items || [];
  if (!Array.isArray(requestedItems)) requestedItems = [requestedItems];
  const items = requestedItems.map((item) => ({ menuItemId: Number(item.menu_item_id), quantity: Number(item.quantity) })).filter((item) => Number.isInteger(item.menuItemId) && Number.isInteger(item.quantity) && item.quantity > 0);
  const available = new Map(menu.findAll({ availableOnly: true }).map((item) => [item.id, item]));
  if (!items.length || items.some((item) => !available.has(item.menuItemId))) return res.status(400).send('Choose at least one available menu item with a valid quantity.');
  const agent = db.prepare('SELECT id, name, phone FROM delivery_agents ORDER BY RANDOM() LIMIT 1').get();
  const eta = new Date(Date.now() + 45 * 60 * 1000).toISOString();
  try {
    const createOrder = db.transaction(() => orders.create({ customerId: req.session.customer.id, subscriptionId: subscription.id, orderDate: date, deliveryAgentId: agent.id, estimatedDeliveryTime: eta, items }));
    return res.status(201).render('order-confirmation', { order: createOrder(), customer: req.session.customer });
  } catch (error) { return next(error); }
});

router.get('/orders', (req, res) => res.render('customer-orders', { orders: orders.findForCustomer(req.session.customer.id) }));

module.exports = router;