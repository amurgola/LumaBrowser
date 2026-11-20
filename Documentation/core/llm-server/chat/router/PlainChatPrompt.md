# PlainChatPrompt

`core/llm-server/chat/router/PlainChatPrompt.js`

The system prompt of a Tools-off chat turn outside any chat mode. [ChatTurn](ChatTurn.md) leads the thread with it
before the style documents ([ChatStyleDocs](ChatStyleDocs.md): widgets, suggested replies, voice) are appended.

## Methods

- `new PlainChatPrompt({ db, now? })`. `db` is the settings database; `now` is the clock (a test seam).
- `build()` returns the prompt: `<role>`, `<current_date>`, `<answering>`, `<tools>` (the note that Tools are off)
  and, when the user has a custom prompt (`aiChat.systemPrompt`, the setting the Tools-on prompt reads through
  [AgentSystemPromptBuilder](../../agent/AgentSystemPromptBuilder.md)), `<user_instructions>` last. Wording from
  [ChatAssistantText](../ChatAssistantText.md). About 320 tokens on Qwen3.8. A missing or throwing database means no custom
  block.
- `applyTo(messages)` returns the thread with the prompt as its first message. A thread that already opens with a
  system message is returned unchanged: its sender wrote the whole prompt it wants.

## Why

Until 2026-11-18 a plain turn's only system text was the widget document. On the prompt bench
(`npm run bench:prompt`, Qwen3.8-27B) the model, asked for today's date, answered with a date from its training
year, and it never saw the user's custom prompt, which only Tools-on turns carried.

The prompt holds nothing that changes within a day, so every turn of a conversation sends the same head and a local
server keeps its cached prefix. The time of day is not given on this path.
