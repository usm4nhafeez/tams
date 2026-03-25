const path = require('path');
const fs   = require('fs');

const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');

const DIRS = {
  photos:      path.join(DATA_DIR, 'students/photos'),
  receipts:    path.join(DATA_DIR, 'pdfs/receipts'),
  reportcards: path.join(DATA_DIR, 'pdfs/reportcards'),
  attendance:  path.join(DATA_DIR, 'pdfs/attendance'),
  backups:     path.join(DATA_DIR, 'backups'),
  logs:        path.join(DATA_DIR, 'logs'),
};

// Ensure all folders exist on startup
Object.values(DIRS).forEach(dir => fs.mkdirSync(dir, { recursive: true }));

module.exports = {
  DIRS,
  DATA_DIR,

  getPhotoPath(studentId, originalName) {
    const ext = path.extname(originalName) || '.jpg';
    const filename = `${studentId}_${Date.now()}${ext}`;
    return { filename, fullPath: path.join(DIRS.photos, filename), relativePath: `students/photos/${filename}` };
  },

  deleteFile(relativePath) {
    if (!relativePath) return;
    const full = path.join(DATA_DIR, relativePath);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  },

  // Daily backup
  runDailyBackup() {
    const dbPath    = path.resolve(process.env.DB_PATH || './data/tams.db');
    const today     = new Date().toISOString().split('T')[0];
    const backupFile = path.join(DIRS.backups, `tams_backup_${today}.db`);

    if (!fs.existsSync(backupFile)) {
      fs.copyFileSync(dbPath, backupFile);
      console.log(`Backup created: ${backupFile}`);
    }

    // Delete backups older than 60 days
    const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
    fs.readdirSync(DIRS.backups).forEach(file => {
      const fullPath = path.join(DIRS.backups, file);
      if (fs.statSync(fullPath).mtimeMs < cutoff) {
        fs.unlinkSync(fullPath);
        console.log(`Old backup deleted: ${file}`);
      }
    });
  }
};