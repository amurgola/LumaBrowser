# Local API

LumaBrowser serves the chat model loaded in its LLM tab as an API on this computer only. It is off by default: turn on "Serve on 127.0.0.1" under Settings, LLM, Local API. The default port is 8317. Nothing here starts a model; with no model loaded every inference route answers 503 with a plain message.

The listener binds 127.0.0.1 only and needs no API key. Send any value if your client requires one.

## Base URLs

- OpenAI-compatible: `http://127.0.0.1:8317/v1`
- Anthropic-compatible: `http://127.0.0.1:8317` (clients append `/v1/messages` themselves)

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/v1/models` | Loaded model first, then every installed GGUF. Carries both OpenAI and Anthropic list fields. |
| POST | `/v1/chat/completions` | Proxied to llama-server as-is: tools, response_format, logprobs, streaming all pass through. |
| POST | `/v1/completions` | Raw completions. |
| POST | `/v1/embeddings` | When the loaded model supports it. |
| POST | `/v1/responses` | OpenAI Responses API (what Codex speaks): message, function_call and function_call_output items, function and custom tools, reasoning effort, streaming events. Stateless: `previous_response_id` is refused, built-in tools such as `web_search` are ignored. |
| POST | `/v1/messages` | Anthropic Messages API, including streaming events, tool use and tool results, images, and the thinking parameter. |
| POST | `/v1/messages/count_tokens` | A length estimate, no model call. |
| GET | `/health` | 200 with a model loaded, otherwise 503. |

One model is served at a time. Whatever model id a request names, the loaded model answers.

## Thinking

llama-server does not read a top-level `enable_thinking` field, so the Local API translates every common spelling into the knobs the server honours:

- `enable_thinking: false`
- `reasoning_budget: 0`
- `chat_template_kwargs: { "enable_thinking": false }`
- `reasoning_effort: "off" | "low" | "medium" | "high" | "xhigh"` ("default" sends nothing)
- Anthropic `thinking: { "type": "disabled" }` or `{ "type": "enabled", "budget_tokens": N }`
- Anthropic `output_config: { "effort": "low" }`
- Responses `reasoning: { "effort": "none" | "minimal" | "low" | ... }` ("none" turns thinking off, "minimal" reads as low)

A request that says nothing about thinking inherits the host's own dial position from the LLM tab.

## Examples

```sh
curl http://127.0.0.1:8317/v1/models

curl http://127.0.0.1:8317/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}],"enable_thinking":false}'

curl http://127.0.0.1:8317/v1/messages \
  -H "Content-Type: application/json" -H "anthropic-version: 2023-06-01" \
  -d '{"model":"local","max_tokens":256,"messages":[{"role":"user","content":"hello"}]}'
```

## Connecting an agent

Settings, LLM, Connect your agent writes the right config for Claude Code, Codex, OpenCode, and Cline in one click and puts it back on disconnect. Claude Code gets `ANTHROPIC_BASE_URL`, Codex a `model_providers.lumabrowser` table with `wire_api = "responses"` (a table left on the retired `"chat"` value shows as not connected; Connect rewrites it), OpenCode a `provider.lumabrowser` entry, Cline an `openai-compatible` provider. Each also gets the LumaBrowser MCP server.
