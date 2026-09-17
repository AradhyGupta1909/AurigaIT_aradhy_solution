const express = require('express');
const customers = require('../models/customer');

const router = express.Router();

router.post('/', (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }

  try {
    const customer = customers.create({ name, phone });
    return res.status(201).json({ customer });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Phone is already registered' });
    }
    return next(error);
  }
});

module.exports = router;