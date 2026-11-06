# VaultAudit

`core/vault/VaultAudit.js`

The record of every time the assistant tried to use a vault item. Each row is `{ at, action, item: { kind, name },
site, caller, ok, reason }` and never holds a secret. Stored under `core.vault.audit`, newest first, at most 200 rows.
Always on, unlike the general activity log, and shown in Settings > Passwords & autofill.

## Methods

- `new VaultAudit(db, { now, mirror })`, `setMirror(fn)` (FoundationServices mirrors rows into the activity log as
  caller `core.vault`, which shows only when the user turns that caller on).
- `record(entry)`, `list()`, `clear()`.
