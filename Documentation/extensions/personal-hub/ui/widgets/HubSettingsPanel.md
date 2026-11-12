# HubSettingsPanel

`extensions/personal-hub/ui/widgets/HubSettingsPanel.js`

The Hub's settings on the Dashboard: a dialog over the page with the
settings that shape the distilled view (summaries and their model, contexts,
people), so they can be changed without leaving for Settings. It shows the
very same section classes as Settings > Hub
([SummarySection](../settings/SummarySection.md),
[ContextsSection](../settings/ContextsSection.md),
[PeopleSection](../settings/PeopleSection.md)) and plays the part of their
settings tab: it gives them `invoke`, `notify` and `reloadAll`
([HubSection](../settings/HubSection.md)), and sends every call through the
Dashboard host to the main-process handlers the settings tab uses
([HubIpcHandlers](../../HubIpcHandlers.md)). Setting up accounts (calendars,
trackers, sign-ins, automation) stays in Settings > Hub. Listed in the
manifest's `dashboard.assets`, together with the section files it imports.

## Behaviour

- The dialog (`.hub-settings`, `role="dialog"`, labelled `Hub settings`)
  sits in a full-page backdrop (`.hub-settings-backdrop`) appended to the
  document body, so it is not clipped by the widget that opened it.
  [HubWidgetStyles](HubWidgetStyles.md)`.ensure` is called first.
- Head: the title `Hub settings`, the pane switch (`.hub-settings-tabs`, a
  tablist with `aria-selected`) and the close button
  (`.hub-settings-close`).
- Panes (`PANES`): `summary` (`Summaries`), `contexts` (`Contexts`) and
  `people` (`People`), one `.hub-settings-pane` (`data-pane`) each holding
  that section's markup. All three are built, bound and loaded when the
  panel opens; switching only changes which one is shown. An unknown pane
  name opens on `summary`.
- The notice line (`.hub-settings-notice`, id `ext-hub-notice`) under the
  head shows what a section reports, plain or red (`is-error`), and clears
  after `NOTICE_MS` = 6000.
- Foot: `Accounts, calendars, task trackers and automation are set up in
  Settings > Hub.`.
- Escape, the close button and a mouse press on the backdrop outside the
  dialog close it. Closing unbinds the sections, removes the element and
  the key listener and clears the notice timer.
- One panel per page (`_current`): opening it from a second widget closes
  the first and opens it there.

## Methods

- `static button(host, pane = 'summary')`: the small gear button for a
  widget's head (`.hub-icon-btn.hub-open-settings`, titled `Hub settings`,
  [TaskChrome](TaskChrome.md)`.icon('settings')`); a click opens the panel
  on that pane in the button's own document. `host` is the widget host.
- `static open(host, pane = 'summary', doc = document)`: closes the current
  panel if there is one, opens a new one and returns it. `panel.shown` is a
  promise that resolves once the sections are loaded.
- `static closeCurrent()`: closes the open panel, if any. The focus and
  activity widgets call it from `dispose()`.
- `new HubSettingsPanel(host, doc = document)`: builds one instance of each
  section with the panel as its tab.
- `isOpen()`.
- `async show(pane = 'summary')`: builds the dialog, binds every section to
  its pane and loads them; resolves once they are loaded.
- `close()`.

What a section expects of its settings tab:

- `invoke(channel, ...args)`: `host.call('settingsInvoke', channel, args)`.
  The channel names are the settings tab's, and the reply is the same
  `{ success, ...payload }` or `{ success: false, error }` envelope. Only
  the channels in `HubIpcHandlers.PANEL_CHANNELS` are answered.
- `notify(message, ok)`: the notice line; `ok` false is red.
- `async reloadAll()`: loads every section in parallel; one failing section
  reports on the notice line and never blocks the others. Does nothing once
  closed.

## Host calls

`settingsInvoke`.

## Why

The gear sits where the user notices that something is off: a card filed
under the wrong context, summaries still written by rules. Sharing the
section classes and the handler table means there is one implementation of
each setting, so it reads and behaves the same in both places. The panel is
limited to what shapes the view; anything that signs in or holds a token
keeps to the Settings page.
