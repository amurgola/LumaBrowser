# OpenCodeConnector

`core/shell/harness-connections/connectors/OpenCodeConnector.js`

Connects OpenCode (`id: 'opencode'`, executable `opencode`, JSON/JSONC).

## Plan

In the OpenCode config file (see `HarnessConnections.paths`):

- `provider.lumabrowser = { npm: "@ai-sdk/openai-compatible", name, options: { baseURL, apiKey }, models }`;
- `mcp.luma-browser = { type: "local", command: [command, ...args], enabled: true, environment }`;
- `model = "lumabrowser/<model>"` when a model is loaded.

## Ownership

- Connected while our provider uses the openai-compatible package at our base URL.
- Any `lumabrowser/...` model is ours; our provider entry is ours while it targets our URL.

## Legacy

`legacyPriors` maps the old `{ model, setModel }` restore record.
