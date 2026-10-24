# AttachmentStrip

`core/llm-server/ui/js/chat/composer/AttachmentStrip.js`

The chips above every composer for what the next submit carries: editor
context from the Code surface ("app.js:12-40", never stored in the message) and
staged files (name, size from the one byte ladder, a red border with the reason
when unreadable; an open tab's page shows its inline favicon or a globe, and its
URL on hover; the Dashboard ([DashboardContext](DashboardContext.md)) shows
the grid icon and names its widgets on hover, `Dashboard: Agenda, Task board`; an image with readable pixels shows its own thumbnail instead of the icon,
and the picture itself (up to 360 by 240) floats above the chip while it is
hovered or focused, `.cm-att.has-preview`).
Each chip removes its item. While the conversation's documentation source is
on, the "LumaBrowser documentation" pill ([DocsSourceContext](DocsSourceContext.md),
`.cm-att.docs`, before the file chips) shows it; its x turns the source off.
The tab the user was just on is offered last as a dashed "Ask about <page>"
chip ([TabContext](TabContext.md)): clicking it stages the page, its x
dismisses it.

## Methods

- `add(files)`, `render()`.
- `AttachmentStrip.previewSrc(f)`: the image's data URL, or `''` for a failed
  read, a type outside `PREVIEW_MIME` (png, jpeg, gif, webp, bmp; the mime goes
  into the src unescaped, so it is checked) or base64 with other characters.
- `addContext(item, focus)`: needs a path or text; an identical chip is
  replaced; the newest 12 are kept (the IDE context builder's cap).
- `clearContext()`: chips point into the conversation's folder, so they leave
  with it.
- `AttachmentStrip.contextLabel(c)`, `AttachmentStrip.contextChipHtml(c, removable)`
  (also used for the sent turn's context strip).
- `AttachmentStrip.MAX_CONTEXT_CHIPS`.
