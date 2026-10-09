# AiChatMarkup

`extensions/ai-chat/ui/AiChatMarkup.js`

Static markup of the AI Chat extension.

## Fields

- `SETTINGS_HTML`: system prompt (`#ext-ac-systemPrompt`), navigator model
  (`#ext-ac-modelSelect`), Export All (`#ext-ac-exportBtn`).
- `CHAT_PANEL_HTML`: `#aiChatPanel` with the `data-resize="ai-chat"` handle,
  header (`#aiChatModel`, `#aiChatTools`/`#aiChatToolsPop`, `#aiChatContext`,
  `#aiChatStatus`, `#aiChatNewConversation`, `#aiChatClear`, `#aiChatClose`),
  history (`#aiChatHistoryList`), thread (`#aiChatMessages`) and composer
  (`#aiChatInput`, `#aiChatSend`, `#aiChatStop`).
- `CHAT_MODALS_HTML`: the delete confirmation `#aiChatConfirmModal`.

The ids are a contract with the shell (overlay selectors, the resize registry,
the toolbar `#aiChatToggle`/`#aiChatStateDot` it owns) and the panel CSS.
