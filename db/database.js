const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'tiffin.sqlite');
const db = new Database(databasePath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
db.exec(schema);

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
}

module.exports = db;
