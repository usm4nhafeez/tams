exports.up = knex => knex.schema.createTable('subjects', t => {
  t.increments('id').primary();
  t.integer('batch_id').notNullable().references('id').inTable('batches').onDelete('CASCADE');
  t.string('name').notNullable();
  t.string('code');
  t.boolean('is_active').defaultTo(true);
  t.timestamps(true, true);
});

exports.down = knex => knex.schema.dropTable('subjects');