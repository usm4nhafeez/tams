exports.up = knex => knex.schema.createTable('student_contacts', t => {
  t.increments('id').primary();
  t.integer('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
  t.string('parent_name').notNullable();
  t.string('phone').notNullable();
  t.string('whatsapp_number').notNullable();
  t.string('relation').defaultTo('father'); // father,mother,guardian
  t.boolean('is_primary').defaultTo(true);
  t.timestamps(true, true);
});

exports.down = knex => knex.schema.dropTable('student_contacts');