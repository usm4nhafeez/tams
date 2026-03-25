exports.up = knex => knex.schema.createTable('whatsapp_logs', t => {
  t.increments('id').primary();
  t.integer('student_id').references('id').inTable('students');
  t.string('parent_number').notNullable();
  t.string('message_type').notNullable(); // fee_broadcast,fee_alert,absence,manual,report_card
  t.text('message_body');
  t.string('status').defaultTo('pending'); // pending,sent,delivered,failed
  t.string('wa_message_id');               // ID returned by WA API
  t.integer('retry_count').defaultTo(0);
  t.string('sent_at');
  t.text('error_log');
  t.timestamps(true, true);
});

exports.down = knex => knex.schema.dropTable('whatsapp_logs');