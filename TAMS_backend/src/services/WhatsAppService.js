const db = require('../db/database');

class WhatsAppService {
  constructor() {
    this.client  = null;
    this.isReady = false;
    this.qrCode  = null;
    this.mode    = process.env.WA_MODE || 'disabled';
  }

  async init() {
    if (this.mode === 'disabled') {
      console.log('[WhatsApp] Service disabled. Set WA_MODE=webjs or WA_MODE=meta to enable.');
      return;
    }

    if (this.mode === 'webjs') {
      try {
        const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
        const qrcode = require('qrcode-terminal');

        this.client = new Client({
          authStrategy: new LocalAuth({ dataPath: './data/.wwebjs_auth' }),
          puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true },
        });

        this.client.on('qr', qr => {
          this.qrCode = qr;
          qrcode.generate(qr, { small: true });
          console.log('[WhatsApp] QR code generated — scan in app');
        });

        this.client.on('ready', () => {
          this.isReady = true;
          this.qrCode  = null;
          console.log('[WhatsApp] Client ready');
        });

        this.client.on('disconnected', () => {
          this.isReady = false;
          console.log('[WhatsApp] Disconnected');
        });

        await this.client.initialize();
      } catch (e) {
        console.warn('[WhatsApp] whatsapp-web.js not available:', e.message);
      }
    }
  }

  async send({ to, message, filePath = null }) {
    if (this.mode === 'disabled') {
      console.log(`[WhatsApp MOCK] To: ${to} | Message: ${message.substring(0, 50)}...`);
      return { id: 'mock_' + Date.now() };
    }
    if (this.mode === 'meta') return this.sendViaMeta({ to: this.formatNumber(to), message });

    if (!this.isReady) throw new Error('WhatsApp client not ready. Scan QR first.');
    const chatId = `${this.formatNumber(to)}@c.us`;

    if (filePath) {
      const fs = require('fs');
      const { MessageMedia } = require('whatsapp-web.js');
      if (fs.existsSync(filePath)) {
        const media = MessageMedia.fromFilePath(filePath);
        return this.client.sendMessage(chatId, media, { caption: message });
      }
    }
    return this.client.sendMessage(chatId, message);
  }

  async sendViaMeta({ to, message }) {
    const axios  = require('axios');
    const token  = process.env.META_API_TOKEN;
    const phoneId = process.env.META_PHONE_NUMBER_ID;
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
    const { data } = await axios.post(url, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    return data;
  }

  async logMessage({ student_id, parent_number, message_type, message_body, status, wa_message_id, error_log }) {
    return db('whatsapp_logs').insert({
      student_id, parent_number, message_type, message_body,
      status: status || 'sent',
      wa_message_id,
      sent_at: new Date().toISOString(),
      error_log,
    });
  }

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
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }

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
      const msg = `Assalam-o-Alaikum ${r.parent_name},\n\nFees for ${r.name} for ${month_year} are due.\nAmount: PKR ${r.balance}\n\nPlease submit at the earliest.\n\n${process.env.ACADEMY_NAME || 'Academy'}`;
      try {
        await this.sendWithRetry({ to: r.whatsapp_number, message: msg }, r.student_id, 'fee_broadcast');
        results.push({ student: r.name, status: 'sent' });
      } catch {
        results.push({ student: r.name, status: 'failed' });
      }
    }
    return results;
  }

  async sendDuesAlerts(month_year) {
    const pending = await db('student_fees')
      .select('student_fees.*', 'students.name', 'student_contacts.whatsapp_number', 'student_contacts.parent_name')
      .join('students', 'student_fees.student_id', 'students.id')
      .join('student_contacts', function() {
        this.on('student_contacts.student_id', 'students.id').andOn(db.raw('student_contacts.is_primary = 1'));
      })
      .whereIn('student_fees.status', ['pending', 'partial'])
      .where('student_fees.month_year', month_year);

    for (const r of pending) {
      const msg = `Dear ${r.parent_name},\n\nThis is a reminder that the fee of PKR ${r.balance} for ${r.name} (${month_year}) is still outstanding.\n\nKindly visit ${process.env.ACADEMY_NAME || 'the academy'} at your earliest.\n\nJazakAllah Khair.`;
      await this.sendWithRetry({ to: r.whatsapp_number, message: msg }, r.student_id, 'fee_alert');
    }
  }

  async sendAbsenceAlert(student_id, date) {
    const student = await db('students')
      .select('students.name', 'student_contacts.whatsapp_number', 'student_contacts.parent_name', 'batches.name as batch_name')
      .join('student_contacts', function() { this.on('student_contacts.student_id', 'students.id').andOn(db.raw('student_contacts.is_primary = 1')); })
      .join('batches', 'students.batch_id', 'batches.id')
      .where('students.id', student_id).first();

    if (!student) throw new Error('Student not found');
    const msg = `Assalam-o-Alaikum ${student.parent_name},\n\nYour child ${student.name} (${student.batch_name}) was absent from ${process.env.ACADEMY_NAME || 'Academy'} today (${date}).\n\nPlease contact us if needed.`;
    await this.sendWithRetry({ to: student.whatsapp_number, message: msg }, student_id, 'absence');
  }

  formatNumber(num) {
    let n = String(num).replace(/\D/g, '');
    if (n.startsWith('0')) n = '92' + n.slice(1);
    if (!n.startsWith('92')) n = '92' + n;
    return n;
  }

  getStatus() {
    return {
      ready: this.isReady,
      mode: this.mode,
      qrPending: !!this.qrCode,
      status: this.mode === 'disabled' ? 'disabled' : this.isReady ? 'connected' : 'disconnected',
    };
  }
}

module.exports = new WhatsAppService();
