# CodexConnector

`core/shell/harness-connections/connectors/CodexConnector.js`

Connects the Codex CLI (`id: 'codex'`, executable `codex`, TOML).

## Plan

In `~/.codex/config.toml` (or `$CODEX_HOME/config.toml`):

- top-level `model_provider = "lumabrowser"`, and `model` when a model is loaded;
- `[model_providers.lumabrowser]`: `name = "LumaBrowser"`, `base_url` the Local API
  (`endpoints.openaiBaseUrl`), `wire_api = "responses"` (`WIRE_API`), and
  `stream_idle_timeout_ms = 900000` (`STREAM_IDLE_TIMEOUT_MS`, 15 minutes instead of Codex's default 5, because a
  local model still reading a long prompt sends nothing before its first token). No `env_key`:
  the Local API needs no key, and without one Codex sends no Authorization header.
  The Local API serves Codex through [OpenAiResponsesRouter](../../../llm-server/server/OpenAiResponsesRouter.md);
- `[mcp_servers.luma-browser]`: `command`, `args`, and `env` only when non-empty.

## Ownership

- Connected while `model_provider` is ours and our provider has our `base_url` and
  `wire_api = "responses"`. A table still on `"chat"` reports disconnected
  ("missing, outdated or no longer selected"), so the UI offers Connect.
- Any `model` is ours while our provider is selected; our provider table is ours while
  it targets our URL, whatever its `wire_api` (extra keys the user added go with it).

## Upgrading chat-era connections

Current Codex refuses to load a config with `wire_api = "chat"`. Because the
provider table stays ours by `base_url`, a reconnect renews its ledger entry in
place: the table is rewritten with `"responses"` and the original prior (absent,
or the user's own table of that name) is kept, so disconnect still restores the
pre-LumaBrowser state. A chat-era table with no stored manifest is likewise
recognised and removed by disconnect.

## Legacy

`legacyPriors` maps the old `{ provider, model, setModel }` restore record.
