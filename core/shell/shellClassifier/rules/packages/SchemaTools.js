const ToolFamily = require('./ToolFamily');
const VerbTable = require('./VerbTable');
const RiskEffect = require('./RiskEffect');

const { DATA_LOSS, ACCOUNT_REMOVAL } = RiskEffect;
const { oneOf } = VerbTable;

class SchemaTools extends ToolFamily {
  static RAILS_WIPES = Object.freeze(['db:drop', 'db:drop:all', 'db:reset', 'db:purge', 'db:purge:all', 'db:schema:load', 'db:migrate:reset', 'db:truncate_all']);
  static ARTISAN_WIPES = Object.freeze(['migrate:fresh', 'migrate:reset', 'migrate:refresh', 'db:wipe']);
  static SEQUELIZE_WIPES = Object.freeze(['db:drop', 'db:migrate:undo:all', 'db:seed:undo:all']);

  buildTable() {
    return new VerbTable([...SchemaTools._serverUtilities(), ...SchemaTools._migrationTools()]);
  }

  static _serverUtilities() {
    return [
      { tools: ['dropdb'], rows: [{ effect: DATA_LOSS }] },
      { tools: ['dropuser'], rows: [{ effect: ACCOUNT_REMOVAL }] },
      { tools: ['pg_restore'], rows: [{ when: (a) => a.hasOption('clean') || a.hasShortFlag('c'), effect: DATA_LOSS, scope: 'drops objects before restoring' }] },
      { tools: ['mysqladmin'], rows: [{ path: 'drop', effect: DATA_LOSS }] },
      { tools: ['mongorestore'], rows: [{ when: (a) => a.hasOption('drop'), effect: DATA_LOSS, scope: 'drops each collection first' }] },
    ];
  }

  static _migrationTools() {
    return [
      { tools: ['prisma'], rows: [
        { path: 'migrate reset', effect: DATA_LOSS },
        { path: 'db push', when: (a) => a.hasOption('force-reset', 'accept-data-loss'), effect: DATA_LOSS },
      ] },
      { tools: ['drizzle-kit'], rows: [{ path: 'push', when: (a) => a.hasOption('force'), effect: DATA_LOSS, scope: 'accepts data-loss statements unasked' }] },
      { tools: ['rails', 'rake'], rows: [{ anyWord: oneOf(...SchemaTools.RAILS_WIPES), effect: DATA_LOSS }] },
      { tools: ['php'], rows: [{ path: ['artisan', oneOf(...SchemaTools.ARTISAN_WIPES)], effect: DATA_LOSS }] },
      { tools: ['artisan'], rows: [{ path: [oneOf(...SchemaTools.ARTISAN_WIPES)], effect: DATA_LOSS }] },
      { tools: ['alembic'], rows: [{ path: 'downgrade base', effect: DATA_LOSS }] },
      { tools: ['sequelize', 'sequelize-cli'], rows: [{ anyWord: oneOf(...SchemaTools.SEQUELIZE_WIPES), effect: DATA_LOSS }] },
      { tools: ['knex'], rows: [{ path: 'migrate:rollback', when: (a) => a.hasOption('all'), effect: DATA_LOSS, scope: 'every batch' }] },
      { tools: ['typeorm'], rows: [{ anyWord: oneOf('schema:drop'), effect: DATA_LOSS }] },
      { tools: ['flyway'], rows: [{ anyWord: oneOf('clean'), effect: DATA_LOSS }] },
      { tools: ['liquibase'], rows: [{ anyWord: oneOf('dropall', 'drop-all'), effect: DATA_LOSS }] },
    ];
  }
}

module.exports = SchemaTools;
