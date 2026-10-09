# AgentCli

`cli/lib/AgentCli.js`

`luma [agent] [prompt] [flags]`: drives a LumaBrowser agent as a coding harness over the current folder.

## Methods (static)

- `AgentCli.main(argv)`: resolves the exit code (0 done, 1 error, 2 aborted, 3 app unreachable):
  1. `trace ...` goes to [TraceCommand](trace/TraceCommand.md) before parsing (it has its own flags);
  2. [AgentArgs](AgentArgs.md) parses; a bad flag prints `luma: <error>` plus `HELP` and returns 1;
  3. `--help` prints `HELP`;
  4. `docs` and `skill` go to [DocsCommand](docs/DocsCommand.md) / [SkillCommand](docs/SkillCommand.md)
     (no app, no network);
  5. bare `luma` is the Code agent (`.`);
  6. [AppDiscovery](connect/AppDiscovery.md) (auto-start unless `--no-start`) and
     [BridgeConnector](connect/BridgeConnector.md); a failure prints `luma: <message>` and returns 3;
  7. a real terminal (stdin and stdout TTYs, `TERM` not `dumb`) without `-p`, `--json`, `--agents`
     or `--plain` gets the full-screen [App](tui/session/App.md) over a [BridgeLink](BridgeLink.md);
     everything else gets a [PlainSession](plain/PlainSession.md) with a [PlainRenderer](plain/PlainRenderer.md)
     in `json`, `print` or `interactive` mode.
- `AgentCli.isInteractiveTerminal()`.
- `AgentCli.HELP`: the usage text (identical to legacy except the title line's em-dash, now a colon).
- `AgentCli.EXIT_UNREACHABLE`: 3.
