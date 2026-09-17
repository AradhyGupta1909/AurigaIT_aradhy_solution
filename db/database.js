const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'tiffin.sqlite');
const db = new Database(databasePath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
db.exec(schema);

const customerColumns = db.prepare('PRAGMA table_info(customers)').all();
if (!customerColumns.some((column) => column.name === 'password_hash')) {
	db.exec('ALTER TABLE customers ADD COLUMN password_hash TEXT');
}

const samplePlans = [
	{ name: 'Basic - 30 days', price: 2500, description: 'Reliable weekday lunch for one month.' },
	{ name: 'Standard', price: 3500, description: 'A fuller weekday tiffin plan with rotating dishes.' },
	{ name: 'Premium', price: 4500, description: 'Premium weekday meals with upgraded variety.' }
];

const planCount = db.prepare('SELECT COUNT(*) AS count FROM plans').get().count;
if (planCount === 0) {
	const insertPlan = db.prepare('INSERT INTO plans (name, price, description) VALUES (?, ?, ?)');
	db.transaction(() => {
		samplePlans.forEach((plan) => insertPlan.run(plan.name, plan.price, plan.description));
	})();
	console.log(`Seeded ${samplePlans.length} plans`);
}

const deliveryAgents = [
	{ name: 'Ramesh Kumar', phone: '+919876543210' },
	{ name: 'Suresh Patel', phone: '+919876543211' },
	{ name: 'Vikram Singh', phone: '+919876543212' }
];
if (db.prepare('SELECT COUNT(*) AS count FROM delivery_agents').get().count === 0) {
	const insertAgent = db.prepare('INSERT INTO delivery_agents (name, phone) VALUES (?, ?)');
	db.transaction(() => deliveryAgents.forEach((agent) => insertAgent.run(agent.name, agent.phone)))();
}

const sampleMenu = [
	{ name: 'Dal Tadka', price: 120, description: 'Yellow lentils with rice.' },
	{ name: 'Paneer Lunch Box', price: 180, description: 'Paneer curry, roti, rice, and salad.' },
	{ name: 'Seasonal Veg Thali', price: 160, description: 'A rotating selection of seasonal vegetables.' }
];
if (db.prepare('SELECT COUNT(*) AS count FROM menu_items').get().count === 0) {
	const insertMenu = db.prepare('INSERT INTO menu_items (name, price, description) VALUES (?, ?, ?)');
	db.transaction(() => sampleMenu.forEach((item) => insertMenu.run(item.name, item.price, item.description)))();
}

module.exports = db;
