const express = require('express');
const plans = require('../models/plan');
const orders = require('../models/order');

const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.render('dashboard', { user: req.session.user, todayOrders: orders.findToday(new Date().toISOString().slice(0, 10)) });
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

router.get('/import', (req, res) => {
  res.render('import', { user: req.session.user });
});

module.exports = router;
