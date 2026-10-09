# TurnActions

`core/llm-server/ui/js/chat/turns/TurnActions.js`

A settled reply's action row (Copy, Regenerate, Read aloud, Edit on the newest
reply only, the tok/s pill, the "‹ n/m ›" variant pager) and token strip (the
turn's totals, plus the context fill on the last answer), and the one delegated
click handler that resolves each button's message by its turn's `data-msg-id`.
A prompt gets its own row: the branch pager (when the prompt was edited), Copy
(the typed text only, not spliced attachment bodies) and Edit and resend
([UserTurnEditor](UserTurnEditor.md); needs the persisted id). The pager's
label says what it switches ("Version 2 of 3 of this prompt. Each version keeps
its own replies." or "Answer 2 of 3"), and hovering an arrow previews the
version it leads to in its tooltip (one `conv.variants` fetch per button, the
typed text only for a prompt, one line of at most 90 characters).

## Methods

- `actionRowHtml(message)`, `metaRowHtml(message)`, `userActionRowHtml(message)`.
- `onClick(event)`: Copy shows a cross (and says so) when the clipboard write
  failed.
- `navVariant(message, delta)`: `conv.variants`, `conv.setVariant`, reload.
- `onHover(event)`: the thread's delegated mouseover (the arrow preview).
- `TurnActions.snippet(text)`.
