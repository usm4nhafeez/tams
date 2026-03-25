require('dotenv').config();

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: { filename: process.env.DB_PATH || './data/tams.db' },
    useNullAsDefault: true,
    migrations: { directory: './src/db/migrations' },
    seeds:      { directory: './src/db/seeds' },
  },
  production: {
    client: 'better-sqlite3',
    connection: { filename: process.env.DB_PATH },
    useNullAsDefault: true,
    migrations: { directory: './src/db/migrations' },
  }
};