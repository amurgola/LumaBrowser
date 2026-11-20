# PendingMessages

`core/llm-server/ui/js/chat/pending/PendingMessages.js`

Messages written while the model is busy (component `pending`, a
[ComposerStrip](../composer/ComposerStrip.md)). Enter in the reply box during a reply
queues the message for the open conversation instead of dropping it, the strip above
the composer lists what is waiting, and each message goes out as its own turn once the
reply before it has finished.

## Methods

- `add(text)`: called by [ComposerView](../composer/ComposerView.md) on Enter while a
  reply is being written. Takes what the composer holds
  ([TurnSender](../stream/TurnSender.md)`.takeStaged`: text, staged attachments, editor
  chips), queues it for `state.activeId` and empties the reply box. False with nothing
  to queue or no conversation yet.
- `onTurnEnd(conversationId, finished)`: called by
  [StreamFinisher](../stream/StreamFinisher.md) last of all. A reply that ran to its
  end releases that conversation's queue; one that was stopped or failed puts it on
  hold when messages are waiting. Then `sendNext()`.
- `sendNext()`: sends the open conversation's oldest queued message through
  `TurnSender.sendStaged` when nothing is being written, a model is picked and the
  queue is not on hold. Also called when a conversation opens.

## Rules

- One message per turn, in the order written. The model never sees a queued message
  before it is sent.
- The queue is per conversation and lives in the page for the session
  ([PendingQueue](PendingQueue.md)); it is not stored.
- A message queued in one conversation while another is replying goes out when that
  reply ends, since there is one stream at a time.
- A reply that finishes while the user is in another conversation leaves this
  conversation's queue waiting; it goes out when the conversation is opened again
  (a turn can only be started from the conversation on screen).
- Stop and errors hold the queue, so a wrong turn or a model that fails to load does
  not burn through it. "Send next" carries on, and so does the next reply that finishes.
- Edit takes a message back to the reply box, ahead of what is typed there, with its
  attachments and editor chips staged again. Remove drops it.
- Sending a queued message leaves the reply box alone: the user may be typing the next
  one.

Markup comes from [PendingMessagesHtml](PendingMessagesHtml.md); styles are the
`.cm-pending-*` rules in `chat.css`.

## Why queue instead of steering

Checked 2026-11-17: in the editors that have both, the queue is the part people rely
on and delivery in the middle of a run is where the bug reports are (a queued message
that interrupts after a tool call, or that the model acts on before it is sent). This
queue only ever sends at the end of a turn.
