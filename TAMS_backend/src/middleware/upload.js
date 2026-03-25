const multer  = require('multer');
const path    = require('path');
const storage = require('../services/StorageService');

const upload = multer({
  dest: storage.DIRS.photos,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only JPG and PNG allowed'));
  }
});

module.exports = upload;