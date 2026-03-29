require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const path     = require('path');

const app = express();

// ── middleware ─────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── static — serve photos & PDFs ──────────────────
const DATA_DIR = process.env.DATA_DIR || './data';
app.use('/static', express.static(path.resolve(DATA_DIR)));

// ── routes ────────────────────────────────────────
app.use('/api/v1/batches',    require('./routes/batches'));
app.use('/api/v1/groups',     require('./routes/groups'));
app.use('/api/v1/students',   require('./routes/students'));
app.use('/api/v1/attendance', require('./routes/attendance'));
app.use('/api/v1/fees',       require('./routes/fees'));
app.use('/api/v1/exams',      require('./routes/exams'));
app.use('/api/v1/whatsapp',   require('./routes/whatsapp'));
app.use('/api/v1/storage',    require('./routes/storage'));
app.use('/api/v1/settings',   require('./routes/settings'));
app.use('/api/v1/subjects',   require('./routes/subjects'));

// ── health check ──────────────────────────────────
app.get('/health', (req, res) => res.json({ 
  status: 'ok', 
  time: new Date(),
  version: '1.0.0',
  env: process.env.NODE_ENV 
}));

// ── 404 handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── error handler ─────────────────────────────────
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 TAMS API running on http://localhost:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
  console.log(`📦 Env: ${process.env.NODE_ENV}\n`);
});

module.exports = app;
