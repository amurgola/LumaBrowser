# renderer.js (ai-chat entry)

`extensions/ai-chat/renderer.js`

The AI Chat renderer entry the shell loads as a module (bundled, not
`distributable`). It builds one [AiChatRenderer](ui/AiChatRenderer.md) and
publishes `window.__ext_ai_chat = { activate(context) }`. There is no
`deactivate`: the shell marks the module stale on disable and loads it fresh,
as in legacy.

## Globals

Writes `window.__ext_ai_chat` (the shell's extension renderer contract).
