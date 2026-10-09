# DestructiveSql

`core/shell/shellClassifier/rules/packages/DestructiveSql.js`

Finds bulk-destructive statements in query text passed to a database shell, one `;`-separated statement at a time.

## Methods

- `DestructiveSql.find(text)` -> a label for the first destructive statement, or `null`. Labels: the matched
  `DROP <object>` words (`DROP TABLE`, `DROP KEYSPACE`, ...), `TRUNCATE`, `ALTER TABLE ... DROP`,
  `DELETE without WHERE`, `UPDATE without WHERE`, `dropDatabase()`, `drop()`, `an empty-filter delete`
  (`deleteMany({})` / `remove({})`).
- `CHECKS` -> the ordered checks: a `pattern`, or an `unfiltered` verb that counts only without `WHERE`.

## Why

Judging per statement means `delete from a where x; delete from b` is caught, and `WHERE` in one statement does not
excuse another. It reads text only; script files are not opened, and a destructive word inside a string literal errs
toward asking.
