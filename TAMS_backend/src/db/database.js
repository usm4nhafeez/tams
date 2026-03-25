const knex = require('knex');
const config = require('../../knexfile');

const env = process.env.NODE_ENV || 'development';
const db = knex(config[env]);

// Enable WAL mode and performance PRAGMAs
db.raw('PRAGMA journal_mode = WAL').then(() => {});
db.raw('PRAGMA foreign_keys = ON').then(() => {});
db.raw('PRAGMA synchronous = NORMAL').then(() => {});
db.raw('PRAGMA cache_size = -64000').then(() => {});  // 64MB cache

module.exports = db;