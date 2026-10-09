# DisabledExtensions

`core/shell/extensions/DisabledExtensions.js`

The user-disabled extension ids, persisted in the `shell.extensions.disabled` setting.

## Methods

- `new DisabledExtensions(db)` (`db` get/set, or null for in-memory).
- `set` the current Set; `has(id)`; `add(id)` and `remove(id)` write through.
- `refresh()` re-reads the setting and returns true when it changed (the setup
  wizard writes it after the manager is built).
