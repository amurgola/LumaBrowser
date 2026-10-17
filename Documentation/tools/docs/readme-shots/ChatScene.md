# ChatScene

`tools/docs/readme-shots/ChatScene.js`

The README hero: one agent turn on the local model with web search on, then the conversation open in the UI with the
"Ran N steps" card leading and the composer waiting for a reply.

Framing: when the thread overflows by more than the question above the run card, scroll so the run card leads and
the question is fully out of view; otherwise start at the top and let the trailing usage line be what gets cut. A
sliced question bubble looked broken. Open popovers are hidden and focus dropped so no caret or ring shows.

Returns `{ conversationId, steps, chars }` (`steps` is the run card label, `chars` the reply length) for the log.

## Methods

- `static prepare(page, args)`: runs the turn and frames the view.
- `static showChat(page)`: the Chat toggle.
- `_frame(page)`: the scroll and focus rules above.
