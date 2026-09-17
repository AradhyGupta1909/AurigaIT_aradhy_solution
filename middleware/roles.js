function requireOwner(req, res, next) {
  if (req.session.user) return next();
  if (req.session.customer) return res.redirect('/customer/order');
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Owner authentication required' });
  return res.redirect('/login');
}

function requireCustomer(req, res, next) {
  if (req.session.customer) return next();
  if (req.session.user) return res.redirect('/dashboard');
  return res.redirect('/customer/login');
}

module.exports = { requireOwner, requireCustomer };