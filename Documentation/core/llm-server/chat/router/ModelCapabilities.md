# ModelCapabilities

`core/llm-server/chat/router/ModelCapabilities.js`

What the model behind a chat model ref can do this turn, read from the LIVE launch plan.

## Methods

- `new ModelCapabilities({ llmServerService, db })`.
- Every method first maps a `profile::` ref to its base model through `llmServerService.modelSettings.baseRef` when the service has one.
- `visionActive(ref)`: remote true; local only when the running plan has `mmprojPath`; false for non-strings or a failing status.
- `nativeToolsActive(ref)`: false for non-strings; true for harmony refs (`HarmonyModel.matches`) and remote refs; else the tri-state `NATIVE_TOOLS_SETTING` (`core.llmServer.chat.nativeToolCalls`): false -> off, true -> `ModelFamilies.nativeToolCallsCapable(family)`, unset -> `ModelFamilies.nativeToolCalls(family)`. The family is the live plan's `modelFamily` when that plan's `modelName` is the model asked for (the ref's stem, or the default model's file name for a bare `local::`, which starts with it); otherwise (no server up on a cold start, or a server still holding the previous model while this turn switches) it is what `ModelFamilies.detect` reads from that name.
- `nativeToolExclude(ref)`: `ModelFamilies.nativeToolExclude(family)` for a local ref on the native route, else `[]`.

## Why

A family only claims native tool calls beside the `--jinja` its launch adds, so the claim comes from the plan the server was started with whenever there is one; reading the model name while a server runs would let them drift and every call would come back as raw text. Before the first launch there is no plan, and the name goes through the same detector the planner will use, so the launch that follows carries the flags the claim assumed. Without that fallback a conversation's first turn ran on the fence with one system prompt and its second turn natively with another (DeepSeek-V4.1-Flash, 2026-11-04), which re-read the whole conversation. Harmony drops calls unless tools are registered, so it is native regardless of the setting. A remote ref is native because [RemoteStream](RemoteStream.md) sends the schemas and returns the calls; a provider that could not would leave the model with neither the array nor the fence guidance.

With no plan for the model (a cold start, or the server still holding another
model) the family is the one a plan last gave that model, remembered by
lower-cased stem in `FAMILY_SETTING` (`core.llmServer.chat.plannedFamilies`);
only a model never launched falls back to its name. The name is not the
planner's answer: the planner reads the file's header first, so a renamed or
repacked model got one family, and with it one tool-call protocol, from its
name on the turn that started the server and another from its plan on every
turn after, and flipped back whenever the server was stopped.

## Changes (2026-11-14, a paired host takes the text fence)

`nativeToolsActive` is false for a paired LumaBrowser host's model ([PeerModelRef](PeerModelRef.md)); every other remote endpoint stays native. The host's sharing endpoint streams the model's text and takes no tool schemas: a client's `tools` array reached the host's handler and was handed to nobody, so on the native route the model was shown no tools at all while this side's prompt, built for the native route, carried no fence guidance either. Tools from a client chat on a host model could not be called. The text fence crosses a plain stream and is what the host itself uses for most local families. Not covered: a Harmony (gpt-oss) model on a paired host still reads as native here, since that family's calls only work with registered tools; it needs the host to pass schemas through. Measured with `tmp/rpdiag/tools-probe.js` (one schema on the wire, none given to the host's model); the agent turn itself was not run end to end through a host.
