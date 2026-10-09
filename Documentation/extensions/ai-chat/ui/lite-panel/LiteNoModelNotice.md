# LiteNoModelNotice

`extensions/ai-chat/ui/lite-panel/LiteNoModelNotice.js`

With no model configured the composer must not look live.

## Methods

- `new LiteNoModelNotice({ messagesEl, inputEl, sendBtn, onOpenSetup })`.
- `render(configured, running)`: not configured: disables the input (saving
  its placeholder, then showing "Set up a model in the LLM tab to start
  chatting"), disables Send, and puts one `.ai-lite-notice` with an "Open LLM
  setup" button at the top of the thread. Configured: removes the notice,
  restores the placeholder, sets the input disabled only while running, and
  enables Send.
