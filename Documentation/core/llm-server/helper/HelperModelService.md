# HelperModelService

`core/llm-server/helper/HelperModelService.js`

The opt-in helper model: a second, smaller chat model kept resident in its
own llama-server on its own card, for a mode's bookkeeping calls (the roleplay
stage manager, casting, summaries, pressure). It is a real model ref
(`helper::<stem>`) the chat router routes ([HelperStream](../chat/router/HelperStream.md))
and lists ([ChatModelList](../chat/router/ChatModelList.md)), so a mode asks
for it by ref and Network Sharing can expose it like any listed model. Nothing
is ever unloaded or swapped to serve it: when it is off or not ready the ref is
absent and callers fall back to the main model.

## Methods

- `new HelperModelService({ settingsDb, llmServerService, runtimeServer })`;
  `runtimeServer` is a test seam (default: a resident
  [HelperRuntimeServer](HelperRuntimeServer.md), never idle-unloaded).
- `settings` the [HelperModelSettings](HelperModelSettings.md); `isEnabled()`,
  `isReady()` (on and the server is `ready`), `contextSize()`.
- `ref()` the `helper::<stem>` ref while on (a missing file still names it,
  so the Setup card can show what it would be), else null; `readyRef()` the
  ref only while ready: the one check a mode makes before preferring it.
- `getStatus()` `{ enabled, modelPath, modelInstalled, ref, contextSize,
  cudaDevice, device (the card it launched on), state, port, runtimeId, error }`.
- `apply()` reconciles the server with the settings, serialized and never
  rejecting: disabled stops it; a missing file stops it and reports (`Helper
  model not found at ...`, or `Pick a helper model file first.`); otherwise it
  starts through [HelperLaunchPlan](HelperLaunchPlan.md) (the fastest llama.cpp
  build, the pinned or freest card, the window), and a running server whose
  file, window or card changed is replaced while an unchanged one is left alone.
- `stop()` (quit), `releaseRuntime(runtimeId)` (stops it while it runs from
  the runtime whose folder is about to be replaced; `apply()` starts it again).
- `facade()` what the router's `LocalRequest` reads to talk to this server:
  a ready status at its port, the runtime id, two slots, the in-flight count.

## Why

A 27B narrator spends 7 to 9 s per turn on the stage call and, with one
server slot, loses its prompt cache to it, so every turn re-evaluates the whole
prompt. A 4B to 12B helper answers the same call in 3 to 5 s on the other
card and leaves the narrator's cache intact. It is opt-in because a box that
cannot hold two models must never start swapping them.
