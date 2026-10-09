# CodeModeExtension

`extensions/code-mode/CodeModeExtension.js`

Activation of the Code extension: registers the `code` chat mode
([CodeModeDescriptor](CodeModeDescriptor.md)) over a per-run session map and
returns the terminal bridge as the extension API.

## Methods (static)

- `activate(context)` registers the descriptor with `context.chat.registerMode`
  and resolves `{ terminalBridge }` (a [TerminalBridge](terminal/TerminalBridge.md)).
  Sessions (`conversationId -> session record`) live in memory: a build is one
  sitting; the staging dir survives on disk.
- `terminalBridge()` builds the bridge over lazy getters:
  `ExtensionGlobals.chatRouter()`, `global.__lumaAgentManager`,
  `global.__lumaCliHandshake`, `ExtensionGlobals.llmServerService()`.

## Entry files

- `manifest.js`: same id, fields, `extensionsActions` (Vibe, Code a project) and
  text as legacy; comments lost their em-dashes. `private: true`,
  `distributable: false`.
- `main.js`: `{ _buildStateFor(sessions, conversationId), activate, deactivate }`.
  `_buildStateFor` is the legacy test seam, now
  [SessionSnapshot](SessionSnapshot.md)`.forConversation`.
- `routes.js` (controller, `/api/ext/code-mode`): `GET /terminal/info` ->
  `{ success, available, sessions }`; registers the `WS /terminal` upgrade via
  `context.gateway.registerUpgrade` when the bridge is available.
- `chat-ui.js` (module entry, injected from `/llm-ui/ext/code-mode/chat-ui.js`):
  registers [CodeChatMode](ui/CodeChatMode.md) with `window.LumaChatExt`;
  `code.css` is the legacy stylesheet. `chatUi.assets` lists `code.css` and
  every `ui/*.js` module (the gateway serves only declared files). The panel reads the
  `build:state`, `project:state`, `batch:state`, `command:output` and
  `command:detached` events listed in the tool docs.

## Core access

The extension keeps legacy's [CoreRequire](CoreRequire.md) mechanism for every
core class (the area notes treat code-mode as distributable). Core reached:
ExtensionGlobals, ContainerFs, ContainerPath, FileObservation, ContextBudget,
ToolOutputTruncator, CommandCallAssessor, ApprovalGate, DetachedProcesses,
AgentNotices, BatchScheduler, ProjectContextFiles, IpClass, IdeContextFormatter,
AgentChatBridge.
