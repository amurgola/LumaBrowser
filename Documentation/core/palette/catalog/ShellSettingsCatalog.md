# ShellSettingsCatalog

`core/palette/catalog/ShellSettingsCatalog.js`

The searchable list of every user-facing setting in the shell Settings modal
(`index.html` `#settingsModal`), for the Shift Shift universal search palette. A
frozen array of plain-data entries: one per settings tab and subtab, one per
subsection that groups rows, and one per row (plus a few runtime-rendered
controls such as the Default LLM picker and the extension subtabs).

## Entry format

```js
{
  id: 'general.on-demand',             // stable, unique, lowercase, dot/kebab
  label: 'Luma On Demand',             // the exact UI wording
  description: 'Shows a small Luma tile on web pages; ...', // what it does, plain words
  keywords: ['page assistant', 'tile'], // 3 to 12 synonyms people would type
  path: ['General', 'Browsing'],       // tab label, then subsection title (then row, for nested items)
  kind: 'toggle',                      // toggle | select | number | text | button | list | section | page
  key: 'core.onDemand.enabled',        // persisted settings key, only when known for sure
  target: { surface: 'shell', tab: 'general', selector: '#gsOnDemand' },
}
```

`key` is set for every setting stored as one plain settings-database key (42 entries, traced to the module that
reads and writes it). The search palette shows those settings' current values through
[SettingValueSpecs](SettingValueSpecs.md), which needs a spec for each keyed entry (a drift test enforces it).
Left without a key on purpose: run on startup (an OS login item), the clear-data boxes (not saved), the CLI shim
(computed), telemetry and LLM trace (build mode or a launch flag can override the stored value), network mode and
the API key requirement (fields of one JSON object), and the sharing PIN (a secret).

`target.tab` is a `data-tab` value (general, aiproviders, apimcp, passwords,
security, extensions, about). `target.subtab` is set inside the Extensions or
About subtabs and is a key of `SettingsTabs.PANE_IDS`. `target.selector` is the
control id where there is one; the reveal code walks up to `.gs-row` and opens
ancestor collapsibles. Subsections without an id are addressed as
`#<tab>Settings > section.gs-subsection:nth-of-type(n) .gs-subsection-title`.

The description is both search text and context for the local model answering
"how do I..." questions, so it states what the setting really does (read from
the controller under `ui/shell/settings/`), with no en or em dashes.

## Adding an entry

1. Add the row to `index.html` as usual.
2. Add an entry here in the same tab and subsection order, with the control id as
   the selector.
4. An element built at runtime (not in the static page) goes in the test's
   `RUNTIME` allowlist with the module that renders it.

## Why

Settings are spread over five static tabs, two runtime tabs and many collapsible
groups, and the people who need a setting rarely know its label. A hand-written
list with synonyms and plain descriptions finds "make links open here" or "block
popups" where a label search would not, and the drift test keeps the list honest
as the modal changes.
