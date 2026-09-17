const express = require('express');
const db = require('../db/database');
const customers = require('../models/customer');
const plans = require('../models/plan');
const subscriptions = require('../models/subscription');
const pauses = require('../models/pause');

const router = express.Router();

function inputValue(body, snakeCase, camelCase) {
  return body[snakeCase] ?? body[camelCase];
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

router.post('/', (req, res, next) => {
  const customerId = parseId(inputValue(req.body, 'customer_id', 'customerId'));
  const planId = parseId(inputValue(req.body, 'plan_id', 'planId'));
  const startDate = String(inputValue(req.body, 'start_date', 'startDate') || today());

  if (!customerId || !planId || !isDate(startDate)) {
    return res.status(400).json({ error: 'customer_id, plan_id, and a valid start_date (YYYY-MM-DD) are required' });
  }
  if (!customers.findById(customerId)) return res.status(404).json({ error: 'Customer not found' });
  if (!plans.findById(planId)) return res.status(404).json({ error: 'Plan not found' });

  try {
    const subscription = subscriptions.create({ customerId, planId, startDate });
    return res.status(201).json({ subscription });
  } catch (error) {
    return next(error);
  }
});

router.get('/', (req, res, next) => {
  const limit = Number(req.query.limit || 50);
  const offset = Number(req.query.offset || 0);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    return res.status(400).json({ error: 'limit must be 1-100 and offset must be a non-negative integer' });
  }

  try {
    return res.json({ subscriptions: subscriptions.findAllWithDetails({ limit, offset }) });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/pause', (req, res, next) => {
  const id = parseId(req.params.id);
  const pausedFrom = String(inputValue(req.body, 'paused_from', 'pausedFrom') || today());
  if (!id || !isDate(pausedFrom)) return res.status(400).json({ error: 'A valid subscription id and paused_from (YYYY-MM-DD) are required' });

  const subscription = subscriptions.findById(id);
  if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
  if (subscription.status !== 'active') return res.status(409).json({ error: 'Only active subscriptions can be paused' });

  try {
    const pauseSubscription = db.transaction(() => {
      const pause = pauses.create({ subscriptionId: id, pausedFrom });
      subscriptions.updateStatus(id, 'paused');
      return { ...subscriptions.findById(id), pause };
    })();
    return res.status(200).json({ subscription: pauseSubscription });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/resume', (req, res, next) => {
  const id = parseId(req.params.id);
  const pausedTo = String(inputValue(req.body, 'paused_to', 'pausedTo') || today());
  if (!id || !isDate(pausedTo)) return res.status(400).json({ error: 'A valid subscription id and paused_to (YYYY-MM-DD) are required' });

  const subscription = subscriptions.findById(id);
  if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
  if (subscription.status !== 'paused') return res.status(409).json({ error: 'Only paused subscriptions can be resumed' });
  const openPause = pauses.findOpenBySubscription(id);
  if (!openPause) return res.status(409).json({ error: 'No open pause found for subscription' });
  if (pausedTo < openPause.paused_from) return res.status(400).json({ error: 'paused_to cannot be before paused_from' });

  try {
    const resumeSubscription = db.transaction(() => {
      const pause = pauses.close(openPause.id, pausedTo);
      subscriptions.updateStatus(id, 'active');
      return { ...subscriptions.findById(id), pause };
    })();
    return res.json({ subscription: resumeSubscription });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;