const router = require('express').Router();
const db     = require('../db/database');

router.get('/', async (req, res, next) => {
  try {
    const rows = await db('settings').select('*');
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

router.get('/:key', async (req, res, next) => {
  try {
    const row = await db('settings').where({ key: req.params.key }).first();
    if (!row) return res.status(404).json({ success: false, message: 'Setting not found' });
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

router.put('/:key', async (req, res, next) => {
  try {
    const { value } = req.body;
    await db('settings').insert({ key: req.params.key, value })
      .onConflict('key').merge();
    res.json({ success: true, data: { key: req.params.key, value } });
  } catch (err) { next(err); }
});

module.exports = router;