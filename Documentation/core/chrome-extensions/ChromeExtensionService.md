# ChromeExtensionService

`core/chrome-extensions/ChromeExtensionService.js`

Installs, persists and loads unpacked Chrome extensions (uBlock Origin MV2,
Bitwarden, ...) into every tab session.

## Methods

- `new ChromeExtensionService(settingsDb, dataDir)`: `settingsDb.db` is the
  better-sqlite3 handle; extensions are copied under `<dataDir>/chrome-extensions`.
- `ready` is a plain flag the app shell sets once the default session has its
  extensions; `session-created` listeners only replay loads after that.
- `init()` creates the table ([ChromeExtensionSchema](ChromeExtensionSchema.md))
  and the store folder.
- `list()` returns every extension, newest first, as
  `{ id, name, version, path, manifestVersion, enabled, installedAt, source }`.
- `get(id)` returns one, or `null`.
- `installFromDirectory(srcPath)` reads the manifest
  ([ChromeExtensionManifest](ChromeExtensionManifest.md)), copies the folder to
  `<slug>-<8 hex>`, loads it into the default session to learn Electron's id,
  upserts the row (name/version fall back to Electron's values, then `Unknown`
  / `''`; manifest version defaults to 2), loads it into every other live
  session and returns the DTO. Rejects on a missing or invalid manifest.
- `remove(id)` unloads it everywhere, deletes its folder and row; `false` for
  an unknown id.
- `setEnabled(id, enabled)` saves the flag and loads or unloads it in every live
  session; `false` for an unknown id.
- `loadAllEnabled(sess)` loads every enabled extension into a session and
  returns how many were newly loaded (0 for a null session).
- `ensureLoadedForWebContents(wc)` does the same for a tab's session and reloads
  the tab only when something new was injected, so content scripts attach.
- `ChromeExtensionService.folderNameFor(name)` is the store folder name: the
  slug (max 32, fallback `ext`) plus 8 random hex characters.

## Why

Electron's `session.loadExtension()` does not persist across launches, and
persisted and CDP tabs get their own partitions, so the app keeps its own
record and replays the loads into every session. The copy in the managed store
never moves, which keeps the id Electron derives from the path stable.

Session bookkeeping lives in [ExtensionSessionLoader](ExtensionSessionLoader.md);
SQL lives in [ChromeExtensionRepository](ChromeExtensionRepository.md).
