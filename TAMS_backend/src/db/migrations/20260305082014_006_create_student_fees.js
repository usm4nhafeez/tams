exports.up = knex => knex.schema.createTable('student_fees', t => {
  t.increments('id').primary();
  t.integer('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
  t.string('month_year').notNullable(); // 'YYYY-MM'
  t.decimal('amount_due', 10, 2).notNullable();
  t.decimal('discount', 10, 2).defaultTo(0);
  t.decimal('amount_paid', 10, 2).defaultTo(0);
  t.decimal('balance', 10, 2).defaultTo(0);
  t.string('paid_date');
  t.string('payment_mode').defaultTo('cash'); // cash,bank,other
  t.string('receipt_no');
  t.string('status').defaultTo('pending'); // pending,partial,paid
  t.text('notes');
  t.timestamps(true, true);
  t.unique(['student_id', 'month_year']);
});

exports.down = knex => knex.schema.dropTable('student_fees');