const express = require('express');
const customers = require('../models/customer');
const plans = require('../models/plan');
const subscriptions = require('../models/subscription');

const router = express.Router();

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field.trim());
    if (row.some((value) => value !== '')) rows.push(row);
  }
  return rows;
}

function normalizePhone(value) {
  const compact = String(value || '').trim().replace(/[\s-]/g, '');
  if (!compact) return null;
  const digits = compact.startsWith('+') ? compact.slice(1) : compact;
  if (!/^\d{10,13}$/.test(digits)) return null;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

function parseDate(value) {
  const input = String(value || '').trim();
  let year;
  let month;
  let day;
  let match;
  if ((match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) {
    [, day, month, year] = match;
  } else if ((match = input.match(/^(\d{2})-(\d{2})-(\d{4})$/))) {
    [, month, day, year] = match;
  } else if ((match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    [, year, month, day] = match;
  } else {
    return null;
  }

  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

function importCsv(csv) {
  const rows = parseCsv(String(csv || '').replace(/^\uFEFF/, ''));
  if (rows.length < 1) return { imported: 0, deduped: 0, rejected: [{ row: 1, reason: 'CSV is empty' }] };

  const headers = rows[0].map((header) => header.toLowerCase());
  const requiredHeaders = ['name', 'phone', 'plan_name', 'start_date'];
  const missingHeader = requiredHeaders.find((header) => !headers.includes(header));
  if (missingHeader) return { imported: 0, deduped: 0, rejected: [{ row: 1, reason: `Missing required column: ${missingHeader}` }] };

  const indexOf = (header) => headers.indexOf(header);
  const seenPhones = new Set();
  const rejected = [];
  let imported = 0;
  let deduped = 0;

  rows.slice(1).forEach((values, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const name = String(values[indexOf('name')] || '').trim();
    const rawPhone = values[indexOf('phone')];
    const phone = normalizePhone(rawPhone);
    const planName = String(values[indexOf('plan_name')] || '').trim();
    const startDate = parseDate(values[indexOf('start_date')]);

    if (!phone) return rejected.push({ row: rowNumber, reason: 'Missing or invalid phone (expected 10-13 digits)' });
    if (!name) return rejected.push({ row: rowNumber, reason: 'Missing name' });
    if (!startDate) return rejected.push({ row: rowNumber, reason: 'Missing or unparseable start_date' });
    const plan = plans.findByName(planName);
    if (!plan) return rejected.push({ row: rowNumber, reason: `Unrecognized plan_name: ${planName || '(blank)'}` });

    if (seenPhones.has(phone) || customers.findByPhone(phone)) {
      seenPhones.add(phone);
      deduped += 1;
      return;
    }
    seenPhones.add(phone);

    try {
      const createRow = subscriptionsDbTransaction(() => {
        const customer = customers.create({ name, phone });
        return subscriptions.create({ customerId: customer.id, planId: plan.id, startDate });
      });
      createRow();
      imported += 1;
    } catch (error) {
      rejected.push({ row: rowNumber, reason: 'Could not create customer or subscription' });
    }
  });

  return { imported, deduped, rejected };
}

function subscriptionsDbTransaction(callback) {
  const db = require('../db/database');
  return db.transaction(callback);
}

router.post('/import', (req, res, next) => {
  const csv = typeof req.body === 'string' ? req.body : req.body.csv;
  if (!csv) return res.status(400).json({ error: 'CSV text is required' });
  try {
    return res.json(importCsv(csv));
  } catch (error) {
    return next(error);
  }
});

module.exports = { router, importCsv };