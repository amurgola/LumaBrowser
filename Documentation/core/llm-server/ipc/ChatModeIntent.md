# ChatModeIntent

`core/llm-server/ipc/ChatModeIntent.js`

Cross-view launcher: another surface asks the chat to open in a mode with preset setup data.

## Methods

- `new ChatModeIntent(llmServerService)`.
- `start({ mode, data })` stashes `{ mode: String(mode), data: data || {} }` and opens
  the chat: `{ success: true, opened: true }`. Without a mode, `mode is required`;
  when the tab cannot open, the intent is taken back and the reply is
  `The AI chat tab is not available. Enable the LLM feature first.`.
- `take()` the pending intent (one-shot), null when none or on failure.
