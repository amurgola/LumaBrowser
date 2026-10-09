# TriggerRunConfig

`core/llm-server/chat/trigger-runner/TriggerRunConfig.js`

A trigger run's model and tool allow-list.

## Methods

- `new TriggerRunConfig({ toolPolicy, getAgentManager? })`; `toolPolicy` is a
  [SetupChatToolPolicy](../schedulers/SetupChatToolPolicy.md).
- `resolve(trigger, deps)` returns `{ modelRef, allowedTools, persona?,
  kbScope?, agentId? }`:
  - `prompt` mode: the setup chat's model and no catalog tools.
  - a configured agent (`action.agentId`, agent mode): the agent's tool list,
    persona (`systemPrompt`), `kbScope` and pinned model (else the setup
    chat's). Throws `the configured agent "<id>" no longer exists` or `... is
    unavailable (Agent Manager is off); pick another agent in the setup chat`.
  - otherwise the setup chat's live model and tools.
  - An artifact target (`action.artifactRootId`) always adds
    `ARTIFACT_TOOLS` (`get_artifact_data`, `update_artifact_data`).

Run-scoped tools are added later by [TriggerRunTools](TriggerRunTools.md)`.allowList`.
