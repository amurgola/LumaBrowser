# ModelCapabilities

`core/llm-server/chat/router/ModelCapabilities.js`

What the model behind a chat model ref can do this turn, read from the LIVE launch plan.

## Methods

- `new ModelCapabilities({ llmServerService, db })`.
- `visionActive(ref)`: remote true; local only when the running plan has `mmprojPath`; false for non-strings or a failing status.
- `nativeToolsActive(ref)`: false for non-strings; true for harmony refs (`HarmonyModel.matches`) and remote refs; else the tri-state `NATIVE_TOOLS_SETTING` (`core.llmServer.chat.nativeToolCalls`): false -> off, true -> `ModelFamilies.nativeToolCallsCapable(family)`, unset -> `ModelFamilies.nativeToolCalls(family)` of the plan's `modelFamily`.
- `nativeToolExclude(ref)`: `ModelFamilies.nativeToolExclude(family)` for a local ref on the native route, else `[]`.

## Why

A family only claims native tool calls beside the `--jinja` its launch adds, so the claim must come from the plan the server was started with; reading the model name lets them drift and every call comes back as raw text. Harmony drops calls unless tools are registered, so it is native regardless of the setting.
