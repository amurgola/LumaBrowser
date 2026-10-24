# ui/panel

`extensions/desktop-integration/features/lumabyte/ui/panel.html`, `panel.css`, `panel.js`

The conversation, in the activity island's identity: Luma's tokens, the
`--surface-pop` sheet with a hairline rim and ember underglow, the island's rim
comet while a reply is on the way, its speaking bars beside the status line.

- Header: the Luma mark, "Lumabyte", the window it is attached to (the title,
  prefixed with the app name when the title does not already say it), and the
  tools: New chat (a labelled button, hidden while the thread is empty),
  continue in LumaBrowser, detach, hide.
- The thread renders with the chat's `MarkdownRenderer` (streaming mode while a
  reply arrives); each reply notes what it looked at. A new thread shows three
  starters ("What am I looking at?", ...) and, when there is one, "Continue the
  last conversation" with its message count and age (`panel.resume`).
- Actions Lumabyte takes show as step lines above its answer (a dot that
  settles to done, or the failure in amber).
- Composer: Enter sends, Shift+Enter is a new line; the send button turns into
  Stop while busy. The line under it says what each message will carry and what
  Lumabyte can do (act, read files), or why it cannot (no model, a model that
  cannot see images); its tooltip adds details.
- Esc hides the panel. Talks only through `window.lumabyte`.
