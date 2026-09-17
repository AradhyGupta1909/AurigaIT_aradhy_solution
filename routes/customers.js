const express = require('express');
const customers = require('../models/customer');
const { normalizePhone } = require('../utils/phone');

const router = express.Router();

const allowedStatuses = new Set(['active', 'paused', 'cancelled', 'none']);
const allowedSorts = new Set(['name', 'phone', 'status', 'created_at']);

router.get('/', (req, res, next) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim().toLowerCase();
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const sort = String(req.query.sort || 'created_at');
  const order = String(req.query.order || 'desc').toLowerCase();

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'page must be >= 1 and limit must be between 1 and 100' });
  }
  if (status && !allowedStatuses.has(status)) {
    return res.status(400).json({ error: 'status must be active, paused, cancelled, or none' });
  }
  if (!allowedSorts.has(sort) || !['asc', 'desc'].includes(order)) {
    return res.status(400).json({ error: 'sort must be name, phone, status, or created_at; order must be asc or desc' });
  }

  try {
    const result = customers.search({ search, status, page, limit, sort, order });
    return res.json({
      customers: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        total_pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();

  if (!name || !normalizePhone(phone)) {
    return res.status(400).json({ error: 'name and a valid 10-13 digit phone are required' });
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