const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'tiffin.sqlite');
const db = new Database(databasePath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
db.exec(schema);

module.exports = db;
