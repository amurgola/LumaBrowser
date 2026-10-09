# ClaudeCodeConnector

`core/shell/harness-connections/connectors/ClaudeCodeConnector.js`

Connects Claude Code (`id: 'claude-code'`, executable `claude`, JSON).

## Plan

- `settings.json` (`$CLAUDE_CONFIG_DIR` or `~/.claude`): `env.ANTHROPIC_BASE_URL`
  (the Local API origin), `env.ANTHROPIC_AUTH_TOKEN` (`lumabrowser-local`: without a
  token Claude Code asks for a login), `env.CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY = "1"`,
  and `model` when a model is loaded.
- `~/.claude.json`: `mcpServers.luma-browser = { command, args, env }` (user scope).

## Ownership

- Connected while `env.ANTHROPIC_BASE_URL` is ours and model discovery is on.
- Any string `model` is ours while the base URL is still the one we wrote (the user
  picked it from our model list); otherwise only the exact values we wrote are ours.

## Legacy

`legacyPriors` maps the old `{ env, model, setModel }` restore record.
