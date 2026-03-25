const router = require('express').Router();
const db     = require('../db/database');
const PDF    = require('../services/PDFService');

// GET exams list
router.get('/', async (req, res, next) => {
  try {
    const { batch_id, group_id, exam_type, month } = req.query;
    const query = db('exams').select('exams.*', 'batches.name as batch_name', 'groups.name as group_name')
      .leftJoin('batches', 'exams.batch_id', 'batches.id')
      .leftJoin('groups',  'exams.group_id',  'groups.id');

    if (batch_id)  query.where('exams.batch_id', batch_id);
    if (group_id)  query.where('exams.group_id', group_id);
    if (exam_type) query.where('exams.exam_type', exam_type);
    if (month)     query.where('exams.date', 'like', `${month}%`);

    res.json({ success: true, data: await query.orderBy('exams.date', 'desc') });
  } catch (err) { next(err); }
});

// POST create exam
router.post('/', async (req, res, next) => {
  try {
    const { batch_id, group_id, subject, exam_type, date, max_marks, session_id, description } = req.body;
    if (!batch_id || !subject || !exam_type || !date || !max_marks)
      return res.status(400).json({ success: false, message: 'batch_id, subject, exam_type, date, max_marks required' });

    const [id] = await db('exams').insert({ batch_id, group_id, subject, exam_type, date, max_marks, session_id, description });
    res.status(201).json({ success: true, data: await db('exams').where({ id }).first() });
  } catch (err) { next(err); }
});

// POST bulk save marks
router.post('/:id/results', async (req, res, next) => {
  try {
    const exam_id = req.params.id;
    const { results } = req.body; // [{ student_id, marks_obtained, is_absent, remarks }]
    if (!Array.isArray(results)) return res.status(400).json({ success: false, message: 'results array required' });

    await db.transaction(async trx => {
      for (const r of results) {
        await trx('exam_results')
          .insert({ exam_id, student_id: r.student_id, marks_obtained: r.marks_obtained, is_absent: r.is_absent || false, remarks: r.remarks })
          .onConflict(['exam_id', 'student_id']).merge();
      }
    });

    res.json({ success: true, message: `${results.length} results saved` });
  } catch (err) { next(err); }
});

// GET monthly report card PDF
router.get('/report/:studentId/:month', async (req, res, next) => {
  try {
    const { studentId, month } = req.params;
    const filePath = await PDF.generateReportCard(studentId, month);
    res.json({ success: true, data: { path: filePath } });
  } catch (err) { next(err); }
});

// PATCH lock exam
router.patch('/:id/lock', async (req, res, next) => {
  try {
    await db('exams').where({ id: req.params.id }).update({ is_locked: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;