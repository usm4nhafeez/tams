exports.up = knex => knex.schema.createTable('exam_results', t => {
  t.increments('id').primary();
  t.integer('exam_id').notNullable().references('id').inTable('exams').onDelete('CASCADE');
  t.integer('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
  t.decimal('marks_obtained', 6, 2);
  t.boolean('is_absent').defaultTo(false);
  t.text('remarks');
  t.timestamps(true, true);
  t.unique(['exam_id', 'student_id']);
});

exports.down = knex => knex.schema.dropTable('exam_results');