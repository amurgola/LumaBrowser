# RoleplayDebug

`extensions/roleplay-mode/mode/RoleplayDebug.js`

Test-harness entry points running single production stages on a data snapshot.

## Methods

- `new RoleplayDebug(chat)`; `reaction(payload)`, `outfit(payload)`,
  `staging(payload)`, `audit(payload)`; each answers `{ ok: false, error }` on a throw.
