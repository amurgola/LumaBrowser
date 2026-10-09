# AiChatSettingsTab

`extensions/ai-chat/ui/AiChatSettingsTab.js`

The AI Chat settings tab controller.

## Methods

- `new AiChatSettingsTab({ container, ipc, getChatApi })`: finds the three
  controls in the registered container. `getChatApi()` returns the side
  panel's chat api or null.
- `bind()`: model select -> `saveModelSlot`; system prompt ->
  `savePreferences`; Export All -> `exportAll`.
- `load()`: `ext.ai-chat.getPreferences` fills the prompt, then fills the
  model select from
  `llmSlotAPI.getAllAvailableModels()` with `getSlotConfig('ai-chat.navigator')`
  selected (value `providerId::modelId`).
- `savePreferences()`: `ext.ai-chat.savePreferences({ systemPrompt })`.
- `saveModelSlot()`: `setSlotConfig(SLOT_ID, provider, model)`, or
  `clearSlotConfig(SLOT_ID)` for the default option.
- `exportAll()`: [ConversationExport](ConversationExport.md)`.download(api)`;
  logs "chat panel is not loaded" when there is no panel.

Every failure is logged (`ai-chat: ...`), never thrown. There is no "Clear
All": the store is shared with the LLM tab.

## Globals

Reads `window.llmSlotAPI` (preload). IPC: `ext.ai-chat.getPreferences`,
`ext.ai-chat.savePreferences`.
