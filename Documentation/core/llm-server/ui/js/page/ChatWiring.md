# ChatWiring

`core/llm-server/ui/js/page/ChatWiring.js`

Builds the LLM tab's chat side for [LlmTabPage](LlmTabPage.md): the
`window.LumaChatExt` contract with the two core chat modes registered on it,
the chat surface and the Code editor, each wired to the others.

## Methods

- `new ChatWiring({ win? })`.
- `build()` returns this:
  1. `chatExt = LumaChatExt.install(win)` (sets `window.LumaChatExt` once).
  2. `new ScheduledTaskMode(chatExt).register()` and
     `new TriggerMode(chatExt, { card: triggerCard }).register()`, before the
     chat loads extension modes (legacy loaded their scripts in between).
  3. `codeEditor = new CodeEditor()`, `chatMode = new ChatMode({ chatExt,
     voiceFactory: VoiceController, codeEditor })`.
  4. `codeEditor.setChatMode(chatMode)`, `triggerCard.setChatMode(chatMode)`.
- `setSetupNav(navigator)`: `chatMode.setCollaborators({ setupNav })`.
- Fields: `chatExt`, `triggerCard`, `chatMode`, `codeEditor`.
