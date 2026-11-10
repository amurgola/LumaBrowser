# SettingsModal

`ui/shell/settings/SettingsModal.js`

The Settings control panel: open on a tab (raising `settings:open`), close from X, backdrop or Escape (raising `settings:close` once), inline `data-gs-goto` links.

The sidebar groups the tabs: Browser (General `general`, Privacy & permissions `privacy`, Passwords & autofill `passwords`), AI and connections (AI & Providers `aiproviders`, Editors & agents `integrations`, API & MCP `apimcp`, Network Sharing `sharing`), Extensions (extension-owned tabs, then Manage extensions `extensions`) and About apart below. `TAB_ALIASES` maps tab ids from before the regroup (`security` to `sharing`), so older callers and deep links still land on a tab.

## Methods

- `install()`, `isOpen()`, `open(tab)`, `close()`, `hideQuietly()`, `switchTab(tab)`.
- `SettingsModal.resolveTab(tab)`, `TAB_ALIASES` (static).

## Globals

None (published as `window.openSettings` / `closeSettings`).
