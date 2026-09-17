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

module.exports = router;
