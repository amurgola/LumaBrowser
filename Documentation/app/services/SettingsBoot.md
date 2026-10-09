# SettingsBoot

`app/services/SettingsBoot.js`

Opens `<dataDir>/settings.db` and runs the fix-ups every service relies on.

## Methods

- `new SettingsBoot({ dataDir, appPaths?, log? })`; `appPaths` defaults to the
  [AppPaths](../../core/shared/AppPaths.md) statics.
- `open()` returns the [SettingsDatabase](../../core/database/SettingsDatabase.md) after:
  - `AgentToolCatalog.seedDefaultOffAgentTools(db)`: the programmatic tools
    (`send_webhook`, `send_notification_ntfy`) join the chat-tool denylist once
    per name, so a later enable sticks. A failure warns
    `default-off tool seeding failed:`.
  - resolving the managed models/runtimes base; when it moved off the install
    dir, `db.replacePathPrefix(from, to)` rewrites persisted absolute paths and
    logs `[appPaths] remapped <n> setting(s): <from> -> <to>`.
- `markMigrated(db)` writes `migration.v2` (an ISO time) once and logs
  `Database migration v2: complete`; false when already written.
