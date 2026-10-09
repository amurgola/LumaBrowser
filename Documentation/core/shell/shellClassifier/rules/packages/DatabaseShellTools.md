# DatabaseShellTools

`core/shell/shellClassifier/rules/packages/DatabaseShellTools.js`

[ToolFamily](ToolFamily.md) for database shells: `QUERY_SHELLS` (clickhouse-client, cqlsh, duckdb, Invoke-Sqlcmd,
mariadb, mongo, mongosh, mysql, psql, sqlcmd, sqlite3) and `redis-cli`.

## Methods

- `findRisk(tool, toolArgs)` -> data loss scoped `runs <statement>` when [DestructiveSql](DestructiveSql.md) finds a
  statement anywhere in the arguments; otherwise the table: redis `flushall|flushdb`, `del|unlink` (data loss) and
  `config set` (server config).

## Why

Queries arrive as argument text in every shell's own flag (`-c`, `-e`, `--eval`, `-Q`, `-Query`), so the whole text is
scanned instead of tracking each flag. Script files are not opened and stay a normal ask.
