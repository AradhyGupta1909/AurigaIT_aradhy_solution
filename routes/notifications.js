const express = require('express');
const db = require('../db/database');
const notification = require('../services/notification');

const router = express.Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isWeekday(value) {
  const day = new Date(`${value}T00:00:00Z`).getUTCDay();
  return day >= 1 && day <= 5;
}

router.post('/clock', (req, res, next) => {
  const date = String(req.body.date || today());
  if (!isValidDate(date)) return res.status(400).json({ error: 'date must use YYYY-MM-DD format' });

  if (!isWeekday(date)) return res.json({ date, notifications_created: 0, outbox: [] });

  try {
    const eligibleSubscriptions = db.prepare(`
      SELECT subscriptions.id, subscriptions.customer_id
      FROM subscriptions
      WHERE subscriptions.status = 'active'
        AND subscriptions.start_date <= ?
        AND NOT EXISTS (
          SELECT 1
          FROM pauses
          WHERE pauses.subscription_id = subscriptions.id
            AND pauses.paused_from <= ?
            AND (pauses.paused_to IS NULL OR pauses.paused_to >= ?)
        )
    `).all(date, date, date);

    const createNotifications = db.transaction(() => eligibleSubscriptions.map((subscription) => (
      notification.notify(subscription.customer_id, 'Tiffin scheduled for delivery today', subscription.id)
    )));
    const outbox = createNotifications();
    return res.json({ date, notifications_created: outbox.length, outbox });
  } catch (error) {
    return next(error);
  }
});

router.get('/outbox', (req, res, next) => {
  try {
    return res.json({ outbox: notification.findAll() });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;