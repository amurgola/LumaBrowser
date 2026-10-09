# AiChatRenderer

`extensions/ai-chat/ui/AiChatRenderer.js`

The AI Chat main-window renderer: registers the settings tab, injects the side
panel and its confirmation modal, and publishes the panel controller.

## Methods

- `activate(context)` (`context.ipcBridge`, `context.slotManager`):
  1. registers the `settings-tab` slot `ai-chat` with
     [AiChatMarkup](AiChatMarkup.md)`.SETTINGS_HTML` (`onActivate` reloads the
     settings) and binds an [AiChatSettingsTab](AiChatSettingsTab.md) when a
     container comes back;
  2. inserts `CHAT_PANEL_HTML` just before `.settings-modal` unless
     `#aiChatPanel` exists;
  3. appends `CHAT_MODALS_HTML` to the body unless `#aiChatConfirmModal` exists;
  4. sets `window.lumaAiChatPanel = new LitePanel()` unless already set, and
     calls its `checkLlmAvailability()` after `FIRST_CHECK_DELAY_MS` (500 ms);
  5. loads the settings.

## Why lumaAiChatPanel

`id="aiChatPanel"` already puts the element on `window.aiChatPanel` (named
element access). Publishing the controller under that name once made the
"already published" guard see the div and skip construction. The test pins
that the global is the controller.

## Globals

Writes `window.lumaAiChatPanel` (the shell calls `checkLlmAvailability()` on
it from its LLM-config change sites). Reads `document`.
