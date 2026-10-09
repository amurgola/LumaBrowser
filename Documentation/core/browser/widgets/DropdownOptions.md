# DropdownOptions

`core/browser/widgets/DropdownOptions.js`

Works the options of one opened dropdown in a tab.

## Methods

- `new DropdownOptions(wc)`.
- `open(info)`: a trusted click on the combobox point, or a page-world click on the marked trigger
  (`OPEN_TARGET_SCRIPT`) when something covers it.
- `list()`: the current options (`SelectScripts.collectOptionsScript`).
- `waitForOptions({ timeoutMs = 1500, interval = 120 })`: polls `list()` until options appear (popups
  animate in and load asynchronously).
- `find(listed, wanted, { maxScrolls = 60 })` returns `{ hit, allOptions }`. Scrolls a virtualized list a
  page at a time until an exact match (score 100) renders, keeping every option seen. Option indices are
  renumbered on every listing, so a hit always comes from the current listing: when the best inexact
  match scrolled out, the list is rewound and walked again until that label renders.
- `click(index)`: trusted click on option N, or a page-world click (`method: 'synthetic'`) when covered.
