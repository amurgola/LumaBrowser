const ToolFamily = require('./ToolFamily');
const VerbTable = require('./VerbTable');
const RiskEffect = require('./RiskEffect');
const DestructiveSql = require('./DestructiveSql');

const { DATA_LOSS, SERVER_CONFIG } = RiskEffect;

class DatabaseShellTools extends ToolFamily {
  static QUERY_SHELLS = Object.freeze([
    'clickhouse-client', 'cqlsh', 'duckdb', 'invoke-sqlcmd', 'mariadb', 'mongo', 'mongosh', 'mysql', 'psql', 'sqlcmd', 'sqlite3',
  ]);

  buildTable() {
    return new VerbTable([
      { tools: DatabaseShellTools.QUERY_SHELLS, rows: [] },
      { tools: ['redis-cli'], rows: [
        { path: 'flushall|flushdb', effect: DATA_LOSS },
        { path: 'del|unlink', effect: DATA_LOSS },
        { path: 'config set', effect: SERVER_CONFIG },
      ] },
    ]);
  }

  findRisk(tool, toolArgs) {
    const statement = DestructiveSql.find(toolArgs.text);
    if (statement) return { effect: DATA_LOSS, subject: tool, scope: `runs ${statement}`, preview: false };
    return super.findRisk(tool, toolArgs);
  }
}

module.exports = DatabaseShellTools;
