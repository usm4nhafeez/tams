const router = require('express').Router();
const db     = require('../db/database');

// GET attendance for a batch on a date
router.get('/', async (req, res, next) => {
  try {
    const { batch_id, date } = req.query;
    if (!batch_id || !date) return res.status(400).json({ success: false, message: 'batch_id and date required' });

    const records = await db('attendance')
      .select('attendance.*', 'students.name', 'students.photo_path')
      .join('students', 'attendance.student_id', 'students.id')
      .where({ 'attendance.batch_id': batch_id, 'attendance.date': date });

    res.json({ success: true, data: records });
  } catch (err) { next(err); }
});

// GET monthly summary
router.get('/monthly', async (req, res, next) => {
  try {
    const { batch_id, month } = req.query; // month = 'YYYY-MM'
    if (!batch_id || !month) return res.status(400).json({ success: false, message: 'batch_id and month required' });

    const records = await db('attendance')
      .select('student_id', db.raw("SUM(CASE WHEN status='P' THEN 1 ELSE 0 END) as present"),
              db.raw("SUM(CASE WHEN status='A' THEN 1 ELSE 0 END) as absent"),
              db.raw("SUM(CASE WHEN status='L' THEN 1 ELSE 0 END) as leave"),
              db.raw('COUNT(*) as total_days'))
      .where({ batch_id })
      .where('date', 'like', `${month}%`)
      .groupBy('student_id');

    res.json({ success: true, data: records });
  } catch (err) { next(err); }
});

// POST bulk attendance save (transactional upsert)
router.post('/bulk', async (req, res, next) => {
  try {
    const { batch_id, date, records, marked_by } = req.body;
    if (!batch_id || !date || !Array.isArray(records))
      return res.status(400).json({ success: false, message: 'batch_id, date, and records array required' });

    await db.transaction(async trx => {
      for (const r of records) {
        await trx('attendance')
          .insert({ student_id: r.student_id, batch_id, date, status: r.status, marked_by: marked_by || 'staff' })
          .onConflict(['student_id', 'date'])
          .merge(); // upsert
      }
    });

    // Return absent students for WhatsApp queue
    const absentStudents = records.filter(r => r.status === 'A');

    res.json({ success: true, message: `${records.length} records saved`, absentStudents });
  } catch (err) { next(err); }
});

module.exports = router;