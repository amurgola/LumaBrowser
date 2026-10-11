# BackendContextProbe

`core/llm-server/chat/router/BackendContextProbe.js`

Queries an OpenAI-compatible provider for the selected model's actual allocated context. `detect(config, modelId, { signal, onStatus })` returns `{ tokens, source }` or null. Accepts an injectable Axios-compatible `request` for tests.

## Sources

- Ollama: exact model name/tag in [`GET /api/ps`](https://docs.ollama.com/api/ps), using `context_length`. An omitted tag can match `:latest`; namespaces and quantization tags are not discarded. If unloaded, verify `/api/version`, then send an empty `/api/generate` request and read `/api/ps` again. No prompt, context override, keep-alive override, pull, or download request is sent. Loading only happens as preparation for an explicit chat/agent turn, never on model selection or model-list refresh. Existing allocations without `context_length` remain unknown.
- LM Studio: [`GET /api/v1/models`](https://lmstudio.ai/docs/developer/rest/list), using `loaded_instances[].config.context_length`. Exact instance IDs take precedence. A model key routing to multiple instances uses the smallest allocation only when every candidate reports a valid size. `max_context_length` is ignored. Unloaded models, old servers, and ambiguous aliases remain unknown; configure a custom budget or load the model in LM Studio first.
- llama.cpp: [`GET /props`](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md), using `default_generation_settings.n_ctx` as a per-slot value, without dividing by `total_slots` again. Requires `/v1/models` to identify exactly one model matching the requested ID. The request includes an encoded model query and `autoload=false`. Global properties from a multi-model gateway are not assumed to describe the selected model.
- Luma sharing / compatible gateways: fresh model-specific `luma_context` from `/v1/models`. Paired peers receive only this request, with existing pinned TLS trust preserved.

All values must be positive safe integers. No generic `context_length`, training maximum, filename heuristic, or output-token cap is treated as an active allocation.

## Transport and limitations

Requests use the configured provider root (including any path prefix), bearer token, and pinned peer certificate where applicable. Native discovery GETs run concurrently, time out after 2 seconds, reject redirects, and cap responses at 2 MiB. Ollama loading has a 120-second timeout. Abort signals cancel discovery/loading; optional API errors return unknown, without logging credentials or response bodies. Non-OpenAI providers are not probed.

An aggregator that hides native APIs and does not publish model-specific `luma_context` needs a per-model custom budget in provider settings. Missing native APIs or a failed load do not prevent an ordinary completion attempt; ModelContextWindow supplies a labeled safety fallback. No backend settings are modified. Cancellation disconnects the request but a backend may finish a load already in progress.
