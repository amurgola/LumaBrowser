# ExtCard

`core/shell/ui/settings/ExtCard.js` (ES module)

The extension card every Settings > Extensions pane draws with: Extensions,
Inactive, Browse Extensions, and both lists of Chrome Extensions (installed
and the store). One component is what makes the four panes read as one
system.

## Shape

- **Folded (one line, about 52px):** the active checkbox (only for things
  that are installed), the extension's icon or its initial on a neutral
  square, name and muted version, a one-line summary clamped with an
  ellipsis, a state word when it matters (`Installed`, `Partial support`,
  `Not running`, `Error`), at most one primary action, and a chevron.
- **Unfolded:** a sunken tray (`--surface-sunken`) hangs under the head, the
  same block shape as the New chat tray in the LLM tab: full description,
  `label: value` details (IDs in mono), trusted extra markup (dependency tags,
  why a checkbox is locked), an error line, and the secondary actions
  (Options, Reinstall, Delete or Remove in the danger style).
- Cards are peers in `.ext-item-list`: a `--border-soft` border each, 8px
  apart, no shadow, nothing nested. An open card's border goes to
  `--border-strong` and its head to `--bg-surface-2`.

The checkbox follows the API & MCP tools list: checked is active. Whether an
action says Update or Reinstall is the pane's call: Update only when a newer
version is known, as the folded primary; Reinstall otherwise, in the tray.

## API

- `ExtCard.html(spec)` returns the markup; see the comment in the file for
  every field. The root carries `ext-list-item` (and `ext-list-item--disabled`
  / `--error`), the name `ext-list-item-name`, the summary
  `ext-list-item-desc`, so older selectors and e2e scripts keep working.
- `ExtCard.listHtml(cards)` wraps cards in the shared list element.
- `ExtCard.wireFolding(container, { onToggle })` adds one delegated click
  listener (idempotent): the chevron or the name/summary folds a card;
  `onToggle(id, open)` lets a pane keep cards open across re-renders.

Styles: `ui/shell/css/settings-content.css` (`.ext-item*`, plus the
`.ext-pane-*` scaffolding: intro line, head with title and controls, group
labels). The prefix is `ext-item` because `.ext-card` is already taken by
extension configuration panels.
