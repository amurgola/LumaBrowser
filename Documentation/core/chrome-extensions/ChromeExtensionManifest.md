# ChromeExtensionManifest

`core/chrome-extensions/ChromeExtensionManifest.js`

Reads an unpacked Chrome extension's `manifest.json`.

## Methods

- `ChromeExtensionManifest.read(dirPath)` returns the parsed manifest. Throws
  `manifest.json not found in <dir>` when the file is missing.
- `ChromeExtensionManifest.parse(raw)` drops a leading byte order mark, parses
  the text as plain JSON, and only if that fails strips comments and parses
  again; throws `Invalid manifest.json: <reason>`.
- `ChromeExtensionManifest.stripComments(raw)` walks the text and removes
  `/* */` blocks and `//` comments that sit outside string literals. String
  contents (including backslash escapes) are copied through untouched.
- `ChromeExtensionManifest.localized(manifest, dirPath, field)` returns the
  field, resolving a `__MSG_key__` value (key case-insensitive) from
  `_locales/<default_locale>/messages.json`; `null` when it cannot.
- `ChromeExtensionManifest.pagesOf(manifest)` returns `{ popup, options }`:
  `action` / `browser_action` / `page_action` `default_popup`, and
  `options_ui.page` or `options_page`, without a leading slash, or `null`.

## Why

Chrome accepts comments in `manifest.json` and some published extensions ship
them, but store manifests are also full of match patterns such as `"*://*/*"`
and `"https://*/*"`. A regex stripper reads the `/*` in one pattern and the
`*/` in the next as a block comment and corrupts the file (Bitwarden failed
with "Expected ',' or ']' after array element"). Hence plain JSON first and a
string-aware stripper as the fallback.

## iconOf

`ChromeExtensionManifest.iconOf(manifest, size = 32)` returns the
extension-relative path of the toolbar icon: a string `action.default_icon`
as is, otherwise the smallest of the action's and `icons`' sizes at or above
`size` (the largest when all are smaller), action sizes winning ties. `null`
when the manifest declares none.
