exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('exams', 'name');
  if (!hasColumn) {
    return knex.schema.alterTable('exams', (t) => {
      t.string('name');
    });
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('exams', 'name');
  if (hasColumn) {
    return knex.schema.alterTable('exams', (t) => {
      t.dropColumn('name');
    });
  }
};
