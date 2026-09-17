const express = require('express');
const bcrypt = require('bcryptjs');
const users = require('../models/user');

const router = express.Router();
const minimumPasswordLength = 8;

function publicUser(user) {
  return { id: user.id, email: user.email, created_at: user.created_at };
}

function respondWithAuth(req, res, user, statusCode = 200) {
  if (req.accepts('html') && !req.is('json')) {
    return res.redirect('/dashboard');
  }
  return res.status(statusCode).json({ user });
}

router.post('/register', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !email.includes('@') || password.length < minimumPasswordLength) {
      return res.status(400).json({ error: `Valid email and password of at least ${minimumPasswordLength} characters are required` });
    }

    if (users.findByEmail(email)) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = users.create({ email, passwordHash });
    delete req.session.customer;
    req.session.user = publicUser(user);
    return respondWithAuth(req, res, req.session.user, 201);
  } catch (error) {
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = users.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

  delete req.session.customer;
    req.session.user = publicUser(user);
  return respondWithAuth(req, res, req.session.user);
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    return res.json({ message: 'Logged out' });
  });
});

module.exports = router;
