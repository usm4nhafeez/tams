const router  = require('express').Router();
const Storage = require('../services/StorageService');
const fs      = require('fs');
const path    = require('path');

router.post('/backup', (req, res, next) => {
  try {
    const dbPath   = path.resolve(process.env.DB_PATH || './data/tams.db');
    const filename = `tams_backup_${new Date().toISOString().split('T')[0]}_manual.db`;
    const dest     = path.join(Storage.DIRS.backups, filename);
    fs.copyFileSync(dbPath, dest);
    res.json({ success: true, data: { filename, path: dest } });
  } catch (err) { next(err); }
});

router.get('/backups', (req, res, next) => {
  try {
    const files = fs.readdirSync(Storage.DIRS.backups)
      .filter(f => f.endsWith('.db'))
      .map(f => {
        const fullPath = path.join(Storage.DIRS.backups, f);
        const stat = fs.statSync(fullPath);
        return { filename: f, size: stat.size, created_at: stat.mtime };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: files });
  } catch (err) { next(err); }
});

router.post('/restore', (req, res, next) => {
  try {
    const { filename } = req.body;
    const src  = path.join(Storage.DIRS.backups, filename);
    const dest = path.resolve(process.env.DB_PATH || './data/tams.db');
    if (!fs.existsSync(src)) return res.status(404).json({ success: false, message: 'Backup file not found' });
    fs.copyFileSync(src, dest);
    res.json({ success: true, message: 'Restored — restart the app to apply' });
  } catch (err) { next(err); }
});

module.exports = router;