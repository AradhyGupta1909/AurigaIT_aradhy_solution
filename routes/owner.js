const express = require('express');
const plans = require('../models/plan');

const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.render('dashboard', { user: req.session.user });
});

router.get('/customers/new', (req, res) => {
  res.render('customer-new', { user: req.session.user, plans: plans.findAll({ limit: 100 }) });
});

router.get('/bills', (req, res) => {
  res.render('bills', { user: req.session.user, month: req.query.month || '' });
});

router.get('/plans', (req, res) => {
  res.render('plans', { user: req.session.user, plans: plans.findAll({ limit: 100 }) });
});

router.post('/plans', (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const price = Number(req.body.price);
  const description = String(req.body.description || '').trim();

  if (!name || !Number.isInteger(price) || price < 0) {
    return res.status(400).render('plans', {
      user: req.session.user,
      plans: plans.findAll({ limit: 100 }),
      error: 'Plan name and a non-negative whole-number price are required.'
    });
  }

  try {
    plans.create({ name, price, description });
    return res.redirect('/plans');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
