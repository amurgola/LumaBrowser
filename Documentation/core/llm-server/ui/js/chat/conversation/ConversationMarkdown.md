# ConversationMarkdown

`core/llm-server/ui/js/chat/conversation/ConversationMarkdown.js`

The full-fidelity Markdown dump behind Copy as Markdown: header facts, then per
message its role and model, reasoning in a `<details>`, tool calls with params,
status and errors, artifacts, content and error.

## Methods

- `ConversationMarkdown.build(conversation, messages)`.
