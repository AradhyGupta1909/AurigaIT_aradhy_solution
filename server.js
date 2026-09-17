const path = require('node:path');
const express = require('express');
const session = require('express-session');
require('./db/database');

const indexRoutes = require('./routes');
const authRoutes = require('./routes/auth');
const billingRoutes = require('./routes/billing');
const customerRoutes = require('./routes/customers');
const healthRoutes = require('./routes/health');
const ownerRoutes = require('./routes/owner');
const importRoutes = require('./routes/import');
const planRoutes = require('./routes/plans');
const notificationRoutes = require('./routes/notifications');
const customerAuthRoutes = require('./routes/customer-auth');
const customerOrderRoutes = require('./routes/customer-orders');
const menuRoutes = require('./routes/menu');
const subscriptionRoutes = require('./routes/subscriptions');
const { requireOwner, requireCustomer } = require('./middleware/roles');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.text({ type: ['text/csv', 'text/plain'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-only-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentCustomer = req.session.customer || null;
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRoutes);
app.use('/api/auth', authRoutes);
app.use('/customer', customerAuthRoutes);
app.use('/customer', requireCustomer, customerOrderRoutes);
app.use(requireOwner);
app.use('/', ownerRoutes);
app.use('/', menuRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api', planRoutes);
app.use('/api', importRoutes.router);
app.use('/', notificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api', billingRoutes);
app.use('/health', healthRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Tiffin service listening on http://localhost:${port}`);
  });
}

module.exports = app;
