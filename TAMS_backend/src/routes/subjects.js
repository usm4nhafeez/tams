const router = require('express').Router();
const db     = require('../db/database');
const xlsx   = require('xlsx');
const multer = require('multer');
const upload = multer({ dest: '/tmp/' });

// GET subjects for a batch
router.get('/', async (req, res, next) => {
  try {
    const { batch_id } = req.query;
    const query = db('subjects').select('*');
    if (batch_id) query.where({ batch_id });
    res.json({ success: true, data: await query.orderBy('name') });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { batch_id, name, code } = req.body;
    if (!batch_id || !name) return res.status(400).json({ success: false, message: 'batch_id and name required' });
    const [id] = await db('subjects').insert({ batch_id, name, code });
    res.status(201).json({ success: true, data: await db('subjects').where({ id }).first() });
  } catch (err) { next(err); }
});

// POST import subjects from Excel
// Excel must have columns: name, code
router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    const { batch_id } = req.body;
    if (!batch_id || !req.file) return res.status(400).json({ success: false, message: 'batch_id and file required' });

    const workbook = xlsx.readFile(req.file.path);
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = xlsx.utils.sheet_to_json(sheet); // [{name, code}, ...]

    const subjects = rows.map(r => ({ batch_id, name: r.name || r.Name, code: r.code || r.Code || null }))
                         .filter(r => r.name);

    await db('subjects').insert(subjects);
    res.json({ success: true, data: { imported: subjects.length } });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db('subjects').where({ id: req.params.id }).delete();
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;