# NtfyMcpTools

`extensions/ntfy-notifier/NtfyMcpTools.js`

The `send_notification_ntfy` agent tool. AgentToolCatalog files it in the
"Programmatic" group (off by default) and the approval gate cards it
(`mutating: true`).

## Methods

- `NtfyMcpTools.TOOLS`: the one tool. Schema `message` (required), `title`,
  `topic`, `priority`, `tags`; deliberately no `url`, `username`, `password`
  or `channel`.
- `configure({ getConfig })`: the settings getter (ignored unless a
  function). Until configured, an empty default config.
- `handle(toolName, args)`: throws `Unknown ntfy-notifier tool: <name>` for
  any other name. The topic is `args.topic` (trimmed) or the configured one;
  with neither it answers `NO_TOPIC_ERROR` (asks the user to set a default
  topic). Otherwise [NtfyPublisher](NtfyPublisher.md)`.send` with the
  configured server (ntfy.sh when empty) and credentials. Returns
  `{ content: [{ type: 'text', text: JSON.stringify(result) }], isError: !result.success }`.
