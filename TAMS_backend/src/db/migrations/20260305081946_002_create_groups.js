exports.up = knex => knex.schema.createTable('groups', t => {
  t.increments('id').primary();
  t.integer('batch_id').notNullable().references('id').inTable('batches').onDelete('CASCADE');
  t.string('name').notNullable();    // 'Biology','Computer','General'
  t.text('description');
  t.timestamps(true, true);
});

exports.down = knex => knex.schema.dropTable('groups');