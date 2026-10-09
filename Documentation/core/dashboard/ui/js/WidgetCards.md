# WidgetCards

`core/dashboard/ui/js/WidgetCards.js`

Builds the grid cards.

## Methods

- `new WidgetCards(doc, { remove, reload, chat, schedule })`.
- `card(rootId, title, { kind })`: `.db-card` with `data-root-id` and
  `data-kind`, the escaped title (`HtmlEscaper.escape`) and
  `.db-card-body > .cm-live-root`. A live card (default) has the hidden
  Scheduled badge and Schedule / Reload / Chat / Remove buttons wired to the
  handlers; an `extension` card has only Reload and Remove (no owning chat, no
  scheduled refresh).
- `tombstone()`: "Missing module" card with only Remove (`data-tombstone="1"`).
- `WidgetCards.find(doc, rootId)`: the placed card or null.
