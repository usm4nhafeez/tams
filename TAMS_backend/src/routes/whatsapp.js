const router = require('express').Router();
const db     = require('../db/database');
const WA     = require('../services/WhatsAppService');

// GET status + QR code if pending
router.get('/status', (req, res) => res.json({ success: true, data: WA.getStatus() }));

// GET QR code for scanning
router.get('/qr', (req, res) => {
  if (!WA.qrCode) return res.json({ success: false, message: 'No QR pending or already connected' });
  res.json({ success: true, data: { qr: WA.qrCode } });
});

// POST send individual message
router.post('/send', async (req, res, next) => {
  try {
    const { student_id, to, message, file_path } = req.body;
    if (!to || !message) return res.status(400).json({ success: false, message: 'to and message required' });
    await WA.sendWithRetry({ to, message, filePath: file_path }, student_id, 'manual');
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST broadcast (manual trigger or scheduler calls this)
router.post('/broadcast', async (req, res, next) => {
  try {
    const { month_year, type } = req.body; // type: 'broadcast' or 'alert'
    if (!month_year) return res.status(400).json({ success: false, message: 'month_year required' });

    const results = type === 'alert'
      ? await WA.sendDuesAlerts(month_year)
      : await WA.sendFeesBroadcast(month_year);

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

// POST send absence alerts (called after bulk attendance save)
router.post('/absence', async (req, res, next) => {
  try {
    const { absent_students, date } = req.body; // [{ student_id }]
    const results = [];
    for (const s of absent_students) {
      try {
        await WA.sendAbsenceAlert(s.student_id, date);
        results.push({ student_id: s.student_id, status: 'sent' });
      } catch (e) {
        results.push({ student_id: s.student_id, status: 'failed', error: e.message });
      }
    }
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

// GET message logs
router.get('/logs', async (req, res, next) => {
  try {
    const { student_id, message_type, status, date_from, date_to } = req.query;
    const query = db('whatsapp_logs')
      .select('whatsapp_logs.*', 'students.name as student_name')
      .leftJoin('students', 'whatsapp_logs.student_id', 'students.id');

    if (student_id)   query.where('whatsapp_logs.student_id', student_id);
    if (message_type) query.where('whatsapp_logs.message_type', message_type);
    if (status)       query.where('whatsapp_logs.status', status);
    if (date_from)    query.where('whatsapp_logs.sent_at', '>=', date_from);
    if (date_to)      query.where('whatsapp_logs.sent_at', '<=', date_to);

    res.json({ success: true, data: await query.orderBy('whatsapp_logs.created_at', 'desc').limit(200) });
  } catch (err) { next(err); }
});

// GET pending queue (for display in frontend)
router.get('/queue', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);
    const day   = parseInt(today.split('-')[2]);

    let type = null;
    if (day === 1 || day === 5) type = 'fee_broadcast';
    else if (day >= 8 && day <= 11) type = 'fee_alert';

    if (!type) return res.json({ success: true, data: [], message: 'No automated sends scheduled today' });

    const pending = await db('student_fees')
      .select('student_fees.*', 'students.name', 'student_contacts.whatsapp_number', 'student_contacts.parent_name')
      .join('students', 'student_fees.student_id', 'students.id')
      .join('student_contacts', function() { this.on('student_contacts.student_id', 'students.id').andOn(db.raw('student_contacts.is_primary = 1')); })
      .whereIn('student_fees.status', ['pending', 'partial'])
      .where('student_fees.month_year', month);

    res.json({ success: true, data: pending, type });
  } catch (err) { next(err); }
});

module.exports = router;