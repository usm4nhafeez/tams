const router  = require('express').Router();
const db      = require('../db/database');
const upload  = require('../middleware/upload');
const Storage = require('../services/StorageService');
const fs      = require('fs');
const path    = require('path');

// Try to load sharp, fallback gracefully
let sharp;
try { sharp = require('sharp'); } catch (e) { console.warn('[Students] sharp not available, photos will not be resized'); }

// GET all students
router.get('/', async (req, res, next) => {
  try {
    const { batch_id, group_id, status, search } = req.query;
    const query = db('students')
      .select(
        'students.*',
        'batches.name as batch_name',
        'groups.name as group_name',
        'student_contacts.parent_name',
        'student_contacts.phone',
        'student_contacts.whatsapp_number',
      )
      .leftJoin('batches', 'students.batch_id', 'batches.id')
      .leftJoin('groups', 'students.group_id', 'groups.id')
      .leftJoin('student_contacts', function() {
        this.on('student_contacts.student_id', 'students.id')
            .andOn(db.raw('student_contacts.is_primary = 1'));
      });

    if (batch_id) query.where('students.batch_id', batch_id);
    if (group_id) query.where('students.group_id', group_id);
    if (status && status !== 'all') query.where('students.status', status);
    if (search) query.where(function() {
      this.where('students.name', 'like', `%${search}%`)
          .orWhere('students.father_name', 'like', `%${search}%`)
          .orWhere('student_contacts.phone', 'like', `%${search}%`);
    });

    res.json({ success: true, data: await query.orderBy('students.name') });
  } catch (err) { next(err); }
});

// GET student profile
router.get('/:id/profile', async (req, res, next) => {
  try {
    const id = req.params.id;
    const student = await db('students')
      .select('students.*', 'batches.name as batch_name', 'groups.name as group_name')
      .leftJoin('batches', 'students.batch_id', 'batches.id')
      .leftJoin('groups', 'students.group_id', 'groups.id')
      .where('students.id', id).first();

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const [contacts, fees, attendance, exams, waLogs] = await Promise.all([
      db('student_contacts').where({ student_id: id }),
      db('student_fees').where({ student_id: id }).orderBy('month_year', 'desc').limit(24),
      db('attendance').where({ student_id: id }).orderBy('date', 'desc').limit(90),
      db('exam_results')
        .select('exam_results.*', 'exams.subject', 'exams.exam_type', 'exams.date', 'exams.max_marks')
        .join('exams', 'exam_results.exam_id', 'exams.id')
        .where('exam_results.student_id', id)
        .orderBy('exams.date', 'desc').limit(50),
      db('whatsapp_logs').where({ student_id: id }).orderBy('created_at', 'desc').limit(50),
    ]);

    res.json({ success: true, data: { student, contacts, fees, attendance, exams, waLogs } });
  } catch (err) { next(err); }
});

// GET student photo
router.get('/:id/photo', async (req, res, next) => {
  try {
    const student = await db('students').select('photo_path').where({ id: req.params.id }).first();
    if (!student?.photo_path) return res.status(404).json({ success: false, message: 'No photo' });
    const photoPath = path.join(Storage.DATA_DIR, student.photo_path);
    if (!fs.existsSync(photoPath)) return res.status(404).json({ success: false, message: 'Photo file not found' });
    res.sendFile(photoPath);
  } catch (err) { next(err); }
});

// POST create student
router.post('/', upload.single('photo'), async (req, res, next) => {
  try {
    const {
      name, father_name, gender, dob, batch_id, group_id,
      admission_date, admission_fee, monthly_fee,
      discount_type, discount_value, address, notes,
      parent_name, phone, whatsapp_number, relation,
    } = req.body;

    if (!name || !batch_id || !admission_date) {
      return res.status(400).json({ success: false, message: 'name, batch_id, admission_date required' });
    }

    // Verify batch exists
    const batch = await db('batches').where({ id: batch_id }).first();
    if (!batch) return res.status(400).json({ success: false, message: 'Batch not found' });

    const [student_id] = await db('students').insert({
      name, father_name, gender, dob,
      batch_id, group_id: group_id || null,
      photo_path: null,
      status: 'active',
      admission_date,
      admission_fee: admission_fee || batch.admission_fee || 0,
      monthly_fee: monthly_fee || batch.monthly_fee || 0,
      discount_type: discount_type || 'fixed',
      discount_value: discount_value || 0,
      address, notes,
    });

    let photo_path = null;
    if (req.file) {
      try {
        const { fullPath, relativePath } = Storage.getPhotoPath(student_id, req.file.originalname);
        if (sharp) {
          await sharp(req.file.path).resize(400, 400, { fit: 'cover' }).jpeg({ quality: 85 }).toFile(fullPath);
        } else {
          fs.copyFileSync(req.file.path, fullPath);
        }
        fs.unlinkSync(req.file.path);
        photo_path = relativePath;
        await db('students').where({ id: student_id }).update({ photo_path });
      } catch (photoErr) {
        console.warn('Photo processing failed:', photoErr.message);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    }

    if (parent_name && phone) {
      await db('student_contacts').insert({
        student_id, parent_name, phone,
        whatsapp_number: whatsapp_number || phone,
        relation: relation || 'father',
        is_primary: true,
      });
    }

    const student = await db('students').where({ id: student_id }).first();
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});

// PUT update student
router.put('/:id', upload.single('photo'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await db('students').where({ id }).first();
    if (!existing) return res.status(404).json({ success: false, message: 'Student not found' });

    const updates = { ...req.body, updated_at: new Date().toISOString() };
    delete updates.id;
    delete updates.photo;

    if (req.file) {
      try {
        const { fullPath, relativePath } = Storage.getPhotoPath(id, req.file.originalname);
        if (sharp) {
          await sharp(req.file.path).resize(400, 400, { fit: 'cover' }).jpeg({ quality: 85 }).toFile(fullPath);
        } else {
          fs.copyFileSync(req.file.path, fullPath);
        }
        fs.unlinkSync(req.file.path);
        if (existing.photo_path) Storage.deleteFile(existing.photo_path);
        updates.photo_path = relativePath;
      } catch (photoErr) {
        console.warn('Photo processing failed:', photoErr.message);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
    }

    await db('students').where({ id }).update(updates);
    res.json({ success: true, data: await db('students').where({ id }).first() });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});

// DELETE student
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const student = await db('students').where({ id }).first();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await db.transaction(async trx => {
      // Delete contacts first (foreign key)
      await trx('student_contacts').where({ student_id: id }).del();
      // Delete student
      await trx('students').where({ id }).del();
    });

    if (student.photo_path) Storage.deleteFile(student.photo_path);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
