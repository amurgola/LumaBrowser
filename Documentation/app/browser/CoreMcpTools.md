# CoreMcpTools

`app/browser/CoreMcpTools.js`

Registers the core MCP tool sets as direct service calls.

## Methods

- `new CoreMcpTools(ctx)`.
- `register({ browserService, llmFallbackService, desktopService })`:
  - `core.browser`: `BrowserMcpTools.TOOLS` with `createDirectHandler(browserService, llmFallbackService, networkInterceptor)`;
  - `core.desktop`: `DesktopMcpTools.TOOLS` with `new DesktopMcpTools(desktop).handler()`;
  - `core.games`: a [GameService](../../core/games/GameService.md) over
    `new GameController({ desktop })` and `new GameSessionStore({ dir: <userData>/games })`
    (published `__lumaGames`), with `GamesMcpTools`;
  - `core.delegation`: [DelegationTools](../../core/llm-server/chat/delegation/DelegationTools.md)
    over `ChatModeRegistry.shared`, reading `global.__lumaChatRouter` per call;
  - then `restGateway.mountMcpProxy(mcpAggregator)` (what `mcp-server.js` calls);
  - and `core.disabledApiGroups`: each `ext.<id>` group's routes answer 503.
- `CoreMcpTools.SOURCES` the four source ids.
