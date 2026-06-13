require('dotenv').config();
const fs = require('fs');
const path = require('path');

function resolveDbPath(dbPath) {
  const filename = path.resolve(dbPath || './data/tams.db');
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  return filename;
}

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: { filename: resolveDbPath(process.env.DB_PATH) },
    useNullAsDefault: true,
    migrations: { directory: './src/db/migrations' },
    seeds: { directory: './src/db/seeds' },
  },
  production: {
    client: 'better-sqlite3',
    connection: { filename: resolveDbPath(process.env.DB_PATH) },
    useNullAsDefault: true,
    migrations: { directory: './src/db/migrations' },
  }
};
