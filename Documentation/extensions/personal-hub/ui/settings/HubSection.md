# HubSection

`extensions/personal-hub/ui/settings/HubSection.js`

Base class of the Hub's settings sections (in Settings > Hub, and for some
also in the Dashboard's settings panel). Each section contributes its
markup, binds its controls once the container exists, loads its data, and
reaches the main process through its host's `invoke`. Ids are prefixed
`ext-hub-`.

## Methods

- `new HubSection(tab)`: `tab` is whatever shows the section, the
  [HubSettingsTab](../HubSettingsTab.md) or the Dashboard's
  [HubSettingsPanel](../widgets/HubSettingsPanel.md)
  (`invoke(channel, ...args)`, `notify(message, ok)`, `reloadAll()`).
- `html()`: the section's markup (subclasses implement).
- `bind(container)`: finds and wires the section's elements (once per
  activation); `unbind()` forgets the container.
- `load()`: loads the section's data; called on activation and every tab show.
- `invoke(channel, ...args)` / `call(channel, ...args)`: the raw reply, or the
  payload with a `{ success: false, error }` reply thrown as an Error.
- `$(id)`: the element `#ext-hub-<id>` inside the section's container; `$$(selector)`.
- `act(fn, successMessage)`: runs `fn`, reports a throw on the tab's notice
  line, shows the success message, then reloads the section.

## Why

This file and the three sections the Dashboard's settings panel shows
([SummarySection](SummarySection.md), [ContextsSection](ContextsSection.md),
[PeopleSection](PeopleSection.md)) are listed in the manifest's
`dashboard.assets`. Dashboard widget files are served as plain ES modules,
not bundled, so an import that leaves the extension would not resolve
there. The shared files therefore import only from the extension's own ui
folder: [WidgetDom](../widgets/WidgetDom.md)`.esc` does the escaping in
place of core's HtmlEscaper. The sections that stay in Settings alone still
import from core and the ui kit.
