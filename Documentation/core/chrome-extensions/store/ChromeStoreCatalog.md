# ChromeStoreCatalog

`core/chrome-extensions/store/ChromeStoreCatalog.js`

The curated list behind the lite extension store in Settings > Extensions >
Chrome Extensions.

## Methods

- `ChromeStoreCatalog.list()`: every entry as
  `{ id, name, category, categoryLabel, description, compatibility, notes }`.
- `ChromeStoreCatalog.get(id)`: one entry, or `null`.
- `CATEGORIES`, `WORKS`, `PARTIAL`: the category labels and the two ratings.

## Choosing entries

An entry belongs here only when its core job works in Electron: content
scripts, `storage`, `runtime` messaging, a popup or options page (opened by
[ChromeExtensionPageWindows](../ChromeExtensionPageWindows.md)), or a DevTools
panel. Left out on purpose: anything built on `webRequest` or
`declarativeNetRequest` (ad blockers, privacy filters; the built-in adblocker
covers those), native messaging (1Password, KeePassXC), and the `userScripts`
API (Tampermonkey, Violentmonkey). `notes` says what to expect, including what
does not work for a `partial` entry.
