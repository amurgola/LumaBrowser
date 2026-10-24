# ChatHandoff

`extensions/desktop-integration/shared/ChatHandoff.js`

Hands content to the chat for desktop features (`deps.handoff`): raises Luma,
opens the pinned chat tab on a new conversation with the prompt in the
composer and the attachments staged, and sends it when asked. It stashes a
`{ compose }` intent with `LLMServerService.setChatIntent` and opens the tab
with `openChat()`, the same one-shot pull path chat-mode launchers use, so a
tab that is still loading picks it up; the chat UI applies it through
[ComposeIntent](../../../core/llm-server/ui/js/chat/modes/ComposeIntent.md).
The full contract (attachment kinds, limits, results) is in the
[README](../README.md#chathandoff).

## Methods

- `new ChatHandoff({ getLlm, getChatStore, windows, reader?, tmpDir? })`: the
  getters are read per call (`ExtensionGlobals.llmServerService()` and the chat
  router's `chatStore`); `reader` defaults to the chat's
  [AttachmentReader](../../../core/llm-server/ipc/AttachmentReader.md).
- `open({ prompt, attachments, autoSend, source })` -> `{ success: true,
  conversationId, autoSent, attached, rejected }` or `{ success: false, error }`;
  never throws.
  - With `autoSend` (and a model picked before, `getLastModelRef()`), the
    conversation is created first with that model so its id can be returned.
  - When the tab cannot open, the intent is taken back so none is left stale.
  - Focus goes to the window that draws the chat tab
    (`tabViewManager.windowOfTab(pinnedTabId)`), else the main window; on
    Windows it is briefly made topmost.
- `readAttachments(list)` -> `{ files, rejected }`: `text` from `text` or base64
  `data`; `image` from base64 `data` (a `data:` prefix is stripped; 8 MB);
  `file` from a `path`, or from base64 `data` written to a temp file under
  `luma-chat-handoff` and read like a dropped file (then deleted). Names are
  reduced to a safe single file name. At most 10.

## Notes

- `path` attachments let a token holder read any local file the user can read
  into the chat; the token is a local secret, as the API key is.
