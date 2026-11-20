# NotificationLogHtml

`ui/shell/notifications/NotificationLogHtml.js`

Markup of the floating log: countdown ring, title with dismiss, escaped entries, each with its button when it has one.

## Methods

- `NotificationLogHtml.render(entries, autoCloseMs)`; entries are `{ id, message, type, time, action: { label } | null }`. An entry with an action gets a `.log-action-btn` (`data-bd-action="log-action"`, `data-bd-id` the entry id); a log held open by one gets `is-held` (no countdown).

## Globals

None.
