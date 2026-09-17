const express = require('express');
const plans = require('../models/plan');

const router = express.Router();

router.post('/plans', (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const price = Number(req.body.price);
  const description = String(req.body.description || '').trim();

  if (!name || !Number.isInteger(price) || price < 0) {
    return res.status(400).json({ error: 'Plan name and a non-negative whole-number price are required.' });
  }

  try {
    plans.create({ name, price, description });
    return res.redirect('/plans');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;