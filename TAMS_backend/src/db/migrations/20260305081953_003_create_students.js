exports.up = knex => knex.schema.createTable('students', t => {
  t.increments('id').primary();
  t.string('name').notNullable();
  t.string('father_name');
  t.string('gender');                // 'male','female','other'
  t.string('dob');
  t.integer('batch_id').notNullable().references('id').inTable('batches');
  t.integer('group_id').references('id').inTable('groups');
  t.string('photo_path');            // relative: students/photos/123_1234567890.jpg
  t.string('status').defaultTo('active'); // active,inactive,graduated,withdrawn
  t.string('admission_date').notNullable();
  t.decimal('admission_fee', 10, 2).defaultTo(0);
  t.decimal('monthly_fee', 10, 2).defaultTo(0);
  t.string('discount_type').defaultTo('fixed'); // 'fixed' or 'percent'
  t.decimal('discount_value', 10, 2).defaultTo(0);
  t.string('address');
  t.text('notes');
  t.timestamps(true, true);
});

exports.down = knex => knex.schema.dropTable('students');