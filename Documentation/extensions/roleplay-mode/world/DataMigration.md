# DataMigration

`extensions/roleplay-mode/world/DataMigration.js`

Upgrades a conversation's persisted roleplay data to the current shape in
place; idempotent.

## Methods

- `DataMigration.migrate(data)` backfills per-character seeds, promotes a
  legacy `avatar` to `art.base` and `art.fullBody` to `figure`, stamps
  `version`; returns true when anything changed. Junk input returns false.
- `DataMigration.VERSION` (1).
