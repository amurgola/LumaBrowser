# SchemaTools

`core/shell/shellClassifier/rules/packages/SchemaTools.js`

[ToolFamily](ToolFamily.md) for database administration utilities and schema-migration tools.

## Table

- Server utilities: `dropdb` (data loss), `dropuser` (account removal), `pg_restore --clean|-c`, `mysqladmin drop`,
  `mongorestore --drop`.
- Migrations: `prisma migrate reset`, `prisma db push --force-reset|--accept-data-loss`, `drizzle-kit push --force`,
  `rails`/`rake` `RAILS_WIPES`, `php artisan` / `artisan` `ARTISAN_WIPES`, `alembic downgrade base`,
  `sequelize`/`sequelize-cli` `SEQUELIZE_WIPES`, `knex migrate:rollback --all`, `typeorm schema:drop`,
  `flyway clean`, `liquibase dropAll`. All are data loss.

## Why

Migrating forward and single-step rollbacks are everyday development; resets and drops wipe every row, so they always
ask.
