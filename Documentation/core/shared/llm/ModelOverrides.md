# ModelOverrides

`core/shared/llm/ModelOverrides.js`

The settings a single model or a model profile may override, and how sparse override layers are cleaned and stacked. A field that is absent inherits from the layer below (profile, then model, then the global defaults).

## Methods

All static.

- `REQUEST_FIELDS`: `reasoningEffort`, `temperature`, `maxReplyTokens`, `maxParallelToolCalls`, `agentTimeoutMinutes`, `agentMaxIterations`. Sent with every request (the last three shape the agent run: its tool-call pool, wall clock and step ceiling), so a profile may set them.
- `LAUNCH_FIELDS`: `kvCacheType`. Applied when the local server loads the model, so only a local model (never a profile) carries them.
- `clean(raw, { launch = false })`: a new object with only the valid values of the allowed fields (request fields, plus launch fields when `launch`). `reasoningEffort` is any `ReasoningEffort.DIAL_IDS` position, trimmed and lowercased (`'default'`, Auto, is kept: it overrides a global Off). `temperature` is a non-negative number clamped to `MAX_TEMPERATURE` (2) and rounded to two places. `maxReplyTokens` is floored, at least 1, capped at `MAX_REPLY_TOKENS` (1,000,000). `maxParallelToolCalls` is floored, at least 1, capped at `MAX_PARALLEL_TOOL_CALLS` (8, the agent loop's pool ceiling). `agentTimeoutMinutes` is floored, at least 0 (0 is a real choice: no wall clock), capped at `MAX_AGENT_TIMEOUT_MINUTES` (240). `agentMaxIterations` is floored, at least 1, capped at `MAX_AGENT_ITERATIONS` (400). Both caps sit above [AgentBudget](../../llm-server/chat/bridge/AgentBudget.md)'s mode ceilings on purpose: they are the user's own floor. `kvCacheType` must be one of `KvCacheModes.MODE_IDS`. Blank, null, unknown and invalid values are dropped; a non-object is `{}`.
- `merge(...layers)`: later layers win field by field; null layers are skipped.
- `isEmpty(overrides)`: true for null or `{}`.

## Why

The override stores, the profile store and the resolver all need the same field list and the same notion of "unset", and a value the user cleared must disappear rather than be stored as an empty override that hides the layer below. Keeping launch fields off profiles means switching between profiles never reloads the model.
