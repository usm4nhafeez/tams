const PDFDocument = require('pdfkit');
const path        = require('path');
const fs          = require('fs');
const db          = require('../db/database');
const Storage     = require('./StorageService');

module.exports = {

  async generateReceipt(fee) {
    const filename = `receipt_${fee.receipt_no}_${fee.month_year}.pdf`;
    const filePath = path.join(Storage.DIRS.receipts, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 40 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const ACADEMY = process.env.ACADEMY_NAME || 'Tips Academy';
      const blue    = '#1E3A5F';

      // Header
      doc.rect(0, 0, doc.page.width, 80).fill(blue);
      doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text(ACADEMY, 40, 20);
      doc.fontSize(10).font('Helvetica').text('Fee Receipt', 40, 50);

      doc.fillColor('black').moveDown(2);

      // Receipt details
      const y = 100;
      const addRow = (label, value, yPos) => {
        doc.fontSize(10).font('Helvetica-Bold').text(label, 40, yPos);
        doc.font('Helvetica').text(String(value), 200, yPos);
      };

      addRow('Receipt No:', fee.receipt_no,  y);
      addRow('Date:',       fee.paid_date || new Date().toISOString().split('T')[0], y + 20);
      addRow('Student:',    fee.name,         y + 40);
      addRow('Batch:',      fee.batch_name,   y + 60);
      addRow('Month:',      fee.month_year,   y + 80);

      // Divider
      doc.moveTo(40, y + 110).lineTo(360, y + 110).stroke(blue);

      addRow('Amount Due:', `PKR ${fee.amount_due}`,   y + 120);
      addRow('Discount:',   `PKR ${fee.discount}`,     y + 140);
      addRow('Amount Paid:',`PKR ${fee.amount_paid}`,  y + 160);

      doc.moveTo(40, y + 185).lineTo(360, y + 185).stroke(blue);

      const balance = parseFloat(fee.balance || 0);
      doc.fontSize(12).font('Helvetica-Bold')
         .fillColor(balance > 0 ? 'red' : 'green')
         .text(`Balance: PKR ${balance}`, 40, y + 195);

      doc.fillColor('gray').fontSize(9).font('Helvetica')
         .text('Thank you for your payment.', 40, y + 240, { align: 'center', width: 320 });

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  },

  async generateReportCard(student_id, month) {
    const student = await db('students')
      .select('students.*', 'batches.name as batch_name', 'groups.name as group_name')
      .leftJoin('batches', 'students.batch_id', 'batches.id')
      .leftJoin('groups',  'students.group_id',  'groups.id')
      .where('students.id', student_id).first();

    if (!student) throw new Error('Student not found');

    const results = await db('exam_results')
      .select('exam_results.*', 'exams.subject', 'exams.exam_type', 'exams.max_marks', 'exams.date')
      .join('exams', 'exam_results.exam_id', 'exams.id')
      .where('exam_results.student_id', student_id)
      .where('exams.date', 'like', `${month}%`)
      .orderBy('exams.subject');

    const attendance = await db('attendance')
      .where({ student_id })
      .where('date', 'like', `${month}%`)
      .select(db.raw("SUM(CASE WHEN status='P' THEN 1 ELSE 0 END) as present"),
              db.raw("SUM(CASE WHEN status='A' THEN 1 ELSE 0 END) as absent"),
              db.raw('COUNT(*) as total')).first();

    const filename = `${student_id}_${month}.pdf`;
    const filePath = path.join(Storage.DIRS.reportcards, filename);

    return new Promise((resolve, reject) => {
      const doc    = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const blue = '#1E3A5F';

      // Header
      doc.rect(0, 0, doc.page.width, 90).fill(blue);
      doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
         .text(process.env.ACADEMY_NAME || 'Tips Academy', 50, 20);
      doc.fontSize(12).font('Helvetica').text(`Monthly Report Card — ${month}`, 50, 52);

      doc.fillColor('black').moveDown(2);

      // Student info
      doc.fontSize(11).font('Helvetica-Bold').text(`Name: `, 50, 110, { continued: true });
      doc.font('Helvetica').text(student.name);
      doc.font('Helvetica-Bold').text(`Batch: `, 50, 130, { continued: true });
      doc.font('Helvetica').text(`${student.batch_name} ${student.group_name ? '| ' + student.group_name : ''}`);

      // Attendance summary
      if (attendance) {
        const pct = attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0;
        doc.font('Helvetica-Bold').text(`Attendance: `, 50, 150, { continued: true });
        doc.font('Helvetica').text(`${attendance.present}/${attendance.total} days (${pct}%)`);
      }

      // Results table header
      let y = 185;
      doc.rect(50, y, 495, 22).fill(blue);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
         .text('Subject', 55, y + 6)
         .text('Type', 200, y + 6)
         .text('Max', 300, y + 6)
         .text('Obtained', 360, y + 6)
         .text('%', 450, y + 6);

      doc.fillColor('black');
      y += 22;

      for (const r of results) {
        const shade = results.indexOf(r) % 2 === 0 ? '#F8FAFC' : 'white';
        doc.rect(50, y, 495, 20).fill(shade);
        doc.fillColor('black').fontSize(10).font('Helvetica')
           .text(r.subject,      55,  y + 5)
           .text(r.exam_type,    200, y + 5)
           .text(String(r.max_marks), 300, y + 5)
           .text(r.is_absent ? 'Absent' : String(r.marks_obtained), 360, y + 5);

        if (!r.is_absent && r.max_marks > 0) {
          const pct = Math.round((r.marks_obtained / r.max_marks) * 100);
          doc.text(`${pct}%`, 450, y + 5);
        }
        y += 20;
      }

      doc.fillColor('gray').fontSize(9).font('Helvetica')
         .text('Generated by Tips Academy Management System', 50, y + 30, { align: 'center', width: 495 });

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }
};