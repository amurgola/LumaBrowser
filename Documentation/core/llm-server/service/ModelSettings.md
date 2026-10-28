# ModelSettings

`core/llm-server/service/ModelSettings.js`

The three setting layers a chat model call sees: the global defaults, the model's own overrides and, when a profile was picked, the profile's. Resolves any model ref (profile refs included) to the base ref to route on plus the merged overrides, and backs the Tune panel's read and save calls. Built by [LLMServerService](../LLMServerService.md) as `modelSettings`.

## Methods

- `new ModelSettings({ overrides, profiles, launchFlags, getDefaults, lastModelRef })`: a [ModelOverrideStore](ModelOverrideStore.md), a [ModelProfileStore](ModelProfileStore.md), the [ModelLaunchFlags](ModelLaunchFlags.md) store (keyed by stem), the launch defaults getter and `{ get(), set(ref) }` for the remembered model pick.
- `resolve(ref)`: `{ ref, selectedRef, profile, settings }`. A plain ref routes on itself with its own request overrides. A `profile::<id>` routes on the profile's `baseRef` with `ModelOverrides.merge(model request overrides, profile overrides)` and `profile: { id, name }`. A deleted profile throws `The model profile this chat uses was deleted. Pick another model.`
- `baseRef(ref)`: the base of a profile ref, null for a deleted one, the ref itself otherwise (null for a missing ref). Never throws.
- `listProfiles()`: every profile record.
- `view(ref)`: what the Tune panel shows, or null for a deleted profile: `{ selectedRef, baseRef, isLocal, defaults, model: { overrides, launchFlags }, profile: { id, name, overrides } | null, profiles: [{ id, name, ref }] }`. `defaults` is the global layer: `reasoningEffort` (`'off'` when the legacy noThink flag is set, else the stored effort or `'default'`), `temperature: null`, `maxReplyTokens: null` and `maxParallelToolCalls: null` (no global setting; the chat mode decides, and the pool defaults to one call at a time), `agentTimeoutMinutes` and `agentMaxIterations` ([AgentBudget](../chat/bridge/AgentBudget.md)`.DEFAULT`, 8 and 24, what a blank Run timeout or Run steps resolves to), and for a local model `kvCacheType`. `launchFlags` is `''` for a remote model.
- `setModel(ref, { overrides, launchFlags? })`: saves the model's overrides and, for a local ref when given, its launch flags under the ref's stem; returns `view(ref)`. Throws `Pick a model, not a profile` for a profile or missing ref.
- `saveProfile({ id?, name, baseRef, overrides })`: updates (with an id) or creates a profile; returns the record plus its `ref`.
- `deleteProfile(id)`: true when removed. When the remembered pick was that profile it is cleared, so new chats do not open on a dead ref.
- `launchDefaults(defaults)`: the defaults with the loaded model's (`defaults.modelPath`'s stem) launch overrides on top; the same object when there are none.

## Why

Every caller that sees a model ref (the turn, the dispatcher, the context window, capabilities, the picker list) needs the same answer for a profile, so the resolution lives once. The Chat defaults card keeps reading the plain defaults, so one model's KV choice is never shown or saved back as the global one; only a launch reads `launchDefaults` (through `LLMServerService.getLaunchDefaults`).
