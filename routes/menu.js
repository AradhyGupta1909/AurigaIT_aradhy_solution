const express = require('express');
const menu = require('../models/menu');

const router = express.Router();

router.get('/menu', (req, res) => res.render('menu', { menu: menu.findAll() }));

router.post('/menu', (req, res, next) => {
  const name = String(req.body.name || '').trim();
  const price = Number(req.body.price);
  if (!name || !Number.isInteger(price) || price < 0) return res.status(400).json({ error: 'Name and non-negative whole-number price are required' });
  try {
    return res.status(201).json({ item: menu.create({ name, price, description: String(req.body.description || '').trim() }) });
  } catch (error) { return next(error); }
});

router.post('/menu/:id', (req, res, next) => {
  const item = menu.findById(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  try {
    return res.json({ item: menu.update(item.id, { name: String(req.body.name || item.name).trim(), price: Number(req.body.price ?? item.price), description: String(req.body.description ?? item.description).trim(), availableToday: req.body.available_today ?? item.available_today }) });
  } catch (error) { return next(error); }
});

router.post('/menu/:id/toggle-available', (req, res) => {
  const item = menu.toggleAvailability(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Menu item not found' });
  return res.json({ item });
});

module.exports = router;