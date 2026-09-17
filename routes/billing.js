const express = require('express');
const pauses = require('../models/pause');
const subscriptions = require('../models/subscription');
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

function billForSubscription(subscription, month) {
  return {
    subscription_id: subscription.id,
    customer_id: subscription.customer_id,
    customer_name: subscription.customer_name,
    customer_phone: subscription.customer_phone,
    plan_id: subscription.plan_id,
    plan_name: subscription.plan_name,
    plan_price: subscription.plan_price,
    start_date: subscription.start_date,
    status: subscription.status,
    month,
    ...billing.calculateBill({
      month,
      planPrice: subscription.plan_price,
      startDate: subscription.start_date,
      pauses: pauses.findAllBySubscription(subscription.id)
    })
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