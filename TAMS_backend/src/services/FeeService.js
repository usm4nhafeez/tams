const db = require('../db/database');

module.exports = {

  // Calculate what a student owes for a given month
  calculateDue(student) {
    let discount = 0;
    if (student.discount_type === 'percent') {
      discount = (student.monthly_fee * student.discount_value) / 100;
    } else {
      discount = student.discount_value || 0;
    }
    return {
      amount_due: parseFloat(student.monthly_fee),
      discount:   parseFloat(discount.toFixed(2)),
      balance:    parseFloat((student.monthly_fee - discount).toFixed(2))
    };
  },

  // Generate fee records for all active students for a given month
  async generateMonthlyFees(month_year) {
    const students = await db('students').where({ status: 'active' });
    const existing = await db('student_fees').where({ month_year }).select('student_id');
    const existingIds = new Set(existing.map(e => e.student_id));

    const toInsert = [];
    for (const s of students) {
      if (existingIds.has(s.id)) continue; // skip if already generated
      const { amount_due, discount, balance } = this.calculateDue(s);
      toInsert.push({ student_id: s.id, month_year, amount_due, discount, amount_paid: 0, balance, status: 'pending' });
    }

    if (toInsert.length) await db('student_fees').insert(toInsert);
    return { generated: toInsert.length, skipped: existingIds.size };
  },

  // Generate receipt number
  generateReceiptNo() {
    const now = new Date();
    return `RCP-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${String(Date.now()).slice(-5)}`;
  },

  // Record a payment
  async recordPayment(fee_id, { amount_paid, payment_mode, notes }) {
    const fee = await db('student_fees').where({ id: fee_id }).first();
    if (!fee) throw new Error('Fee record not found');

    const newPaid   = parseFloat(fee.amount_paid) + parseFloat(amount_paid);
    const netDue    = parseFloat(fee.amount_due) - parseFloat(fee.discount);
    const newBalance = parseFloat((netDue - newPaid).toFixed(2));
    const status    = newBalance <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'pending';
    const receipt_no = status === 'paid' || status === 'partial' ? this.generateReceiptNo() : fee.receipt_no;

    await db('student_fees').where({ id: fee_id }).update({
      amount_paid: newPaid, balance: Math.max(0, newBalance),
      status, receipt_no, paid_date: new Date().toISOString().split('T')[0],
      payment_mode: payment_mode || 'cash', notes,
      updated_at: new Date().toISOString()
    });

    return await db('student_fees').where({ id: fee_id }).first();
  }
};