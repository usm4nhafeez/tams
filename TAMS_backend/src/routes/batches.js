const router = require('express').Router();
const db     = require('../db/database');

// GET all batches with student count
router.get('/', (req, res, next) => {
  try {
    const batches = db('batches')
      .select('batches.*')
      .count('students.id as student_count')
      .leftJoin('students', function() {
        this.on('students.batch_id', 'batches.id')
            .andOn(db.raw('students.status = ?', ['active']));
      })
      .groupBy('batches.id')
      .orderBy('batches.created_at', 'desc');

    batches.then(data => res.json({ success: true, data }));
  } catch (err) { next(err); }
});

// GET single batch
router.get('/:id', async (req, res, next) => {
  try {
    const batch = await db('batches').where({ id: req.params.id }).first();
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (err) { next(err); }
});

// POST create batch
router.post('/', async (req, res, next) => {
  try {
    const { name, grade, academic_year, monthly_fee, admission_fee, notes } = req.body;
    if (!name || !grade) return res.status(400).json({ success: false, message: 'name and grade are required' });

    const [id] = await db('batches').insert({ name, grade, academic_year, monthly_fee: monthly_fee||0, admission_fee: admission_fee||0, notes });
    const batch = await db('batches').where({ id }).first();
    res.status(201).json({ success: true, data: batch });
  } catch (err) { next(err); }
});

// PUT update batch
router.put('/:id', async (req, res, next) => {
  try {
    await db('batches').where({ id: req.params.id }).update({ ...req.body, updated_at: new Date().toISOString() });
    const batch = await db('batches').where({ id: req.params.id }).first();
    res.json({ success: true, data: batch });
  } catch (err) { next(err); }
});

// PATCH archive
router.patch('/:id/archive', async (req, res, next) => {
  try {
    await db('batches').where({ id: req.params.id }).update({ is_active: false });
    res.json({ success: true, message: 'Batch archived' });
  } catch (err) { next(err); }
});

module.exports = router;