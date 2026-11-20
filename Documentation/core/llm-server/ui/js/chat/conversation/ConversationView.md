# ConversationView

`core/llm-server/ui/js/chat/conversation/ConversationView.js`

Opens and renders a conversation: leaves the current one (mode hook, popovers,
reading, panel, live modules, parked tab), loads its messages (session timings
and tab frames re-attached), restores its model, mode, tools, choices,
thinking position, documentation source pill
([DocsSourceContext](../composer/DocsSourceContext.md), from the conversation
meta) and its own image, edit and video model
([MediaModelChoice](../composer/MediaModelChoice.md), also from the meta),
re-attaches a turn that is still streaming, paints the thread
with the reply composer in the bottom bar, and re-applies the mode's theme and
hooks. Also New chat.

## Methods

- `open(id)`, `render(title)`. `open` also records the conversation among the
  search palette's recent places (`api.palette.record`, best effort; hidden
  sub-conversations are skipped).
- `newChat()`: ignored while streaming; tells the outgoing mode it is left,
  resets to a plain agentic chat, unfolds the New-chat mode tray, shows the landing.

## Background jobs

- `render` re-attaches the [ConversationJobsStrip](../jobs/ConversationJobsStrip.md) to the
  rebuilt composer bar; `open` resets it on leaving and refreshes it for the new conversation.
- `showPosted()` adds messages the host wrote into the open conversation outside any turn
  (a background job's outcome) to the thread on screen. It does nothing while a reply is
  streaming there, and re-opens the conversation when the thread holds a message without
  an id, since that one cannot be matched against the stored rows.
- The state messages built from the stored rows carry `provider` (null when unset), so a
  row the app wrote in the user's place (provider `background-task`, a background task's
  results) is drawn by [TaskNoticeView](../turns/TaskNoticeView.md) and not as a user turn.

## Plan and queued messages

- `render` also re-attaches the [PlanPanel](../plan/PlanPanel.md) and the
  [PendingMessages](../pending/PendingMessages.md) strip; `open` resets the plan panel
  on leaving and reads the new conversation's plan from its meta.
- `open` ends with `pending.sendNext()`: a message queued here may have been waiting
  for a reply that finished while the user was in another conversation.
