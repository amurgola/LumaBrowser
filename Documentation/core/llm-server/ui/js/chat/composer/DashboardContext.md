# DashboardContext

`core/llm-server/ui/js/chat/composer/DashboardContext.js`

Ask about the Dashboard: `@dashboard` (or `/dashboard`) in the composer reads
every widget placed on the Dashboard on the host and stages the text as one
attachment chip, so what the model sees is visible above the composer. Hidden
where the host has no Dashboard (the web client).

## Methods

- `available()`: `api.pageContext.readDashboard` exists.
- `DashboardContext.matches(query)`: an empty query or a prefix of `dashboard`
  (what [ComposerCommands](ComposerCommands.md) offers the row for).
- `async attach()`: calls `readDashboard`, drops any Dashboard chip already
  staged (a second mention is a fresh read, never a duplicate), then stages
  `DashboardContext.attachment(r)`, or on `{ success: false, error }` a red
  chip named `Dashboard` with the reason (`The Dashboard has no widgets yet.
  Open it and place a widget first.`). Focuses the composer.
- `DashboardContext.attachment(r)`: the staged text attachment: `name:
  'Dashboard'`, `language: 'markdown'`, `size` = `chars`, `source` =
  `"<n> widgets"` (so the sent marker reads
  `[Attached: Dashboard · 3 widgets · 12.3 KB]`, see
  [UserMessageComposer](UserMessageComposer.md)), `truncated`, and
  `dashboard: { widgets: [{ rootId, title }], at }` which
  [AttachmentStrip](AttachmentStrip.md) uses for the grid icon and the chip's
  tooltip. Lines opening a code fence are nudged (` ```) so a widget's text
  cannot close the attachment's own fence early; a truncated snapshot ends
  with `[The Dashboard had more; only the beginning is included.]`.
- `DashboardContext.iconHtml()`: `ChatIcons.grid`.

## Why

The Dashboard is where the user already consolidated their day (agenda, task
board, conversation queue, pinned live modules); one mention hands the model
exactly that view instead of a round of tool calls. The host side is
[DashboardSnapshot](../../../../../dashboard/DashboardSnapshot.md) through
[PageContextActions](../../../../ipc/PageContextActions.md)`.readDashboard`.
