const express = require('express');
const pauses = require('../models/pause');
const subscriptions = require('../models/subscription');
const transfers = require('../models/transfer');
const billing = require('../services/billing');

const router = express.Router();

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function requestedMonth(value) {
  const month = String(value || '');
  return billing.monthDetails(month) ? month : null;
}

function customerDetails(customerId) {
  return require('../db/database').prepare('SELECT id, name, phone FROM customers WHERE id = ?').get(customerId);
}

function billForSubscription(subscription, month) {
  const subscriptionTransfers = transfers.findAllBySubscription(subscription.id);
  const boundaries = [{ customerId: subscription.customer_id, fromDate: null, toDate: subscriptionTransfers[0] ? subscriptionTransfers[0].transferred_on : null }];
  subscriptionTransfers.forEach((transfer, index) => {
    boundaries.push({
      customerId: transfer.to_customer_id,
      fromDate: transfer.transferred_on,
      toDate: subscriptionTransfers[index + 1] ? subscriptionTransfers[index + 1].transferred_on : null
    });
  });
  const lineItems = boundaries.map((boundary) => {
    const customer = customerDetails(boundary.customerId);
    return {
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      ...billing.calculateBill({
        month,
        planPrice: subscription.plan_price,
        startDate: subscription.start_date,
        pauses: pauses.findAllBySubscription(subscription.id),
        fromDate: boundary.fromDate,
        toDate: boundary.toDate
      })
    };
  });
  const total = lineItems.reduce((sum, item) => sum + item.bill, 0);
  return {
    subscription_id: subscription.id,
    plan_id: subscription.plan_id,
    plan_name: subscription.plan_name,
    plan_price: subscription.plan_price,
    start_date: subscription.start_date,
    status: subscription.status,
    month,
    total_weekdays: lineItems[0].total_weekdays,
    days_delivered: lineItems.reduce((sum, item) => sum + item.days_delivered, 0),
    bill: Math.round(total * 100) / 100,
    line_items: lineItems
  };
}

router.get('/subscriptions/:id/bill', (req, res) => {
  const id = parseId(req.params.id);
  const month = requestedMonth(req.query.month);
  if (!id || !month) return res.status(400).json({ error: 'A valid subscription id and month (YYYY-MM) are required' });

  const subscription = subscriptions.findForBilling(id);
  if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
  return res.json({ bill: billForSubscription(subscription, month) });
});

router.get('/bills', (req, res) => {
  const month = requestedMonth(req.query.month);
  if (!month) return res.status(400).json({ error: 'month (YYYY-MM) is required' });

  const bills = subscriptions.findAllForBilling().map((subscription) => billForSubscription(subscription, month));
  return res.json({ month, bills });
});

module.exports = router;