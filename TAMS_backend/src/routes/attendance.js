const router = require('express').Router();
const db     = require('../db/database');

function toFrontendStatus(status) {
  if (status === 'P') return 'present';
  if (status === 'A') return 'absent';
  if (status === 'L') return 'leave';
  return status;
}

function toDbStatus(status) {
  if (status === 'present') return 'P';
  if (status === 'absent') return 'A';
  if (status === 'leave') return 'L';
  return status;
}

// GET attendance for a batch on a date
router.get('/', async (req, res, next) => {
  try {
    const { batch_id, date } = req.query;
    if (!batch_id || !date) return res.status(400).json({ success: false, message: 'batch_id and date required' });

    const records = await db('attendance')
      .select('attendance.*', 'students.name', 'students.photo_path')
      .join('students', 'attendance.student_id', 'students.id')
      .where({ 'attendance.batch_id': batch_id, 'attendance.date': date });

    res.json({
      success: true,
      data: records.map((record) => ({
        ...record,
        status: toFrontendStatus(record.status),
      })),
    });
  } catch (err) { next(err); }
});

// GET monthly summary
router.get('/monthly', async (req, res, next) => {
  try {
    const { batch_id, month } = req.query; // month = 'YYYY-MM'
    if (!batch_id || !month) return res.status(400).json({ success: false, message: 'batch_id and month required' });

    const records = await db('attendance')
      .select(
        'student_id',
        db.raw("SUM(CASE WHEN status='P' THEN 1 ELSE 0 END) as present_days"),
        db.raw("SUM(CASE WHEN status='A' THEN 1 ELSE 0 END) as absent_days"),
        db.raw("SUM(CASE WHEN status='L' THEN 1 ELSE 0 END) as leave_days"),
        db.raw('COUNT(*) as total_days')
      )
      .where({ batch_id })
      .where('date', 'like', `${month}%`)
      .groupBy('student_id');

    res.json({
      success: true,
      data: records.map((record) => {
        const totalDays = Number(record.total_days || 0);
        const presentDays = Number(record.present_days || 0);
        return {
          ...record,
          percentage: totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 0,
        };
      }),
    });
  } catch (err) { next(err); }
});

// POST bulk attendance save (transactional upsert)
router.post('/bulk', async (req, res, next) => {
  try {
    const { batch_id, date, records, marked_by } = req.body;
    if (!batch_id || !date || !Array.isArray(records))
      return res.status(400).json({ success: false, message: 'batch_id, date, and records array required' });

    const normalizedRecords = records.map((r) => ({
      ...r,
      student_id: r.student_id || r.studentId,
      status: toDbStatus(r.status),
    }));

    await db.transaction(async trx => {
      for (const r of normalizedRecords) {
        await trx('attendance')
          .insert({ student_id: r.student_id, batch_id, date, status: r.status, marked_by: marked_by || 'staff' })
          .onConflict(['student_id', 'date'])
          .merge(); // upsert
      }
    });

    const absentIds = normalizedRecords
      .filter(r => r.status === 'A')
      .map((r) => r.student_id);

    const absentStudents = absentIds.length
      ? await db('students')
          .select('students.id as student_id', 'students.name', 'student_contacts.phone')
          .leftJoin('student_contacts', function() {
            this.on('student_contacts.student_id', 'students.id')
              .andOn(db.raw('student_contacts.is_primary = 1'));
          })
          .whereIn('students.id', absentIds)
      : [];

    res.json({ success: true, data: { absentStudents }, message: `${normalizedRecords.length} records saved` });
  } catch (err) { next(err); }
});

module.exports = router;
