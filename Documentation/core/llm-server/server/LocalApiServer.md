# LocalApiServer

`core/llm-server/server/LocalApiServer.js`

The plain localhost OpenAI- (chat completions and Responses) and
Anthropic-compatible endpoint over the running chat model. Off by default; when on it binds 127.0.0.1 only with no auth (the
loopback interface is the trust boundary, as with LM Studio and Ollama) and never
starts a model. Independent of Network Sharing, the LAN surface behind a PIN.

## Methods

- `new LocalApiServer({ db, llmServerService })`; throws
  `LocalApiServer: db is required`. `llmServerService` is read through
  [LocalApiUpstream](LocalApiUpstream.md).
- `isEnabled()` (`localApi.enabled`), `isRunning()`, `address()` (`{ address, port }` or null).
- `getPort()` the stored `localApi.port` when it is an integer 1-65535, else
  `DEFAULT_PORT` (8317).
- `getBaseUrl()` `http://127.0.0.1:<port>/v1`; `getAnthropicBaseUrl()` the
  origin Claude Code wants as `ANTHROPIC_BASE_URL`. Both use the bound port when running.
- `getConfig()` `{ enabled, port, running, baseUrl, anthropicBaseUrl, modelLoaded, model, error }`.
- `setEnabled(enabled)` persists and applies; a bind failure reverts the setting
  and returns `{ success: false, error }`; off stops and clears the error.
- `setPort(port)` validates (`Port must be a number from 1 to 65535.`), persists
  and rebinds live when enabled.
- `resume()` app boot: starts when enabled, else `{ success: true, skipped: true }`.
- `start(port)` binds or rebinds via [LocalApiListener](LocalApiListener.md);
  resolves `{ success, port }` or `{ success: false, error }`, never rejects.
- `stop()` resolves `{ success: true }`.
- `getApp()` the Express app (built once): [OpenAiLocalRouter](OpenAiLocalRouter.md),
  [OpenAiResponsesRouter](OpenAiResponsesRouter.md) and
  [AnthropicMessagesRouter](AnthropicMessagesRouter.md) on the same origin (the two
  translating routers share one deps set: `getUpstream`, `hostDial`, `warn`),
  then a 404 `{ error: { message: 'Unknown route <METHOD> <path>', type: 'invalid_request_error' } }`.
- Statics `ENABLED_KEY`, `PORT_KEY`, `DEFAULT_PORT`, `BIND_HOST`.

## Why

8317 keeps out of the way of LM Studio (1234), Ollama (11434) and llama-server
(8080) on a machine that also runs them. Mounting every router on one origin
means `ANTHROPIC_BASE_URL=<origin>` is all Claude Code needs and the `/v1` base
URL is all Codex needs (it only speaks the Responses API).
