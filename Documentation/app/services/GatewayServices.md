# GatewayServices

`app/services/GatewayServices.js`

Builds the app's outward surfaces.

## Methods

- `new GatewayServices(ctx)`; `build()`:
  - `ipcBridge`;
  - resolves `ctx.apiPort` (`LUMA_API_PORT`, else `core.apiPort`, else 3000)
    and `ctx.apiEnabled` (`core.apiEnabled`, default true);
  - `restGateway` on that port with `apiSecurity` and the raw-body prefix `/hooks`;
  - `cliHandshake` (published as `__lumaCliHandshake`), `cliShim` (launcher
    target `APPIMAGE` or the exec path; CLI source `resources/cli` packaged,
    `<root>/cli` in dev), `idePlugin` and `vscodeExtension` (from
    `resources/ide/` packaged, `<root>/ide/dist/` in dev);
  - `dashboardService`; while the API is on, the LLM server and the dashboard
    load their tabs from `http://127.0.0.1:<port>`;
  - `mcpAggregator`, restoring `core.disabledMcpTools`.
