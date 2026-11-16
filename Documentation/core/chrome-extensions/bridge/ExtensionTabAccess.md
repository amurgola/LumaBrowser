# ExtensionTabAccess

`core/chrome-extensions/bridge/ExtensionTabAccess.js` (main process)

Decides whether an extension may read a tab's address and title, by Chrome's
rule, for [ChromeTabs](ChromeTabs.md).

## Methods

- `ExtensionTabAccess.canRead(session, extId, url)`: true when the manifest of
  the extension as loaded in that session lists the `tabs` permission, or a
  host permission that matches `url` ([MatchPattern](MatchPattern.md)). False
  for an extension the session does not hold.
- `ExtensionTabAccess.hostPatterns(manifest)`: `host_permissions` (Manifest
  V3) plus the entries of `permissions` that are match patterns (Manifest V2
  mixes them in).

`activeTab` does not count: it grants a page on a user gesture, which the
bridge does not track. A context menu click hands the extension the full tab
regardless ([ChromeContextMenus](ChromeContextMenus.md)).
