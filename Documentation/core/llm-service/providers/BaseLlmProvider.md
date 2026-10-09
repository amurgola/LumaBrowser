# BaseLlmProvider

`core/llm-service/providers/BaseLlmProvider.js`

Base class (interface) for remote LLM providers: persisted config, the
capability contract, and shared protocol plumbing.

## Abstract methods (throw until a subclass implements them)

`_buildHeaders(extra)`, `testConnection()`, `fetchModels()`, `sendChatCompletion(messages, options)`, `createChatCompletionStreamSession(messages, options, handlers)`. The list is `BaseLlmProvider.ABSTRACT_METHODS`.

## Methods

- `new BaseLlmProvider(db, { keyPrefix, defaultEndpoint = '' })`; `keyPrefix`
  is required. Loads config immediately.
- Capability contract: `static get capabilities()` (override in subclasses)
  and the instance getter `capabilities`. `BaseLlmProvider.DEFAULT_CAPABILITIES`
  is the frozen least-capable default: `supportsTools`, `supportsCachePrefix`,
  `supportsReasoningStream` false, `defaultMaxTokens` null.
- Config: `loadConfig()`, `saveConfig()`, `getConfig()`, and
  `set/get` for `Endpoint`, `SelectedModel`, `ApiKey` (blank becomes null),
  `Models` (non-arrays become `[]`). Public fields `endpoint`, `selectedModel`,
  `models`, `apiKey`, `db`. Settings keys are `<keyPrefix>.<field>`.
- `withTemporaryConfig({ endpoint, apiKey }, fn)` borrows config for a probe.
- `BaseLlmProvider.apiErrorMessage(error, fallback)`.
- For subclasses: `_buildUrl(path)`, `_httpAgents()`, `_configError({ apiKey })`,
  `_getJson(path, { timeout, fallbackError })`,
  `_streamSession(runner, { onError, fallbackError })`, `_openAiResponse({...})`.

## Why

Capabilities: LLMService and UnifiedChatRouter ask the provider instead of
hard-coding special cases. `defaultMaxTokens` is the number a provider must
send when the caller gives none (bug H5: Anthropic requires it, and a silent
4096 capped every remote turn).

`withTemporaryConfig` (bug H15): "fetch models" against a candidate endpoint
must not rewrite stored settings, but `fetchModels()` itself saves on success.
So overrides are applied to the fields only, and afterwards every field is
restored and saved once, only if something wrote during the window. A failing
probe costs zero writes, a succeeding one exactly one corrective write. A blank
`apiKey` override means "use the configured key".

`setModels` exists so callers stop writing `<prefix>.models` straight to the
db, which left the in-memory list stale.

`_getJson` and `_streamSession` never throw: errors become `{ success: false,
error }`, and a stream's `done` resolves with `aborted: true` when we cancelled
it or axios reports `ERR_CANCELED`. The user-facing error is the API's own
message when it sent one, else the transport message, else the fallback.

`_httpAgents()` is overridden by OpenAICompatibleProvider, whose endpoints
include Network Sharing peers that need a pin-enforcing HTTPS agent.
