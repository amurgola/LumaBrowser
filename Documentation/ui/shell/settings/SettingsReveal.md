# SettingsReveal

`ui/shell/settings/SettingsReveal.js`

Takes the user to one setting in the Settings modal and shows it: opens the tab
(and sub-tab, or the extension's page), expands any collapsed section or
`<details>` around the row, scrolls it to the middle and plays a short accent
highlight on it (`.gs-reveal` in settings-content.css). Used by the search palette
through [ShellPalette](../palette/ShellPalette.md).

## Methods

- `new SettingsReveal({ settings, getSlotManager, doc? })`: `settings` is the
  [SettingsModal](SettingsModal.md); the slot manager switches sub-tabs and opens
  extension pages.
- `reveal(target)`: `{ surface: 'shell', tab, subtab?, selector? }` or
  `{ surface: 'extension', extensionId }`. Resolves the highlighted element, or
  null (no selector, element not found, or an extension page).
- `expandAround(el)`: opens closed `<details>`, and a collapsed Network Sharing
  body through its own header so its remembered state stays right.
- `SettingsReveal.visibleRow(el)`: the labelled row around the control (a section
  title or description lights its whole section); when that row is hidden on
  this platform, the nearest shown section instead.
- `highlight(el)`: restarts the highlight even on the same row, focuses the
  row's control without scrolling, and clears after 2.6 s.
- `SettingsReveal.isShown(el)`.

## Why

Panels render some rows on `settings:open`, so `reveal` polls for the selector a
few times (40 tries, 25 ms apart) before giving up.
