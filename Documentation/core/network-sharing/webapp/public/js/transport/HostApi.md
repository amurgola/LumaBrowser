# HostApi

`core/network-sharing/webapp/public/js/transport/HostApi.js`

The host's discovery, pairing, model, capability, agent and artifact calls.

## Methods

- `new HostApi({ http, token, userAgent })`.
- `info()`: `GET /sharing/info` (no auth); throws `Host not reachable`.
- `pair(pin)`: `POST /sharing/pair` `{ pin (trimmed), peerHint: 'Web · <platform>' }`;
  stores token and host name, resolves `{ name }`. Throws the host's `error`, or
  `Too many attempts. Wait and retry.` (429) / `Pairing failed`, with `err.status`.
- `listModels()`: `GET /sharing/llm/v1/models` to `[{ id, label (luma_label or id), kind (luma_kind or 'remote') }]`;
  401 throws Unauthorized, other failures `Could not load models`.
- `hostCapabilities()`: `GET /sharing/resources` `.thinking`, or `null` on any failure.
- `listAgents()` / `listChatModes()`: `/sharing/agents` `.agents` / `/sharing/chat/modes` `.modes`;
  401 throws, other failures give `[]`.
- `fetchArtifact(id)`: `GET /sharing/artifacts/<id>` to `{ id, title, type, mime, content }`.
- `HostApi.platformHint(userAgent)`: `iOS`, `Android`, `Mac`, `Windows`, `Linux` or `browser`.
