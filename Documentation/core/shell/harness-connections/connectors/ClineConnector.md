# ClineConnector

`core/shell/harness-connections/connectors/ClineConnector.js`

Connects the Cline CLI (`id: 'cline'`, executable `cline`, JSON).

## Plan

In Cline's settings folder (`CLINE_PROVIDER_SETTINGS_PATH`, `CLINE_DATA_DIR`):

- `providers.json`: `providers.openai-compatible.settings` (provider, `apiKey`
  `lumabrowser-local`, `baseUrl`, `protocol: "openai-chat"`, `client`, `model` when
  loaded) and `.tokenSource = "manual"`; seeds `version: 1` and `.updatedAt` (connect
  time) only when missing; `lastUsedProvider = "openai-compatible"` when a model is loaded.
- `models.json` (only with a model): seeds `version`, sets
  `providers.openai-compatible.models.<model>` (context window, max tokens, tools).
- `cline_mcp_settings.json`: `mcpServers.luma-browser = { command, args, env, disabled: false }`.

## Ownership

- Connected while the provider settings have our `baseUrl` and protocol.
- While that holds, the settings (whatever model), token source, timestamp and the
  `openai-compatible` selection are ours. A provider the user already had is restored
  key by key on disconnect.

## Legacy

`legacyPriors` maps the old `{ provider, existing, setModel }` restore record.
