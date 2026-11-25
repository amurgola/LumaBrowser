# SharingUsersList

`ui/shell/settings/sharing/SharingUsersList.js`

The **Users** fold of Settings > Sharing (host): add a person or group, copy
their login link, issue a new key, remove them, and open their permission
editor ([SharingUserPermissions](SharingUserPermissions.md)).

## Methods

- `new SharingUsersList({ sharingApi, reload, visibleToolGroups })`.
- `install()`, `render(cfg)` (reads `cfg.users` and keeps `cfg` as the master
  settings the editor shows as Inherit), `forgetCatalog()` (Settings reopened).
- `SharingUsersList.countText(users)`, `overridesText(overrides)`, `rowHtml(user)`.

## Behaviour

- Each row has two lines beside its buttons: the name and kind, then what the user overrides, what they used and
  when. One line of columns squeezed the name under its neighbours in a narrow Settings pane (2026-11-25).
- **Add user** shows the new login link once in a notice with a Copy button.
- **Copy link** copies `<web base URL>/?apiKey=<key>` (`core.sharing.host.userLoginLink`).
- **New key** (confirmed) replaces the key; the old key and link stop working.
- **Remove** (confirmed) deletes the user and its usage.
- **Permissions** folds the editor out under the row; it reads the permission
  catalog (`core.sharing.host.permissionCatalog`) once per Settings session.
