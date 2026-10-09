# LlmTabPreloadApi

`core/llm-server/preload/LlmTabPreloadApi.js` (entry: [llm-tab-preload.js](../llm-tab-preload.md))

The pinned LLM tab's renderer surface, `window.llmDiagAPI`, merged from its
sections. The global name and every member are a contract (the chat, Setup,
voice, code editor, extension chat and Setup bundles, and e2e helpers read it).

## Methods

- `LlmTabPreloadApi.expose(contextBridge, ipcRenderer, webUtils)` exposes the
  surface. A contextBridge throw (contextIsolation off) is logged as
  `[llm-tab-preload] failed to expose llmDiagAPI`, never propagated.
- `LlmTabPreloadApi.build(ipcRenderer, webUtils)` returns the merged object.
  Page tests build the real surface over a fake `ipcRenderer`.
- `LlmTabPreloadApi.SECTIONS`: the section classes, in legacy order.

## Sections

| Section | Members |
|---|---|
| [LlmHostApi](LlmHostApi.md) | diagnostics and host fixes, models directory, libraries, display names, preflight, VRAM pressure, system libraries |
| [LlmRuntimeApi](LlmRuntimeApi.md) | LLM runtimes, `onRuntimeEvent`, `openExternal` |
| [LlmServerApi](LlmServerApi.md) | defaults, server lifecycle, approvals, UI state, host pushes |
| [TabPreviewApi](TabPreviewApi.md) | `tabPreview` |
| [ChatTurnApi](ChatTurnApi.md) | `listModels`, `chat2`, attachments, `onChatEvent` |
| [ConversationApi](ConversationApi.md) | `conv` |
| [ChatTasksApi](ChatTasksApi.md) | `schedTasks`, `triggers` and their events |
| [ChatModesApi](ChatModesApi.md) | `chat`, `setup` |
| [ArtifactApi](ArtifactApi.md) | `share`, `artifact`, `openDashboard`, `pinToDashboard`, `artifactData`, `liveApi` |
| [VoiceApi](VoiceApi.md) | `voice` |
| [GroundingApi](GroundingApi.md) | `grounding` |
| [ModelSetupApi](ModelSetupApi.md) | catalog, search, recommendation, downloads, add-on models |
| [ModelTestApi](ModelTestApi.md) | fit test, gambit |
| [ImageApi](ImageApi.md) | `image` (with `image.video`) |
| [MusicApi](MusicApi.md) | `music` (with `music.gen`) |
| [PlacementApi](PlacementApi.md) | `placement` |
| [AppLinksApi](AppLinksApi.md) | `openAppSettings`, `apiSecurity`, `getPersona`, `debug`, `rpLab` |
