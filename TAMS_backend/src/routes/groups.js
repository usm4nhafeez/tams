const router = require('express').Router();
const db     = require('../db/database');

router.get('/', async (req, res, next) => {
  try {
    const { batch_id } = req.query;
    const query = db('groups').select('*');
    if (batch_id) query.where({ batch_id });
    res.json({ success: true, data: await query });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { batch_id, name, description } = req.body;
    if (!batch_id || !name) return res.status(400).json({ success: false, message: 'batch_id and name required' });
    const [id] = await db('groups').insert({ batch_id, name, description });
    res.status(201).json({ success: true, data: await db('groups').where({ id }).first() });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    await db('groups').where({ id: req.params.id }).update({ ...req.body, updated_at: new Date().toISOString() });
    res.json({ success: true, data: await db('groups').where({ id: req.params.id }).first() });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const count = await db('students').where({ group_id: req.params.id }).count('id as c').first();
    if (count.c > 0) return res.status(400).json({ success: false, message: 'Cannot delete group with students assigned' });
    await db('groups').where({ id: req.params.id }).delete();
    res.json({ success: true, message: 'Group deleted' });
  } catch (err) { next(err); }
});

module.exports = router;