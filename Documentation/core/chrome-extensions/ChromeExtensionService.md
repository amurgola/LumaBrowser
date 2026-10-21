# ChromeExtensionService

`core/chrome-extensions/ChromeExtensionService.js`

Installs, persists and loads Chrome extensions (unpacked folders, or Chrome Web
Store packages unpacked by [ChromeStoreInstaller](store/ChromeStoreInstaller.md))
into every tab session.

## Methods

- `new ChromeExtensionService(settingsDb, dataDir)`: `settingsDb.db` is the
  better-sqlite3 handle; extensions are copied under `<dataDir>/chrome-extensions`.
- `ready` is a plain flag the app shell sets once the default session has its
  extensions; `session-created` listeners only replay loads after that.
- `init()` creates the table ([ChromeExtensionSchema](ChromeExtensionSchema.md))
  and the store folder.
- `list()` returns every extension, newest first, as
  `{ id, name, version, path, manifestVersion, enabled, installedAt, source, pages }`.
  `source` is `unpacked` or `webstore`; `pages` is `{ popup, options }`, read
  from the manifest on disk at each call so an update's pages show at once.
- `get(id)` returns one, or `null`.
- `installFromDirectory(srcPath)` reads the manifest
  ([ChromeExtensionManifest](ChromeExtensionManifest.md)), copies the folder to
  `<slug>-<8 hex>`, loads it into the default session to learn Electron's id,
  upserts the row (name/version fall back to Electron's values, then `Unknown`
  / `''`; manifest version defaults to 2), loads it into every other live
  session and returns the DTO. Rejects on a missing or invalid manifest. A
  `__MSG_x__` name resolves from the default locale.
- `installFromStorePackage(srcPath, storeId)` does the same for a store package
  whose manifest carries the publisher key, with source `webstore`. Rejects when
  Electron loads it under another id. An installed copy with that id is
  unloaded first and deleted only once the new copy loads; if loading fails, the
  new copy is deleted, the old one is loaded again, and the error is rethrown.
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

## chrome.* shim

`new ChromeExtensionService(settingsDb, dataDir, { bridge })` takes an optional
[ShimBridge](bridge/ShimBridge.md), kept as `service.bridge`. The loader
attaches it to every session it tracks, and `remove` and `setEnabled(false)`
call `bridge.forgetExtension(id)` so its menu items go.

`_copyIntoStore` runs [ChromeApiShim](shim/ChromeApiShim.md) on the store copy of every install, so the extension's background and pages see stubs for the `chrome.*` APIs Electron lacks instead of throwing. The user's source folder is never modified; a shim failure is logged and the extension still installs.

## Loads in flight and stalled first navigations

Electron 43 never finishes a navigation that overlaps `loadExtension` in the
same session: the page either stays blank with nothing loading, or spins
forever. On a boot with Bitwarden installed this hung the LLM tab and every
restored tab whose partition was created at boot.

- `loadAllEnabled(sess)` starts every load before its first `await`, in
  parallel, so the loader knows all of them at once.
- `loadsInFlight(sess)` returns a promise that resolves when those loads
  finish, or `null` when none are running. `TabLifecycle` holds a new tab's
  first `loadURL` on it (see `TabViewFactory.extensionsSettling`).

`ensureLoadedForWebContents(wc)` runs as a tab is created, before its first
`loadURL`. It loads every enabled extension into the tab's session, waits for
`settled(session)` (loads started by `session-created` included), then:

- if the first navigation already committed or failed, reloads the page when
  something new was injected (content scripts attach);
- otherwise hands over to [FirstNavigationGuard](FirstNavigationGuard.md),
  a fallback that restarts a navigation Electron stalled anyway.

## Icons

The list DTO carries `icon`: a `data:` URL of the toolbar icon chosen by
`ChromeExtensionManifest.iconOf` (png, svg, jpg or webp inside the extension
folder), or `null`. The shell's toolbar buttons draw it.

## init refreshes the shim

`init()` runs `ChromeApiShim.apply` on every installed folder, so the copy of
the shim inside an extension installed by an older build is replaced by the
current one. [WorkerRegistrations](shim/WorkerRegistrations.md) then makes the
extension's service worker actually load it.

## description

The list DTO carries `description`: the manifest description in the default
locale (`__MSG_` resolved), or `''`.
