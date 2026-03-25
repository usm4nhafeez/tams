exports.up = knex => knex.schema.createTable('attendance', t => {
  t.increments('id').primary();
  t.integer('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
  t.integer('batch_id').notNullable().references('id').inTable('batches');
  t.string('date').notNullable();    // 'YYYY-MM-DD'
  t.string('status').notNullable();  // 'P','A','L'
  t.string('marked_by');
  t.timestamps(true, true);
  t.unique(['student_id', 'date']); // one record per student per day
});

exports.down = knex => knex.schema.dropTable('attendance');