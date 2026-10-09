# AiChatPreferences

`extensions/ai-chat/AiChatPreferences.js`

The AI Chat preference something still reads (the custom system prompt),
stored under its legacy un-namespaced settings key.

## Methods

- `new AiChatPreferences(rawDb)` (`context.db.getRawDb()`: `get(key, fallback)`, `set(key, value)`).
- `get()` -> `{ systemPrompt (default '') }`.
- `save(preferences)` writes `systemPrompt` only when a string; resolves
  `{ success: true }`, or `{ success: false, error }` when storage throws.
- `AiChatPreferences.SYSTEM_PROMPT_KEY` `'aiChat.systemPrompt'`.

## Why a raw key

AgentRunner and the chat bridge read this exact key from the settings store,
so it stays outside the extension's `ext.ai-chat.` namespace.
