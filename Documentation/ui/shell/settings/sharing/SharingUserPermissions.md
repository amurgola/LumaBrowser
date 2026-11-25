# SharingUserPermissions

`ui/shell/settings/sharing/SharingUserPermissions.js`

The permission editor of one sharing user, folded out under the user's row in
[SharingUsersList](SharingUsersList.md).

- Each share flag is a select: **Inherit (on/off)** (naming what the master
  setting gives today), **Allow** or **Block**.
- Chat models, image and video models and chat tools each have an "inherit the
  master settings" checkbox. Unticking it starts from what inheriting gave
  (every listed model, or the master tool list) and shows the checklist; tools
  render through [ToolGroupsView](../ToolGroupsView.md), without tools switched
  off globally.
- **Save permissions** sends the whole set (`core.sharing.host.setUserOverrides`).

## Methods

- `new SharingUserPermissions({ container, catalog, master, user,
  visibleToolGroups, onSave, onClose })`, `render()`.
- `SharingUserPermissions.stateFrom(overrides)` and `overridesFrom(state)`
  convert between the stored [UserOverrides](../../../../core/network-sharing/host/UserOverrides.md)
  shape and the editor state (`'inherit' | 'on' | 'off'` per flag, a Set or
  null per list).
- `inheritLabel(master, flag)`, `masterTools(master)`.
