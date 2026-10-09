# HubSection

`extensions/personal-hub/ui/settings/HubSection.js`

Base class of the Hub settings tab's sections. Each section contributes its
markup, binds its controls once the tab's container exists, loads its data,
and reaches the main process through the tab's `invoke`.

## Methods

- `new HubSection(tab)`: `tab` is the [HubSettingsTab](../HubSettingsTab.md)
  (`invoke`, `notify`, `reloadAll`).
- `html()`: the section's markup (subclasses implement).
- `bind(container)`: finds and wires the section's elements (once per
  activation); `unbind()` forgets the container.
- `load()`: loads the section's data; called on activation and every tab show.
- `invoke(channel, ...args)` / `call(channel, ...args)`: the raw reply, or the
  payload with a `{ success: false, error }` reply thrown as an Error.
- `$(id)`: the element `#ext-hub-<id>` inside the section's container; `$$(selector)`.
- `act(fn, successMessage)`: runs `fn`, reports a throw on the tab's notice
  line, shows the success message, then reloads the section.
