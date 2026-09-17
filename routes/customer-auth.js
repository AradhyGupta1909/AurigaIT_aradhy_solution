const express = require('express');
const bcrypt = require('bcryptjs');
const customers = require('../models/customer');

const router = express.Router();

function publicCustomer(customer) {
  return { id: customer.id, name: customer.name, phone: customer.phone, created_at: customer.created_at };
}

router.get('/register', (req, res) => res.render('customer-register'));
router.get('/login', (req, res) => res.render('customer-login'));

router.post('/register', async (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');
  if (!name || !phone || password.length < 8) return res.status(400).send('Name, phone, and an 8+ character password are required');
  if (customers.findByPhone(phone)) return res.status(409).send('Phone is already registered');
  try {
    const customer = customers.createWithPassword({ name, phone, passwordHash: await bcrypt.hash(password, 12) });
    delete req.session.user;
    req.session.customer = publicCustomer(customer);
    return res.redirect('/customer/order');
  } catch (error) { return next(error); }
});

router.post('/login', async (req, res, next) => {
  const phone = String(req.body.phone || '').trim();
  const customer = customers.findByPhone(phone);
  if (!customer || !customer.password_hash || !(await bcrypt.compare(String(req.body.password || ''), customer.password_hash))) return res.status(401).send('Invalid phone or password');
  delete req.session.user;
  req.session.customer = publicCustomer(customer);
  return res.redirect('/customer/order');
});

module.exports = router;