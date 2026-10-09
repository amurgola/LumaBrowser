# The `luma` CLI package

`cli/`

A standalone, zero-dependency npm package (`lumabrowser`) with two commands:

- `luma` ([bin/luma](bin/luma.md)): drive a LumaBrowser agent from the terminal over the current
  folder, in a full-screen session or as a plain line stream; also `luma docs`, `luma skill install`
  and `luma trace`, which need no app.
- `lumabrowser` ([bin/lumabrowser](bin/lumabrowser.md)): `npx lumabrowser start|update|version|uninstall|agent`,
  the downloader and launcher for machines without the app.

The package ships inside the app (`resources/cli`) and runs under the app's own binary in Node mode
through the launcher [CliShim](../core/shell/CliShim.md) writes, and is also published to npm. It must
never require anything outside `cli/`: the app copies only `bin`, `lib`, `package.json`, `README.md`
and `LICENSE`.

## Files that are not code

- `package.json`: name `lumabrowser`, bins `luma` and `lumabrowser`, `files` (`bin/`, `lib/`,
  `README.md`, `LICENSE`), Node 18+. The version is bumped together with the app's by the release
  script.
- `README.md`: the npm page. `LICENSE`: the AGPL-3.0 licence (same text as the root `LICENSE`).
- `lib/docs/*.md`: the `luma docs` topics (`local-api`, `api`, `tools`, `remote-access`), printed
  verbatim by [DocsCommand](lib/docs/DocsCommand.md).

## Layout

| Folder | What |
|---|---|
| `lib/` | [AgentCli](lib/AgentCli.md), [AgentArgs](lib/AgentArgs.md), [BridgeLink](lib/BridgeLink.md), [FrameWaiters](lib/FrameWaiters.md), [RollbackBuffer](lib/RollbackBuffer.md) |
| `lib/connect/` | finding or starting the app and opening the terminal bridge; self-contained, also copied into the VS Code extension |
| `lib/plain/` | the line-oriented session for print mode, `--json`, pipes and `--plain` |
| `lib/tui/` | the full-screen session: a zero-dependency differential renderer |
| `lib/trace/` | `luma trace` |
| `lib/docs/` | `luma docs` and `luma skill install` |
| `lib/launcher/` | `npx lumabrowser` |

## Wire protocol

The CLI talks to [TerminalBridge](../extensions/code-mode/terminal/TerminalBridge.md) at
`ws://127.0.0.1:<port>/api/ext/code-mode/terminal?token=<token>` (also `Authorization: Bearer`),
with the port and token from the handshake file [CliHandshake](../core/shell/CliHandshake.md) writes.
Frames are `{ type, payload }` JSON text frames; see [TerminalSession](../extensions/code-mode/terminal/TerminalSession.md)
for the vocabulary. The CLI sends `hello`, `prompt`, `followup`, `approve`, `abort` and `list-agents`.
