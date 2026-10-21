# WorkerRegistrations

`core/chrome-extensions/shim/WorkerRegistrations.js`

Gets fresh chrome.* shim code into extension service workers that are already
registered.

## Methods

- `new WorkerRegistrations({ currentHash, log })`: `currentHash()` defaults to
  `ChromeApiShim.shimHash()`.
- `prepare(sess, extId)` runs before loading `extId` into `sess`. When the
  session's record does not say the worker was registered with the current
  shim, it calls `sess.clearStorageData({ origin: 'chrome-extension://<id>',
  storages: ['serviceworkers'] })` and resolves `true`. Never throws.
- `record(sess, extId)` after a successful load: stores the current hash.

The record is `luma-extension-workers.json` in `sess.storagePath` (the
profile folder for the default session, `Partitions/<name>` for a
partition). Sessions without a storage path are skipped.

## Why

Measured on Electron 43 (2026-10-21): Chromium keeps an extension worker's
scripts, imported ones included, from its first registration until the
extension's version changes. The shim file on disk was updated, but the
running worker kept the old copy, so a shim fix (the `storage.sync` alias that
Dark Reader needs) never reached an installed extension. Renaming the wrapper
does not help either: the registration stays on the old URL, which then points
at a missing file. Clearing only the `serviceworkers` storage of that origin
makes the next `loadExtension` register the worker again from disk. The
extension's `chrome.storage` data lives in Local Extension Settings and is kept
(checked: Dark Reader's settings survived).

The first boot after a shim change re-registers each worker, so a page that
loads at that moment may miss the extension until it reloads.

Used by [ExtensionSessionLoader](../ExtensionSessionLoader.md).
