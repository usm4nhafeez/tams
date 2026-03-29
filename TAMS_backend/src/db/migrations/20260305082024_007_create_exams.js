exports.up = knex => knex.schema.createTable('exams', t => {
  t.increments('id').primary();
  t.integer('batch_id').notNullable().references('id').inTable('batches');
  t.integer('group_id').references('id').inTable('groups');
  t.string('subject').notNullable();
  t.string('exam_type').notNullable(); // 'quiz','weekly','board_prep','monthly'
  t.string('date').notNullable();      // 'YYYY-MM-DD'
  t.decimal('max_marks', 6, 2).notNullable();
  t.decimal('passing_marks', 6, 2).defaultTo(0);
  t.string('session_id');              // groups exams into a test session
  t.text('description');
  t.boolean('is_locked').defaultTo(false);
  t.timestamps(true, true);
});

exports.down = knex => knex.schema.dropTable('exams');