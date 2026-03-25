const router     = require('express').Router();
const db         = require('../db/database');
const FeeService = require('../services/FeeService');
const PDFService = require('../services/PDFService');

// GET fees (filter by student or month)
router.get('/', async (req, res, next) => {
  try {
    const { student_id, month_year, batch_id, status } = req.query;
    const query = db('student_fees')
      .select('student_fees.*', 'students.name as student_name', 'students.photo_path',
              'batches.name as batch_name')
      .join('students', 'student_fees.student_id', 'students.id')
      .join('batches',  'students.batch_id', 'batches.id');

    if (student_id) query.where('student_fees.student_id', student_id);
    if (month_year) query.where('student_fees.month_year', month_year);
    if (batch_id)   query.where('students.batch_id', batch_id);
    if (status)     query.where('student_fees.status', status);

    res.json({ success: true, data: await query.orderBy('student_fees.month_year', 'desc') });
  } catch (err) { next(err); }
});

// POST generate monthly fees
router.post('/generate', async (req, res, next) => {
  try {
    const { month_year } = req.body;
    if (!month_year) return res.status(400).json({ success: false, message: 'month_year required (YYYY-MM)' });
    const result = await FeeService.generateMonthlyFees(month_year);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// PATCH record payment
router.patch('/:id/pay', async (req, res, next) => {
  try {
    const fee = await FeeService.recordPayment(req.params.id, req.body);
    res.json({ success: true, data: fee });
  } catch (err) { next(err); }
});

// GET generate receipt PDF
router.get('/:id/receipt', async (req, res, next) => {
  try {
    const fee = await db('student_fees')
      .select('student_fees.*', 'students.name', 'students.photo_path', 'batches.name as batch_name')
      .join('students', 'student_fees.student_id', 'students.id')
      .join('batches',  'students.batch_id', 'batches.id')
      .where('student_fees.id', req.params.id).first();

    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const filePath = await PDFService.generateReceipt(fee);
    res.json({ success: true, data: { path: filePath } });
  } catch (err) { next(err); }
});

module.exports = router;