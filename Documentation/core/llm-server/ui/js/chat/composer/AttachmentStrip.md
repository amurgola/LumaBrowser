# AttachmentStrip

`core/llm-server/ui/js/chat/composer/AttachmentStrip.js`

The chips above every composer for what the next submit carries: editor
context from the Code surface ("app.js:12-40", never stored in the message) and
staged files (name, size from the one byte ladder, a red border with the reason
when unreadable; an open tab's page shows its inline favicon or a globe, and its
URL on hover; the Dashboard ([DashboardContext](DashboardContext.md)) shows
the grid icon and names its widgets on hover, `Dashboard: Agenda, Task board`).
Each chip removes its item. While the conversation's documentation source is
on, the "LumaBrowser documentation" pill ([DocsSourceContext](DocsSourceContext.md),
`.cm-att.docs`, before the file chips) shows it; its x turns the source off.
The tab the user was just on is offered last as a dashed "Ask about <page>"
chip ([TabContext](TabContext.md)): clicking it stages the page, its x
dismisses it.

## Methods

- `add(files)`, `render()`.
- `addContext(item, focus)`: needs a path or text; an identical chip is
  replaced; the newest 12 are kept (the IDE context builder's cap).
- `clearContext()`: chips point into the conversation's folder, so they leave
  with it.
- `AttachmentStrip.contextLabel(c)`, `AttachmentStrip.contextChipHtml(c, removable)`
  (also used for the sent turn's context strip).
- `AttachmentStrip.MAX_CONTEXT_CHIPS`.
