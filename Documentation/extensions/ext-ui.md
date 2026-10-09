# ext-ui.js (classic)

`extensions/ext-ui.js`

Classic-script exception: `window.LumaExtUI`, the small UI kit for extension
renderers in the main window, for renderers that stay classic scripts
(user-installed and `distributable: true` add-ons, which inject
`extensions/ext-ui.js` with a plain script tag and read the global in
`onload`). The path and global are a contract with those add-ons.

Bundled module code imports the classes in `extensions/ui-kit/ui/` instead.

## Legacy global -> module

| `window.LumaExtUI` | Module |
|---|---|
| `ready` (a resolved promise) | not needed with imports |
| `esc(s)` | `HtmlEscaper.escape(s)` (`core/llm-server/ui/js/format/`) |
| `alert(m)` | `Dialogs.alert(m)` (`core/llm-server/ui/js/dialogs/`) |
| `confirm(m, opts)` | `Dialogs.confirm(m, opts)` |
| `flashSaved(anchor, text)` | [SavedBadge](ui-kit/ui/SavedBadge.md)`.flash(anchor, text)` |
| `debounce(fn, ms)` | [Debounce](ui-kit/ui/Debounce.md)`.wrap(fn, ms)` |
| `menu(anchor, items)` | [OverflowMenu](ui-kit/ui/OverflowMenu.md)`.open(anchor, items)` |
| `closeMenu()` | `OverflowMenu.close()` |
| `intervalMarkup(id, ms)` | [IntervalPicker](ui-kit/ui/IntervalPicker.md)`.markup(id, ms)` |
| `bindInterval(root)` | `IntervalPicker.bind(root)` |
| `formatInterval(ms)` | `IntervalPicker.format(ms)` |
| `INTERVAL_PRESETS` | `IntervalPicker.PRESETS` |
| `formatTime(iso)` | [TimeText](ui-kit/ui/TimeText.md)`.formatTime(iso)` |
| `formatRelative(iso)` | `TimeText.formatRelative(iso)` |
| `icons.check / caret / more` | [ExtIcons](ui-kit/ui/ExtIcons.md)`.CHECK / CARET / MORE` |

## Globals

Writes `window.LumaExtUI` (once); reads `window.LumaModal`, `window.alert`,
`window.confirm`, `document`.
