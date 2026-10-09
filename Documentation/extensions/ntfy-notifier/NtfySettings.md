# NtfySettings

`extensions/ntfy-notifier/NtfySettings.js`

The ntfy server, default topic, username and password, stored in the
extension's settings (Settings > Extensions > Ntfy Notifications) so no
secret is ever typed into a chat or a scheduled task's prompt.

## Methods

- `new NtfySettings(db)`: `db` is the extension's DatabaseService
  (`context.db`), or null after deactivation.
- `read()` -> `{ server, topic, username, password }`; server, topic and
  username trimmed; an empty server becomes ntfy.sh. With no db, the defaults.
- `view()` -> `{ success: true, server, topic, username, hasPassword }`: the
  settings tab only learns whether a password is stored.
- `save(patch)`: string fields only; all but the password are trimmed.
  Returns `{ success: true }` or `{ success: false, error }`.
