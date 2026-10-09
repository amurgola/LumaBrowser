# ConversationView

`core/llm-server/ui/js/chat/conversation/ConversationView.js`

Opens and renders a conversation: leaves the current one (mode hook, popovers,
reading, panel, live modules, parked tab), loads its messages (session timings
and tab frames re-attached), restores its model, mode, tools, choices,
thinking position and documentation source pill
([DocsSourceContext](../composer/DocsSourceContext.md), from the conversation
meta), re-attaches a turn that is still streaming, paints the thread
with the reply composer in the bottom bar, and re-applies the mode's theme and
hooks. Also New chat.

## Methods

- `open(id)`, `render(title)`.
- `newChat()`: ignored while streaming; tells the outgoing mode it is left,
  resets to a plain agentic chat, unfolds the New-chat mode tray, shows the landing.
