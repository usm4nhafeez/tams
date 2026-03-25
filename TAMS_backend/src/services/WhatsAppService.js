const db   = require('../db/database');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs   = require('fs');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.client   = null;
    this.isReady  = false;
    this.qrCode   = null;
    this.mode     = process.env.WA_MODE || 'webjs'; // 'webjs' or 'meta'
  }

  // ── Initialize whatsapp-web.js client ─────────────
  async init() {
    if (this.mode !== 'webjs') return;

    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: './data/.wwebjs_auth' }),
      puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    });

    this.client.on('qr', qr => {
      this.qrCode = qr;
      qrcode.generate(qr, { small: true });
      console.log('WhatsApp QR code generated — scan in app');
    });

    this.client.on('ready', () => {
      this.isReady = true;
      this.qrCode  = null;
      console.log('WhatsApp client ready');
    });

    this.client.on('disconnected', () => {
      this.isReady = false;
      console.log('WhatsApp disconnected');
    });

    await this.client.initialize();
  }

  // ── Core send — works for both modes ──────────────
  async send({ to, message, filePath = null }) {
    const number = this.formatNumber(to);

    if (this.mode === 'meta') {
      return this.sendViaMeta({ to: number, message, filePath });
    }

    // whatsapp-web.js
    if (!this.isReady) throw new Error('WhatsApp client not ready');
    const chatId = `${number}@c.us`;

    if (filePath && fs.existsSync(filePath)) {
      const media = MessageMedia.fromFilePath(filePath);
      return this.client.sendMessage(chatId, media, { caption: message });
    }
    return this.client.sendMessage(chatId, message);
  }

  // ── Meta Cloud API send ───────────────────────────
  async sendViaMeta({ to, message, filePath }) {
    const axios = require('axios');
    const token   = process.env.META_API_TOKEN;
    const phoneId = process.env.META_PHONE_NUMBER_ID;
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message }
    };

    const { data } = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    return data;
  }

  // ── Log message to DB ─────────────────────────────
  async logMessage({ student_id, parent_number, message_type, message_body, status, wa_message_id, error_log }) {
    return db('whatsapp_logs').insert({
      student_id, parent_number, message_type, message_body,
      status: status || 'sent',
      wa_message_id,
      sent_at: new Date().toISOString(),
      error_log
    });
  }

  // ── Send with auto-retry (3 attempts) ────────────
  async sendWithRetry(params, student_id, message_type) {
    const MAX = 3;
    for (let attempt = 1; attempt <= MAX; attempt++) {
      try {
        const result = await this.send(params);
        await this.logMessage({ student_id, parent_number: params.to, message_type, message_body: params.message, status: 'sent', wa_message_id: result?.id });
        return result;
      } catch (err) {
        if (attempt === MAX) {
          await this.logMessage({ student_id, parent_number: params.to, message_type, message_body: params.message, status: 'failed', error_log: err.message });
          throw err;
        }
        await new Promise(r => setTimeout(r, attempt * 2000)); // back-off
      }
    }
  }

  // ── Monthly broadcast (1st and 5th) ──────────────
  async sendFeesBroadcast(month_year) {
    const pending = await db('student_fees')
      .select('student_fees.*', 'students.name', 'student_contacts.whatsapp_number', 'student_contacts.parent_name')
      .join('students', 'student_fees.student_id', 'students.id')
      .join('student_contacts', function() {
        this.on('student_contacts.student_id', 'students.id').andOn(db.raw('student_contacts.is_primary = 1'));
      })
      .whereIn('student_fees.status', ['pending', 'partial'])
      .where('student_fees.month_year', month_year);

    const results = [];
    for (const r of pending) {
      const msg = `Assalam-o-Alaikum ${r.parent_name},\n\nFees for ${r.name} for ${month_year} are due.\nAmount: PKR ${r.balance}\n\nPlease submit at the earliest.\n\nTips Academy`;
      try {
        await this.sendWithRetry({ to: r.whatsapp_number, message: msg }, r.student_id, 'fee_broadcast');
        results.push({ student: r.name, status: 'sent' });
      } catch {
        results.push({ student: r.name, status: 'failed' });
      }
    }
    return results;
  }

  // ── Individual dues alert (8th–11th) ─────────────
  async sendDuesAlerts(month_year) {
    // Same logic as broadcast but different message tone
    const pending = await db('student_fees')
      .select('student_fees.*', 'students.name', 'student_contacts.whatsapp_number', 'student_contacts.parent_name')
      .join('students', 'student_fees.student_id', 'students.id')
      .join('student_contacts', function() {
        this.on('student_contacts.student_id', 'students.id').andOn(db.raw('student_contacts.is_primary = 1'));
      })
      .whereIn('student_fees.status', ['pending', 'partial'])
      .where('student_fees.month_year', month_year);

    for (const r of pending) {
      const msg = `Dear ${r.parent_name},\n\nThis is a reminder that the fee of PKR ${r.balance} for ${r.name} (${month_year}) is still outstanding.\n\nKindly visit Tips Academy at your earliest convenience.\n\nJazakAllah Khair.`;
      await this.sendWithRetry({ to: r.whatsapp_number, message: msg }, r.student_id, 'fee_alert');
    }
  }

  // ── Absence alert ─────────────────────────────────
  async sendAbsenceAlert(student_id, date) {
    const student = await db('students')
      .select('students.name', 'student_contacts.whatsapp_number', 'student_contacts.parent_name', 'batches.name as batch_name')
      .join('student_contacts', function() { this.on('student_contacts.student_id', 'students.id').andOn(db.raw('student_contacts.is_primary = 1')); })
      .join('batches', 'students.batch_id', 'batches.id')
      .where('students.id', student_id).first();

    const msg = `Assalam-o-Alaikum ${student.parent_name},\n\nYour child ${student.name} (${student.batch_name}) was absent from Tips Academy today (${date}).\n\nPlease contact us if needed.\n\nTips Academy`;
    await this.sendWithRetry({ to: student.whatsapp_number, message: msg }, student_id, 'absence');
  }

  formatNumber(num) {
    // Convert 03001234567 → 923001234567
    let n = String(num).replace(/\D/g, '');
    if (n.startsWith('0')) n = '92' + n.slice(1);
    return n;
  }

  getStatus() {
    return { ready: this.isReady, mode: this.mode, qrPending: !!this.qrCode };
  }
}

module.exports = new WhatsAppService(); // singleton