# NtfyNotifierExtension

`extensions/ntfy-notifier/NtfyNotifierExtension.js`

Main-process side of the Ntfy Notifications extension: lets the agent push
notifications to the user's phone or desktop through an ntfy server.

## Methods

- `new NtfyNotifierExtension({ mcpTools, send })`: both injectable for tests;
  `mcpTools` defaults to the require-cached `./mcp-tools.js` (the same module
  ExtensionWiring registered), `send` to `NtfyPublisher.send`.
- `activate(context)`: wraps `context.db` in [NtfySettings](NtfySettings.md),
  wires `mcpTools.configure({ getConfig })` to it (a failure is logged as
  `ntfy-notifier: failed to wire tool config:`, not fatal), registers the IPC
  channels below, resolves `{}`.
- `deactivate()`: drops the database; the tool then sees an empty config.
- `sendTest()`: `Set a default topic first.` without a topic, else sends the
  fixed test notification (title `LumaBrowser`).
- `settings()`: the current NtfySettings.

## Entry files

- `manifest.js`: id `ntfy-notifier`, requires `core:database`, a settings tab,
  `mcpTools: ./mcp-tools.js`, `renderer.js`.
- `main.js`: `{ activate, deactivate }` delegating to one instance.
- `renderer.js`: module entry (loaded by the shell as `type="module"`) that sets
  `window.__ext_ntfy_notifier` over [ui/NtfySettingsTab](ui/NtfySettingsTab.md).
- `mcp-tools.js`: `{ tools, handler, configure }` over one
  [NtfyMcpTools](NtfyMcpTools.md) instance.

## IPC (renderer contract)

`ext.ntfy-notifier.getSettings` -> `{ success, server, topic, username, hasPassword }`;
`ext.ntfy-notifier.saveSettings(patch)` -> `{ success, error? }`;
`ext.ntfy-notifier.sendTest` -> the send result.
