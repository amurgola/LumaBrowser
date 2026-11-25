# ThreadSnapshots

`extensions/personal-hub/ui/widgets/ThreadSnapshots.js`

What the Hub read at an activity item's source, shown under the item when
the user asks for it: the conversation or the mail behind a notification,
read in the session it came from. Shared by the widgets that list items, so
`Read` on a row of the activity feed, `Context` on what a summary card says
is asked ([HubInboxWidget](HubInboxWidget.md)) and `Context` on an item of
the focus list ([HubFocusWidget](HubFocusWidget.md)) are one thing.

## Methods

- `new ThreadSnapshots({ host, repaint, alive? })`: `host` the widget's
  host, `repaint()` draws the widget again, `alive()` answers `false` once
  the widget is disposed (a reply that arrives after that is dropped).
- `has(threadId)`: whether something is showing for the item (the text, the
  note, or the wait).
- `toggle(threadId)`: reads the item when nothing is showing for it, else
  hides it.
- `async read(threadId)`: shows `Reading the conversation...`, calls
  `snapshotThread(threadId, {})`
  ([ConversationReader](../../snapshot/ConversationReader.md)) and shows
  the text. With no text it shows the Hub's reason (`There was nothing more
  to read.` when it gave none), and a failed call shows its message. An
  item hidden meanwhile stays hidden.
- `element(threadId)`: the block to draw under the item (`.hub-snapshot`,
  with `.is-note` for the wait and the reason), or `null`. The text sits
  under a line saying where it was read and when: `Read from the
  conversation`, `Read from the mail` (the mail was found in its mailbox
  and opened), or `Read from what its tab is showing`.

## Why

The summary says someone may be waiting; before putting it on the board or
answering, the user wants to see what was actually said. The Hub usually
has it already: a card that may need the user was written from the
conversation, and that read is kept until the item changes, so the text
appears at once. What is shown is kept only while the widget lives.
