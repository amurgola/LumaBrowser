# AppLinksApi

`core/llm-server/preload/AppLinksApi.js`

llmDiagAPI section: what the tab reads from the rest of the app: the settings modal, the read-only API security status, the first-run persona, the dev log tail for "Copy Logs", and the Roleplay Lab (dev) pipeline driver.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `openAppSettings(tab)` | invoke `core.shell.openSettings` |
| `apiSecurity.get()` | invoke `core.settings.apiSecurity.get` |
| `getPersona()` | invoke `core.settings.getPersona` |
| `debug.getLogs()` | invoke `core.debug.getLogs` |
| `rpLab.getScenario()` | invoke `core.rpLab.getScenario` |
| `rpLab.run(args)` | invoke `core.rpLab.run` |
| `rpLab.regenerateFrom(args)` | invoke `core.rpLab.regenerateFrom` |
| `rpLab.regenerateStep(args)` | invoke `core.rpLab.regenerateStep` |
| `rpLab.onEvent(cb)` | subscribe `core.rpLab.event` |
