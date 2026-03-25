exports.up = knex => knex.schema.createTable('batches', t => {
  t.increments('id').primary();
  t.string('name').notNullable();
  t.string('grade').notNullable();       // '9','10','11','12','custom'
  t.string('academic_year').notNullable(); // '2025-26'
  t.decimal('monthly_fee', 10, 2).defaultTo(0);
  t.decimal('admission_fee', 10, 2).defaultTo(0);
  t.boolean('is_active').defaultTo(true);
  t.text('notes');
  t.timestamps(true, true);
});

exports.down = knex => knex.schema.dropTable('batches');
