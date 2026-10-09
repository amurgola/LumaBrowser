# SharingRouter

`core/network-sharing/host/routes/SharingRouter.js`

The Express router for the Network Sharing host surface, mounted at `/sharing`
on the REST gateway, the TLS listener and the web backend. Routing only: it
wires [SharingAuth](SharingAuth.md) and the route groups to their services.

## Methods

- `SharingRouter.create(service, { modeRegistry })` returns an
  `express.Router`. `service` is the [SharingHostService](../SharingHostService.md);
  `modeRegistry` (tests) defaults to `ChatModeRegistry.shared`. One
  [LiveTurnRegistry](../llm/LiveTurnRegistry.md) and one
  [SharedAgents](../SharedAgents.md) per router. The origin policy runs first
  on every route.

## Routes

| Route | Auth | Group |
|---|---|---|
| `GET /info` | none | [DiscoveryRoutes](DiscoveryRoutes.md) |
| `POST /pair` | enabled | DiscoveryRoutes |
| `GET /resources` | token | DiscoveryRoutes |
| `POST /rpc/acquire`, `/rpc/heartbeat`, `/rpc/release` | token + shareGpus | [GpuLendRoutes](GpuLendRoutes.md) |
| `GET /llm/v1/models` | token | [LlmRoutes](LlmRoutes.md) |
| `POST /llm/v1/chat/completions`, `/llm/v1/chat/abort`, `/llm/v1/responses` | token | LlmRoutes |
| `GET /artifacts/:id` | token | [ArtifactRoutes](ArtifactRoutes.md) |
| `GET /artifacts/:id/view` | browser (text errors) | ArtifactRoutes |
| `GET`, `POST /artifact-data/:rootId` | browser (JSON errors) | ArtifactRoutes |
| `GET /agents`, `/chat/modes` | token | [AgentRoutes](AgentRoutes.md) |
| `GET /agents/chat-ui.js` | browser (text errors) | AgentRoutes |
| `POST /image/generate`, `/image/edit` | token | [MediaRoutes](MediaRoutes.md) |
| `GET /voice/status` | token | MediaRoutes |
| `POST /voice/prewarm`, `/voice/transcribe`, `/voice/synthesize` | token + voice shared | MediaRoutes |

"token" is the Authorization header only (pairing token or core API key);
"browser" also accepts the `luma_share_token` cookie or `?token=`.

## Why

Deliberately not under `/api`: it bypasses the API-key middleware and uses its
own PIN and token auth. The OpenAI-compatible LLM surface means a paired client
just adds an ordinary OpenAI provider pointed at `<peer>/sharing/llm`.
