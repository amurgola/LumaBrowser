# ChatModelList

`core/llm-server/chat/router/ChatModelList.js`

The chat's model picker list (each model followed by its model profiles) and default selection.

## Methods

- `new ChatModelList({ llmServerService, db })`. The service may also offer `modelSettings` ([ModelSettings](../../service/ModelSettings.md)) and `resolveModelDisplayName(stem)`.
- `list()`: `{ models, defaultRef }`. The local rows when `computeLocalProviderEntry()` returns one: the configured model first (`ref`, `label` "Local, middle dot, name", `displayName`, `providerId: 'local'`, `providerType: 'openai'`, `isLocal`, `current: true`, `runtimeId`, `ready`, `serverState`), then every other installed model in the entry's `models` (`current: false`, `ready: false`, labelled by the entry's `luma_label` when it has one; picking one switches the server on its first turn); then each remote config with an endpoint and not `managedByCore`, one row per distinct model id (its `models`, else `selectedModel`). A remote row's label is "config name: model", where the model is its `luma_label` when the config carries one (a paired LumaBrowser sends its display labels; a leading "Local, middle dot" is dropped because the row already names the peer), else its id. Without that a peer's model read `Studio PC (shared): local::Qwen_Qwen3.6-35B-A3B-Q8_0`. The `ref` is always built from the id. The default is the last-used ref while it is listed and `canStand`, else the row the Settings "Default LLM" (`llm.provider`) points at (the local row for `core.llmServer.local`; for a provider type, its first config with an endpoint and `selectedModel`, at that model; for a stored config id such as a paired peer, its `selectedModel` or first model), else the first row.
- Profiles: each profile row follows its base model's row: the base row's fields plus `ref: 'profile::<id>'`, `label` "base label, middle dot, profile name", `isProfile: true`, `profileId`, `profileName`, `baseRef`. A profile of a local model the list does not know (the installed list not read yet) is appended at the end (label from `resolveModelDisplayName`, `current: false`, `ready: false`); a remote profile whose base model is no longer listed is left out. A remembered profile is the default while it is listed.
- `resolveRef(ref)`: the given ref, else `getLastModelRef()`, else the list default, else null.
- `ChatModelList.canStand(row)`: whether a row can be the selection shown before the user picks; false for a non-profile row with `current: false` (a local model other than the configured one).

## Why

The computed local entry is skipped so the local model is listed once. The local row is always first, so without the "Default LLM" fallback a user who set a remote provider (Ollama through OpenAI-Compatible, say) as the default still got the local model in the chat and in the page chat (Luma On Demand reads this default).

Picking a profile of another installed local model switches the server just as picking that model in the picker does, so it stays selectable (and choosable for an agent) even before the installed list is read.

## Changes (2026-11-09, helper model)

`_helperModels()` lists the resident helper right after the local row while `service.helperModel.readyRef()` answers: `{ ref: 'helper::<stem>', label: 'Helper · <stem>', providerId: 'helper', isHelper: true, role: 'helper', ready: true }`. Pickers keep `role: 'helper'` rows out of the chat choices; the sharing host can expose it like any listed model.

## Changes (2026-11-14, a peer's helper model)

A remote row whose model carries `luma_kind: 'helper'` (a paired host's helper model) gets `role: 'helper'`, the same mark as this machine's own helper row, so pickers keep it out of the chat choices.

## Changes (2026-11-18, every installed local model)

Every installed local model is listed, not only the configured one, and the rows carry `current`. A last-used local model that is not the configured one gives way to the configured model (`canStand`), so a change made in Setup is what the chat uses next; a profile of such a model still stands, as picking it is what loads its model.

## Changes (2026-11-14)

A paired host's rows carry `peer: true` (`_remoteRow`, from the config's `peerManaged`), so the chat page can tell a model that runs under the host's settings ([ThinkPill](../../ui/js/chat/composer/ThinkPill.md)).
