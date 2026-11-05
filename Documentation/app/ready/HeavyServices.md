# HeavyServices

`app/ready/HeavyServices.js`

The heavy half of startup, exposed by [WindowServices](../browser/WindowServices.md)
and run by [DeferredServices](DeferredServices.md).

## Methods

- `new HeavyServices(ctx, { browserService, log?, inspectConflict?, timers? })`:
  `inspectConflict` defaults to `PortConflict.inspect`; `timers`
  (`{ setTimeoutFn, clearTimeoutFn }`) reach the binder. Both are test seams.
- `run()`:
  1. With the API on, bind the gateway through a [GatewayBinder](GatewayBinder.md)
     (not awaited): the configured port is retried until it binds, never
     replaced. Once listening:
     log `REST API server running on http://localhost:<port>`, write the CLI
     handshake, refresh an installed `luma` launcher, JetBrains plugin and VS
     Code extension (never a fresh install, except that the JetBrains plugin's
     "install automatically" switch makes its refresh cover every IDE found;
     each best-effort; skipped entirely
     when `ctx.isolatedDataDir`, so a custom `LUMA_DATA_DIR` run never rewrites
     the user's real installs), and
     `notifyGatewayReady()` on the LLM server and the dashboard so a tab that
     failed its http load before the gateway listened reloads. With the API
     off, log `REST API server is disabled via settings`.

     The first failed bind (logged `Failed to start REST server:` by the
     binder) is diagnosed once with [PortConflict](PortConflict.md) and the
     answer stored on `restGateway.conflict` for the Settings card and the
     LLM tab's banner:
     - another LumaBrowser already serves the port: one LumaBrowser runs at a
       time, so this copy logs it, stops retrying, shows an info dialog
       ("LumaBrowser is already running", skipped without a live window or
       under `LUMA_DOCKER`) and `app.quit()`s. The per-profile
       single-instance lock in [ProcessSetup](../process/ProcessSetup.md)
       catches the same-profile case earlier; this catches a second copy on
       another data dir (a portable build next to an installed one).
     - anything else: one error log naming the holder when known, and one
       desktop notice ("Local API server could not start": port, holder, what
       needs it) whose click raises the window and opens Settings > API & MCP
       over the `tab-view:accelerator` channel. Retries continue.
  2. `await extensionManager.activate()` (a failure logs `Extension activation error:`).
  3. `ctx.agentDeps` = [AgentDeps](AgentDeps.md)`.build(...)`.
  4. Start the artifact-task and scheduled-task schedulers; reconcile the
     folder watches; subscribe the page-change and notification sources.
