# ConversationMenu

`core/llm-server/ui/js/chat/conversation/ConversationMenu.js`

A conversation's menu: Rename (themed prompt), Pin/Unpin, Share (a flyout that
opens on hover or click: Copy as Markdown, a public Link while the web backend
runs, Download as PDF or PNG through `api.conv.export`), Copy Logs in dev
builds, Restart and Delete. Feedback items keep the menu open briefly.

## Methods

- `open(event, conversation)`.
- `restart(conversation)`: confirms, opens it, runs the mode's `onRestart`, clears
  the messages, reloads, then the mode's `startConversation`.
